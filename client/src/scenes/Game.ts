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
} from "~/anims/PlayerSync";
import { setUpVoiceComm } from "~/communications/SceneCommunication";
import { setUpSceneChat, checkIfTyping } from "~/communications/SceneChat";

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
    this.load.scenePlugin({
      key: "rexuiplugin",
      url: "https://raw.githubusercontent.com/rexrainbow/phaser3-rex-notes/master/dist/rexuiplugin.min.js",
      sceneKey: "rexUI",
    });
    //create arrow and spacebar
    // @ts-ignore

    this.cursors = this.input.keyboard.createCursorKeys();
    this.xKey = this.input.keyboard.addKey(
      Phaser.Input.Keyboard.KeyCodes.X,
      false,
    );
  }

  async create() {
    this.room = await this.client.joinOrCreate("my_room", {});

    try {
      // this.scene.run("game-ui");

      this.setupTileMap();

      setUpSceneChat(this);

      setUpVoiceComm(this);

      createCharacterAnims(this.anims);

      this.setMainCharacterSprite();

      this.createEnemies();

      this.collisionSetUp();

      this.addPlayerListeners();
    } catch (e) {
      console.error("join error", e);
    }

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

    // send input to the server
    this.inputPayload.left = this.cursors.left.isDown;
    this.inputPayload.right = this.cursors.right.isDown;
    this.inputPayload.up = this.cursors.up.isDown;
    this.inputPayload.down = this.cursors.down.isDown;
    //if no move, then cupdate animations of current
    this.room.send("move", this.inputPayload);
  }

  // set up the map and the different layers to be added in the map for reference in collisionSetUp
  private setupTileMap() {
    const map = this.make.tilemap({ key: "user_room" });
    const tileSetInterior = map.addTilesetImage("Interior", "Interior"); //tile set name and image key
    const tileSetModern = map.addTilesetImage("modern", "modern"); //tile set name and image key

    map.createLayer("Floor", tileSetModern); //the tutorial uses staticlayer
    const wall_layer = map.createLayer("Walls", tileSetModern);
    this.layerMap.set("wall_layer", wall_layer);
    wall_layer.setCollisionByProperty({ collides: true });

    const interior_layer = map.createLayer("Interior", tileSetInterior);
    interior_layer.setCollisionByProperty({ collides: true });
    this.layerMap.set("interior_layer", interior_layer);

    debugDraw(wall_layer, this);
  }

  // set up the collision between different objects in the game
  private collisionSetUp() {
    this.physics.add.collider(this.faune, this.layerMap.get("wall_layer"));
    this.physics.add.collider(this.faune, this.layerMap.get("interior_layer"));
    console.log("collision set up");
  }

  // create the enemies in the game, and design their behaviors
  private createEnemies() {
    console.log("enemies set up");
    return;
  }

  async addPlayerListeners() {
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
      // keep a reference of it on `playerEntities`
      this.playerEntities[sessionId] = entity;

      // listening for server updates
      player.onChange(() => {
        console.log(player);
        // Update local position immediately
        entity.x = player.x;
        entity.y = player.y;
        // listening for server updates
        player.onChange(() => {
          console.log(player);
          // Update local position immediately
          entity.x = player.x;
          entity.y = player.y;

          // Assuming entity is a Phaser.Physics.Arcade.Sprite and player.pos is 'left', 'right', 'up', or 'down'
          const direction = player.pos; // This would come from your server update
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
    });
  }

  async displayQueueList() {
    const style = { fontSize: "18px", fill: "#FFF", backgroundColor: "#000A" };
    const queueDisplayText = this.queueList
      .map((sessionId) =>
        sessionId === this.room.sessionId ? "Me" : sessionId,
      )
      .join(", ");
    const text =
      "In Queue: " +
      (this.queueList.length > 0
        ? this.queueList
            .map((sessionId) =>
              sessionId === this.room.sessionId ? "Me" : sessionId,
            )
            .join(", ")
        : "No players");
    if (!this.queueDisplay) {
      this.queueDisplay = this.add
        .text(10, 10, text, style)
        .setScrollFactor(0)
        .setDepth(30);
    } else {
      if (text == this.room.state.sessionId) {
        this.queueDisplay.setText("Me");
      }
      this.queueDisplay.setText(text);
    }
  }

  async showLeavePopup(sessionId) {
    const text = `${sessionId} has left the queue...`;
    console.log(sessionId, "has left the queue...");
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
      .setOrigin(0.5);

    // Remove the popup after a few seconds
    setTimeout(() => {
      popupText.destroy();
    }, 3000); // Adjust the duration as needed
  }

  async hideQueueList() {
    if (this.queueDisplay) {
      this.queueDisplay.destroy(); // Remove the text object from the scene
      this.queueDisplay = undefined; // Make sure to reset the property
    }
  }

  async setBattleQueueInteractiveUi() {
    let joinQueueText = this.add
      .text(0, -50, "Join Queue", { color: "#555555" })
      .setInteractive({ useHandCursor: true })
      .on("pointerover", () => {
        joinQueueText.setStyle({ fill: "#0f0" });
        this.displayQueueList();
      })
      .on("pointerout", () => {
        joinQueueText.setStyle({ fill: "#555555" });
        this.hideQueueList(); // Hide the queue list when not hovering
      })
      .on("pointerdown", () => {
        if (this.room) {
          this.room.send("joinQueue");
          console.log("Join queue request sent");
          joinQueueText.setStyle({ fill: "#006600" });
          // Listen for queue updates from the server
        }
      });

    // does nothing yet
    let leaveQueueText = this.add
      .text(0, -20, "Leave Queue", { color: "#555555" })
      .setInteractive({ useHandCursor: true })
      .on("pointerover", () => {
        leaveQueueText.setStyle({ fill: "#f00" });
      })
      .on("pointerout", () => {
        leaveQueueText.setStyle({ fill: "#555555" });
      })
      .on("pointerdown", () => {
        if (this.room) {
          this.room.send("leaveQueue");
          console.log("Leave queue request sent");
          leaveQueueText.setStyle({ fill: "#ff0000" });
        }
      });
  }

  async setMainCharacterSprite() {
    //create sprite of cur player and set camera to follow
    this.faune = this.physics.add.sprite(130, 60, "faune", "walk-down-3.png");
    SetupPlayerOnCreate(this.faune, this.cameras);
  }

  async setBattleQueueListeners() {
    this.room.onMessage("queueUpdate", (message) => {
      this.queueList = message.queue;
      console.log("Queue updated:", this.queueList);
      this.displayQueueList();
    });

    this.room.onMessage("leaveQueue", (message) => {
      const sessionId = message.sessionId;
      this.showLeavePopup(sessionId);
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

              this.room.leave();
              this.scene.start("battle", {});
            },
          });
        }
      }, 1000);
    });
  }
}
