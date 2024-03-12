import Phaser from "phaser";
import { debugDraw } from "../utils/debug";
// import { Client } from "@colyseus/core";
import { createLizardAnims } from "../anims/EnemyAnims";
import { createCharacterAnims } from "../anims/CharacterAnims";
import UIPlugin from "phaser3-rex-plugins/templates/ui/ui-plugin.js";
import GameUi from "~/scenes/GameUi";
import Lizard from "~/enemies/Lizard";
import * as Colyseus from "colyseus.js";
import {
  SetupPlayerAnimsUpdate,
  SetupPlayerOnCreate,
  SetUpPlayerSyncWithServer,
  SetUpPlayerListeners,
} from "~/anims/PlayerSync";
import { ButtonCreator } from "~/components/ButtonCreator";
import { setUpVoiceComm } from "~/communications/SceneCommunication";
import { setUpSceneChat, checkIfTyping } from "~/communications/SceneChat";
import { UsernamePopup } from "~/components/UsernamePopup";

type PlayerEntity = {
  sprite: Phaser.GameObjects.Sprite;
  usernameLabel: Phaser.GameObjects.Text;
};


export default class Game extends Phaser.Scene {
  rexUI: UIPlugin;
  private client: Colyseus.Client;
  private cursors!: Phaser.Types.Input.Keyboard.CursorKeys; //trust that this will exist with the !
  private faune!: Phaser.Physics.Arcade.Sprite;
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
  private currentUsernameList: string[] = [];
  private usernameDisplay: any;
  // a map that stores the layers of the tilemap
  private layerMap: Map<string, Phaser.Tilemaps.TilemapLayer> = new Map();
  private monsters!: Phaser.Physics.Arcade.Group | undefined;
  private playerEntities: { [sessionId: string]: PlayerEntity } = {};
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
    this.room = await this.client.joinOrCreate("my_room", {});

    try {
      this.setupTileMap(0, 0);
      // set up user name first so that UI can reference it
      this.currentUsername = data.username;

      setUpSceneChat(this, "game");

      setUpVoiceComm(this);

      createCharacterAnims(this.anims);

      this.setMainCharacterSprite();

      this.setUpUsernames(data.username);

      this.setUpUsernamesDisplay(data.username);

      this.collisionSetUp();

      SetUpPlayerListeners(this);
    } catch (e) {
      console.error("join error", e);
    }

    this.room.send("player_joined");

    this.room.onMessage("username_update", (message) => {
      const { sessionId, username } = message;

      // Check if the player entity exists
      const playerEntity = this.playerEntities[sessionId];
      if (playerEntity) {
        playerEntity.usernameLabel.setText(username);
      }
    });

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
    SetupPlayerAnimsUpdate(this.faune, this.cursors);

    // return if the user is typing
    if (checkIfTyping()) return;

    SetUpPlayerSyncWithServer(this);
    Object.values(this.playerEntities).forEach(({ sprite, usernameLabel }) => {
      if (usernameLabel) {
        usernameLabel.x = sprite.x;
        usernameLabel.y = sprite.y - 20; // Adjust based on your sprite's height
      }
    });

    // If there's a specific username display for the main character (faune), update it here as well
    if (this.usernameDisplay) {
      this.usernameDisplay.setPosition(this.faune.x, this.faune.y - 20);
    }
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

