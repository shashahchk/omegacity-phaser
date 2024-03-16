import Phaser from "phaser";
import { debugDraw } from "../utils/debug";
import { createCharacterAnims } from "../anims/CharacterAnims";
import UIPlugin from "phaser3-rex-plugins/templates/ui/ui-plugin.js";
import GameUi from "~/scenes/GameUi";
import Lizard from "~/enemies/Lizard";
import * as Colyseus from "colyseus.js";
import {
  // updatePlayerAnims,
  syncPlayerWithServer,
  setUpPlayerListeners,
  setCamera,
} from "~/communications/PlayerSync";
import { ButtonCreator } from "~/components/ButtonCreator";
import { setUpVoiceComm } from "~/communications/SceneCommunication";
import { setUpSceneChat, checkIfTyping } from "~/communications/SceneChat";
import { UsernamePopup } from "~/components/UsernamePopup";
import ClientPlayer from "~/character/ClientPlayer";
import { Hero, Monster, createCharacter } from "~/character/Character";

export default class Game extends Phaser.Scene {
  rexUI: UIPlugin;
  private client: Colyseus.Client;
  private cursors!: Phaser.Types.Input.Keyboard.CursorKeys; //trust that this will exist with the !
  private faune: ClientPlayer;
  private recorder: MediaRecorder | undefined;
  private room: Colyseus.Room | undefined; //room is a property of the class
  private xKey!: Phaser.Input.Keyboard.Key;
  private ignoreNextClick: boolean = false;
  private currentLizard: Lizard | undefined;
  private dialog: any;
  private popUp: any;
  private mediaStream: MediaStream | undefined;
  private recorderLimitTimeout = 0;
  private queueDisplay?: Phaser.GameObjects.Text;
  private queueList: string[] = [];
  private currentUsername: string | undefined;
  // a map that stores the layers of the tilemap
  private layerMap: Map<string, Phaser.Tilemaps.TilemapLayer> = new Map();
  private monsters!: Phaser.Physics.Arcade.Group | undefined;
  private playerEntities: {
    [sessionId: string]: Phaser.Physics.Arcade.Sprite;
  } = {};
  private isFocused = false;
  private inputPayload = {
    left: false,
    right: false,
    up: false,
    down: false,
  };

  constructor() {
    super("game");
    this.client = new Colyseus.Client("ws://localhost:2567");
  }

  preload() {
    //create arrow and spacebar
    // @ts-ignore
    this.load.scenePlugin({
      key: "rexuiplugin",
      url: "https://raw.githubusercontent.com/rexrainbow/phaser3-rex-notes/master/dist/rexuiplugin.min.js",
      sceneKey: "rexUI",
    });
    if (this.input.keyboard) {
      this.cursors = this.input.keyboard.createCursorKeys();
      this.xKey = this.input.keyboard.addKey(
        Phaser.Input.Keyboard.KeyCodes.X,
        false,
      );
    }
  }

  async create(data) {
    this.room = await this.client.joinOrCreate("my_room", {
      username: data.username,
    });
    this.currentUsername = data.username;
    try {
      this.setupTileMap(0, 0);

      setUpSceneChat(this, "game");

      setUpVoiceComm(this);

      createCharacterAnims(this.anims);

      this.addMainPlayer(data.username, data.char_name);

      createCharacter("", this, Monster.Monster1, 130, 60);
      createCharacter("", this, Monster.Grimlock, 200, 60);
      createCharacter("", this, Monster.Golem1, 300, 60);
      createCharacter("", this, Monster.Golem2, 400, 60);

      this.collisionSetUp();

      setUpPlayerListeners(this);
    } catch (e) {
      console.error("join error", e);
    }

    this.room.send("playerJoined");

    try {
      this.setBattleQueueInteractiveUi();
      this.setBattleQueueListeners();
    } catch (e) {
      console.error("join queue error", e);
    }
  }

  update(t: number, dt: number) {
    // check if all the fields are initialised if not dont to update
    if (
      !this.cursors ||
      !this.faune ||
      !this.room ||
      this.scene.isActive("battle")
    )
      return;
    //have listener to handle the updating of animations already
    // return if the user is typing
    if (checkIfTyping()) return;

    syncPlayerWithServer(this);
  }

  // set up the map and the different layers to be added in the map for reference in collisionSetUp
  private setupTileMap(x_pos, y_pos) {
    const map = this.make.tilemap({ key: "user_room" });
    const tileSetInterior = map.addTilesetImage("Interior", "Interior"); //tile set name and image key
    const tileSetModern = map.addTilesetImage("modern", "modern"); //tile set name and image key

    //floor layer
    const floorLayer = map.createLayer("Floor", tileSetModern);
    floorLayer.setPosition(x_pos, y_pos);

    //wall layer
    const wallLayer = map.createLayer("Walls", tileSetModern);
    wallLayer.setPosition(x_pos, y_pos);
    wallLayer.setCollisionByProperty({ collides: true });
    this.layerMap.set("wallLayer", wallLayer);
    debugDraw(wallLayer, this);

    //interior layer
    const interiorLayer = map.createLayer("Interior", tileSetInterior);
    interiorLayer.setPosition(x_pos, y_pos);
    // interiorLayer.setCollisionByProperty({ collides: true });
    this.layerMap.set("interiorLayer", interiorLayer);
  }

