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
import { createCharacter } from "~/character/Character";
import ClientInBattleMonster from "~/character/ClientInBattleMonster";
import { createPropsAnims } from "~/anims/PropsAnims";
import { MonsterEnum } from "../../types/CharacterTypes";

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
  private golem1: ClientInBattleMonster | undefined;
  private redFlag: Phaser.GameObjects.Sprite | undefined;
  private blueFlag: Phaser.GameObjects.Sprite | undefined;
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

  createKillMonsterButton() {
    ButtonCreator.createButton(this, {
      x: 200,
      y: 200,
      width: 80,
      height: 40,
      text: "Kill Monster",
      onClick: () => {
        if (this.golem1) {
          this.golem1.die();
          // this.golem1 = undefined;
        }
      },
      onHover: (button, buttonText) => {
        button.setInteractive({ useHandCursor: true });
        buttonText.setStyle({ fill: "#ff0000" });
      },
      onOut: (button, buttonText) => {
        button.setInteractive({ useHandCursor: true });
        buttonText.setStyle({ fill: "#555555" });
      },
    });
  }

  createFlags() {
    this.redFlag = this.add.sprite(300, 300, "red-flag", "red-flag-0");
    this.redFlag.anims.play("red-flag");

    this.blueFlag = this.add.sprite(200, 200, "blue-flag", "blue-flag-0");
    this.blueFlag.anims.play("blue-flag");
  }

  async create(data) {
    this.cameras.main.setZoom(1.5);

    this.sound.pauseOnBlur = false;

    // const music = this.sound.add('dafunk');

    // music.play();

    this.room = await this.client.joinOrCreate("game", { username: data.username, charName: data.charName, playerEXP: data.playerEXP });
    this.currentUsername = data.username;
    this.currentplayerEXP = data.playerEXP;
    this.currentCharName = data.charName;
    try {
      this.setupTileMap(0, 0);

      setUpSceneChat(this, "game");

      setUpVoiceComm(this);

      createPropsAnims(this.anims);

      this.addMainPlayer(data.username, data.charName, data.playerEXP);

      // this.createKillMonsterButton();

      this.golem1 = createCharacter("", this, MonsterEnum.Golem1, 300, 60, 0) as ClientInBattleMonster;

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
    console.log("loading tilsets")
    const map = this.make.tilemap({ key: "user_room" });
    console.log("make tilemap success")
    const tileSetInterior = map.addTilesetImage("Interior", "Interior"); //tile set name and image key
    const tileSetModern = map.addTilesetImage("modern", "modern"); //tile set name and image key
    const tileSetOverWorld = map.addTilesetImage("Overworld", "Overworld");
    const tileSetCave = map.addTilesetImage("cave", "cave");
    console.log("made interior and modern")
    const tileSetSlates = map.addTilesetImage("slates", "slates");
    console.log("loading floor layer")
    //floor layer
    const floorLayer = map.createLayer("Floor", tileSetModern);
    const floorLayerSlates = map.createLayer("Floor_Slate", tileSetSlates);


    floorLayer.setPosition(x_pos, y_pos);
    floorLayerSlates.setPosition(x_pos, y_pos);

    //wall layer
    const wallLayer = map.createLayer("Walls", tileSetModern);
    wallLayer.setPosition(x_pos, y_pos);
    wallLayer.setCollisionByProperty({ collides: true });
    this.layerMap.set("wallLayer", wallLayer);
    debugDraw(wallLayer, this);

    const wallLayerSlates = map.createLayer("Walls_Slate", tileSetSlates);
    wallLayerSlates.setPosition(x_pos, y_pos);
    wallLayerSlates.setCollisionByProperty({ collides: true });
    //this.layerMap.set("wallLayer", wallLayer);
    //debugDraw(wallLayer, this);

    const wallLayerOverworld = map.createLayer("Walls_Overworld", tileSetOverWorld);
    wallLayerOverworld.setPosition(x_pos, y_pos);
    wallLayerOverworld.setCollisionByProperty({ collides: true });

    const nc_interiorLayer = map.createLayer("not_collidable interior", tileSetInterior);
    nc_interiorLayer.setPosition(x_pos, y_pos);
    this.layerMap.set("not_collidable interior", nc_interiorLayer);

    const nc_interiorLayerSlates = map.createLayer("not_collidable interior_Slate", tileSetSlates);
    nc_interiorLayerSlates.setPosition(x_pos, y_pos);

    const nc_interiorLayerOverworld = map.createLayer("not_collidable interior_Overworld", tileSetOverWorld);
    nc_interiorLayerOverworld.setPosition(x_pos, y_pos);
    this.layerMap.set("not_collidable interior_Overworld", nc_interiorLayerOverworld);

    //interior layer
    const interiorLayer = map.createLayer("Interior", tileSetInterior);
    interiorLayer.setPosition(x_pos, y_pos);
    // interiorLayer.setCollisionByProperty({ collides: true });
    this.layerMap.set("interiorLayer", interiorLayer);

    const interiorLayerOverworld = map.createLayer("Interior_Overworld", tileSetOverWorld);
    interiorLayerOverworld.setPosition(x_pos, y_pos);

    const interiorLayerSlates = map.createLayer("Interior_Slate", tileSetSlates);
    interiorLayerSlates.setPosition(x_pos, y_pos);
    // interiorLayer.setCollisionByProperty({ collides: true });

    console.log("loading overworld layer")
    //overworld layer
    const overlayLayer = map.createLayer("Overlays", tileSetSlates);
    overlayLayer.setPosition(x_pos, y_pos);

    const overlayLayerOverworld = map.createLayer("Overlays_Overworld", tileSetOverWorld);
    overlayLayer.setPosition(x_pos, y_pos)
    //this.layerMap.set("overworldLayer", overworldLayer);

    //     const caveLayer = map.createLayer("Overlays", tileSetCave);
    //             caveLayer.setPosition(x_pos, y_pos)
    //             this.layerMap.set("caveLayer", caveLayer);

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
      x: this.cameras.main.width / 2 - 400,
      y: this.cameras.main.height / 2 - 200,
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
        .text(this.cameras.main.width/2 - 400, this.cameras.main.height / 2 - 250, text, style)
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
      x: this.cameras.main.width / 2 - 400,
      y: this.cameras.main.height / 2 - 150,
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

      // background for the battle start notification
      const background = this.add.graphics({ fillStyle: { color: 0x000000 } });
      background.fillRect(0, 0, this.cameras.main.width, this.cameras.main.height);
      background.alpha = 0.8;
      background.depth = 1000;

      let battleNotification = this.add
        .text(this.cameras.main.centerX, this.cameras.main.centerY,
          "Battle Starts in 3...", {
          fontSize: "32px",
          color: "#fff",
        })
        .setScrollFactor(0)
        .setOrigin(0.5);

      battleNotification.depth = 1500;

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
