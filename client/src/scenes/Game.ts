import Phaser from "phaser";
import { debugDraw } from "../utils/debug";
import UIPlugin from "phaser3-rex-plugins/templates/ui/ui-plugin.js";
import Lizard from "~/enemies/Lizard";
import * as Colyseus from "colyseus.js";
import {
  // updatePlayerAnims,
  setUpPlayerListeners,
  setCamera,
  // updatePlayerAnimsAndSyncWithServer,
} from "~/communications/PlayerSync";
import { ButtonCreator } from "~/components/ButtonCreator";
import { setUpVoiceComm } from "~/communications/SceneCommunication";
import { setUpSceneChat, checkIfTyping } from "~/communications/SceneChat";
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
  private queueList: any[] = [];
  private currentUsername: string | undefined;
  private currentCharName: string | undefined;
  private currentplayerEXP: number | undefined;
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
    this.room = await this.client.joinOrCreate("game", { username: data.username, charName: data.charName, playerEXP: data.playerEXP });
    this.currentUsername = data.username;
    this.currentplayerEXP = data.playerEXP;
    this.currentCharName = data.charName;
    try {
      this.setupTileMap(0, 0);

      setUpSceneChat(this, "game");

      setUpVoiceComm(this);

      this.addMainPlayer(data.username, data.charName, data.playerEXP);

      const monsterEXPnotUsed = 0;
      createCharacter("", this, Monster.Monster1, 130, 60, monsterEXPnotUsed);
      createCharacter("", this, Monster.Grimlock, 200, 60, monsterEXPnotUsed);
      createCharacter("", this, Monster.Golem1, 300, 60, monsterEXPnotUsed);
      createCharacter("", this, Monster.Golem2, 400, 60, monsterEXPnotUsed);

      this.collisionSetUp();

      setUpPlayerListeners(this);
    } catch (e) {
      console.error("join error", e);
    }

    this.room.send("playerJoined");

    try {
      console.log("before battle queue set up")
      this.setBattleQueueInteractiveUi();
      this.setBattleQueueListeners();
      this.retrieveQueueListFromServer();
      console.log("after battle queue set up")
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

    if (checkIfTyping()) return;
    this.faune.updateAnimsAndSyncWithServer(this.room, this.cursors);
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
          this.room.send("joinQueue");
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
  }

  async createOrUpdateQueueList(create = false) {
    console.log("queueDisplay", this.queueDisplay)
    const style = { fontSize: "18px", fill: "#FFF", backgroundColor: "#000A" };
    const text =
      "In Queue: " +
      (this.queueList.length > 0
        ? this.queueList
          .map((player) =>
            player.sessionId === this.room.sessionId ? "Me" : player.username,
          )
          .join(", ")
        : "No players");

    if (create) {
      console.log("Displaying queue list:", text);
      this.queueDisplay = this.add
        .text(10, 20, text, style)
        .setScrollFactor(0)
        .setDepth(1000);
    } else {
      console.log("Updating queue list:", text);

      this.queueDisplay.setText(text);
    }
  }

  async showLeavePopup(playerLeftName) {
    const text = `${playerLeftName} has left the queue...`;
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

  // async hideQueueList() {
  //   if (this.queueDisplay) {
  //     this.queueDisplay.destroy();
  //     this.queueDisplay = undefined;
  //   }
  // }

  async displayLeaveQueueButton() {
    ButtonCreator.createButton(this, {
      x: 10,
      y: 85,
      width: 80,
      height: 40,
      text: "Leave Queue",
      onClick: () => {
        if (this.room && this.currentUsername) {
          this.room.send("leaveQueue");
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

  // when player enters the room for the first time, will call this to retrieve players in queue currently 
  async retrieveQueueListFromServer() {
    this.room.send("retrieveQueueList");
  }
  
  async addMainPlayer(username: string, charName: string, playerEXP: number) {
    if (charName === undefined) {
      charName = "hero1";
    }

    if (username == undefined) {
      username = "Guest"
    }

    if (playerEXP === undefined) {
      playerEXP = 0
      console.log("undefined playerEXP")
    }

    //create sprite of cur player and set camera to follow
    this.faune = new ClientPlayer(this, 130, 60, username, "hero", `${charName}-walk-down-0`, charName, playerEXP);
    setCamera(this.faune, this.cameras);
  }

  async setBattleQueueListeners() {
    if (!this.room) {
      return;
    }
    console.log("setting up battle queue listeners")
    this.createOrUpdateQueueList(true);
    this.room.onMessage("queueUpdate", (message) => {
      this.queueList = message.queue;
      console.log("Queue updated:", this.queueList);
      this.createOrUpdateQueueList();
    });

    this.room.onMessage("leaveQueue", (message) => {
      this.showLeavePopup(message.playerLeftName);
      this.queueList = message.queue;
      console.log("Queue updated:", this.queueList);
      this.createOrUpdateQueueList();
      console.log("leaveQueue", message);
    });

    this.room.onMessage("startBattle", (message) => {
      console.log("startBattle", message);

      let battleNotification = this.add
        .text(100, 100, "Battle Starts in 3...", {
          fontSize: "32px",
          color: "#fff",
        })
        .setScrollFactor(0)
        .setOrigin(0.5);

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
              this.destroyQueueDisplay();

              this.room.leave().then(() => {
                this.scene.start("battle", { username: this.currentUsername, charName: this.currentCharName, playerEXP: this.currentplayerEXP });
              }).catch(error => {
                console.error("Failed to join room:", error);

              });
            }
          });
        }
      }, 1000);
    }

    );
  }

  destroyQueueDisplay() {
    console.log('destroying queue display')
    this.queueDisplay?.destroy();
  }
}