  // set up the collision between different objects in the game
  private collisionSetUp() {
    this.physics.add.collider(this.faune, this.layerMap.get("wallLayer"));
    // this.physics.add.collider(this.faune, this.layerMap.get("interiorLayer"));
    console.log("collision set up");
  }

  // create the enemies in the game, and design their behaviors
  private createEnemies() {
    console.log("enemies set up");
    return;
  }

  async displayJoinQueueButton() {
    ButtonCreator.createButton(this, {
      x: 10,
      y: 40,
      width: 80,
      height: 40,
      text: "Join Queue",
      onClick: () => {
        if (this.room && this.currentUsername) {
          console.log("Sending Join queue message", this.currentUsername);
          this.room.send("joinQueue", { data: this.currentUsername });
          console.log("Join queue request sent");
        }
      },
      onHover: (button, buttonText) => {
        button.setInteractive({ useHandCursor: true });
        buttonText.setStyle({ fill: "#37e41b" });
      },
      onOut: (button, buttonText) => {
        button.setInteractive({ useHandCursor: true });
        buttonText.setStyle({ fill: "#555555" });
      },
    });

    this.displayQueueList();
  }

  async displayQueueList() {
    const style = { fontSize: "18px", fill: "#FFF", backgroundColor: "#000A" };
    const text =
      "In Queue: " +
      (this.queueList.length > 0
        ? this.queueList
            .map((username) =>
              username === this.currentUsername ? "Me" : username,
            )
            .join(", ")
        : "No players");

    if (!this.queueDisplay) {
      this.queueDisplay = this.add
        .text(10, 20, text, style)
        .setScrollFactor(0)
        .setDepth(30);
    } else {
      this.queueDisplay.setText(text);
    }
  }

  async showLeavePopup(username) {
    const text = `${username} has left the queue...`;
    console.log(text);
    const popupStyle = {
      fontSize: "16px",
      fill: "#fff",
      backgroundColor: "#333A",
      padding: { x: 10, y: 5 },
      align: "center",
    };
    let popupText = this.add
      .text(
        this.cameras.main.centerX,
        this.cameras.main.centerY,
        text,
        popupStyle,
      )
      .setScrollFactor(0)
      .setOrigin(0.5);

    // Remove the popup after a few seconds
    setTimeout(() => {
      popupText.destroy();
    }, 3000);
  }

  async hideQueueList() {
    if (this.queueDisplay) {
      this.queueDisplay.destroy();
      this.queueDisplay = undefined;
    }
  }

  async displayLeaveQueueButton() {
    ButtonCreator.createButton(this, {
      x: 10,
      y: 85,
      width: 80,
      height: 40,
      text: "Leave Queue",
      onClick: () => {
        if (this.room && this.currentUsername) {
          this.room.send("leaveQueue", { data: this.currentUsername });
          console.log("Leave queue request sent");
        }
      },
      onHover: (button, buttonText) => {
        buttonText.setStyle({ fill: "#ff0000" });
      },
      onOut: (button, buttonText) => {
        buttonText.setStyle({ fill: "#555555" });
      },
    });
  }

  async setBattleQueueInteractiveUi() {
    this.displayJoinQueueButton();
    this.displayLeaveQueueButton();
  }

  async addMainPlayer(username: string, char_name: string) {
    if (char_name === undefined) {
      char_name = "hero3";
      console.log("undefined char name");
    }

    //create sprite of cur player and set camera to follow
    this.faune = new ClientPlayer(
      this,
      130,
      60,
      username,
      "faune",
      "walk-down-3.png",
      char_name,
    );
    setCamera(this.faune, this.cameras);
  }

  async setBattleQueueListeners() {
    if (!this.room) {
      return;
    }
    this.room.onMessage("queueUpdate", (message) => {
      this.queueList = message.queue;
      console.log("Queue updated:", this.queueList);
      this.displayQueueList();
    });

    this.room.onMessage("leaveQueue", (message) => {
      const username = message.username;
      this.showLeavePopup(username);
      this.queueList = message.queue;
      console.log("Queue updated:", this.queueList);
      this.displayQueueList();
      console.log("leaveQueue", message);
    });

    this.room.onMessage("startBattle", (message) => {
      console.log("startBattle", message);

      let battleNotification = this.add
        .text(this.cameras.main.width / 2, this.cameras.main.height / 2, "Battle Starts in 3...", {
          fontSize: "32px",
          color: "#fff",
        })
        .setScrollFactor(0);

      // add a countdown to the battle start
      let countdown = 3; // Start countdown from 3
      let countdownInterval = setInterval(() => {
        countdown -= 1; // Decrease countdown by 1
        if (countdown > 0) {
          // Update text to show current countdown value
          battleNotification.setText(`Battle Starts in ${countdown}...`);
        } else {
          // When countdown reaches 0, show "Battle Starts!" and begin fade out
          battleNotification.setText("Battle Starts!");
          this.tweens.add({
            targets: battleNotification,
            alpha: 0,
            ease: "Power1",
            duration: 1000,
            onComplete: () => {
              battleNotification.destroy();
              clearInterval(countdownInterval);

              this.room.leave();
              this.scene.start("battle", { username: this.currentUsername });
            },
          });
        }
      }, 1000);
    });
  }
}