  async addPlayerListeners() {
    if (!this.room) {
      return;
    }
    //listen for new players, state change, leave, removal
    this.room.state.players.onAdd((player, sessionId) => {
      console.log("new player joined game room!", sessionId);
      var entity;
      // Only create a player sprite for other players, not the local player
      if (sessionId !== this.room.sessionId) {
        entity = this.physics.add.sprite(
          player.x,
          player.y,
          "faune",
          "faune-idle-down",
        );
      } else {
        entity = this.faune;
      }

      // keep a reference of it on `playerEntities`
      this.playerEntities[sessionId] = entity;

      // listening for server updates
      player.onChange(() => {
        // Update local position immediately
        entity.x = player.x;
        entity.y = player.y;

        // Assuming entity is a Phaser.Physics.Arcade.Sprite and player.pos is 'left', 'right', 'up', or 'down'
        const direction = player.direction; // This would come from your server update
        var animsDir;
        var animsState;

        switch (direction) {
          case "left":
            animsDir = "side";
            entity.flipX = true; // Assuming the side animation faces right by default
            break;
          case "right":
            animsDir = "side";
            entity.flipX = false;
            break;
          case "up":
            animsDir = "up";
            break;
          case "down":
            animsDir = "down";
            break;
        }

        // console.log(player.isMoving)

        if (player.isMoving) {
          animsState = "walk";
        } else {
          animsState = "idle";
        }
        entity.anims.play("faune-" + animsState + "-" + animsDir, true);
      });
    });

    this.room.onMessage("player_leave", (message) => {
      // Listen to "player_leave" message
      let entity = this.playerEntities[message.sessionId];
      if (entity) {
        entity.destroy();
        delete this.playerEntities[message.sessionId];
      }
      console.log("player_leave", message);
    });

    this.room.state.players.onRemove((player, sessionId) => {
      const entity = this.playerEntities[sessionId];
      if (entity) {
        // destroy entity
        entity.destroy();
        this.room.state.players.onRemove((player, sessionId) => {
          const entity = this.playerEntities[sessionId];
          if (entity) {
            // destroy entity
            entity.destroy();

            // clear local reference
            delete this.playerEntities[sessionId];
          }
        });
      }
    });
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
            .map((userName) =>
              userName === this.currentUsername ? "Me" : userName,
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

  async setMainCharacterSprite() {
    //create sprite of cur player and set camera to follow
    this.faune = this.physics.add.sprite(130, 60, "faune", "walk-down-3.png");
    SetupPlayerOnCreate(this.faune, this.cameras);
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
      const userName = message.userName;
      this.showLeavePopup(userName);
      this.queueList = message.queue;
      console.log("Queue updated:", this.queueList);
      this.displayQueueList();
      console.log("leaveQueue", message);
    });

    this.room.onMessage("startBattle", (message) => {
      console.log("startBattle", message);

      let battleNotification = this.add
        .text(100, 100, "Battle Starts in 3...", {
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

  private setUpUsernames(username) {
    // tell the server whats your username
    this.currentUsernameList.push(username);
    this.currentUsername = username;
    if (this.room) this.room.send("set_username", this.currentUsername);
    // announce to the game that you have joined
    this.room.send("player_joined");

    this.events.emit("username_set", this.currentUsername);
    console.log("Game.ts");
  }

  private setUpUsernamesDisplay(username) {
    if (this.usernameDisplay) {
      this.usernameDisplay.destroy();
    }

    console.log("Setting up username display for", username);
    this.usernameDisplay = this.rexUI.add
      .label({
        x: this.faune.x,
        y: this.faune.y - 40,


        background: this.rexUI.add.roundRectangle(0, -20, 80, 20, 10, 0x0e376f),
        text: this.add.text(this.faune.x, this.faune.y - 40, username, {
          fontFamily: '"Press Start 2P", cursive',
          fontSize: "10px",
          color: "#ffffff",
        }),
        space: {
          left: 5,
          right: 5,
          top: 5,
          bottom: 5,
        },
      })
      .layout()
      .popUp(500);
  }

  setUpOtherUsernamesDisplay(username, sessionId) {
    const playerEntity = this.playerEntities[sessionId];
    console.log("Setting up username display for", username);
    let usernameLabel = this.rexUI.add
      .label({
        x: playerEntity.sprite.x,
        y: playerEntity.sprite.y - 20,
        background: this.rexUI.add.roundRectangle(0, 0, 80, 20, 10, 0x4e5d6c),
        text: this.add.text(0, 0, username, {
          fontFamily: '"Press Start 2P", cursive',
          fontSize: "10px",
          color: "#ffffff",
        }),
        space: {
          left: 5,
          right: 5,
          top: 5,
          bottom: 5,
        },
      })
      .layout()
      .setDepth(200)
      .popUp(500);
  }

  addPlayerEntity(serverPlayer): PlayerEntity {
    const playerSprite = this.physics.add.sprite(
      serverPlayer.x,
      serverPlayer.y,
      "playerSpriteKey"
    );
    const usernameLabel = this.add.text(
      playerSprite.x,
      playerSprite.y - 20,
      serverPlayer.username,
      {
        fontFamily: '"Press Start 2P", cursive',
        fontSize: "12px",
        color: "#ffffff",
      }
    );

    return { sprite: playerSprite, usernameLabel: usernameLabel };
  }
  
  
  
}
