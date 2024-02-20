import Phaser from "phaser";
import { debugDraw } from "../utils/debug";
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
import { SetUpVoiceComm } from "~/communications/SceneCommunication";
import { SetUpSceneChat, CheckIfTyping } from "~/communications/SceneChat";

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
    this.cursors = this.input.keyboard.createCursorKeys();
    this.xKey = this.input.keyboard.addKey(
      Phaser.Input.Keyboard.KeyCodes.X,
      false,
    );
  }

  async create() {
    this.room = await this.client.joinOrCreate("my_room", {
      /* options */
    });

    try {
      this.setupTileMap();
      createCharacterAnims(this.anims);

      SetUpSceneChat(this);

      SetUpVoiceComm(this);
      console.log("voice comm set up");

      this.faune = this.physics.add.sprite(130, 60, "faune", "walk-down-3.png");

      SetupPlayerOnCreate(this.faune, this.cameras);

      this.createEnemies();
      console.log("enemies set up");

      this.collisionSetUp();
      console.log("collision set up");
    } catch (e) {
      console.error("join error", e);
    }

    // listen for new players
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
        console.log(player);
        // Update local position immediately
        entity.x = player.x;
        entity.y = player.y;

        // Assuming entity is a Phaser.Physics.Arcade.Sprite and player.pos is 'left', 'right', 'up', or 'down'
        const direction = player.pos; // This would come from your server update
        // var animsDir;
        // var animsState;

        // switch (direction) {
        //     case 'left':
        //         animsDir = 'side';
        //         entity.flipX = true; // Assuming the side animation faces right by default
        //         break;
        //     case 'right':
        //         animsDir = 'side';
        //         entity.flipX = false;
        //         break;
        //     case 'up':
        //         animsDir = 'up';
        //         break;
        //     case 'down':
        //         animsDir = 'down';
        //         break;
        // }

        // if (player.isMoving) {
        //     animsState = "walk";
        // } else {
        //     animsState = "idle";
        // }
        // entity.anims.play('faune-' + animsState + '-' + animsDir, true);
      });
    });

    try {
      this.add
        .text(0, 0, "Join Queue", {})
        .setInteractive()
        .on("pointerdown", () => {
          if (this.room) {
            this.room.send("joinQueue");
            console.log("Join queue request sent");
          }
        });
      this.room.onMessage("startBattle", (message) => {
        console.log("startBattle", message);

        // Leave the current room
        this.room.leave();

        // Start the new scene and pass the sessionId of the current player
        this.scene.start("battle", {});
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
    } catch (e) {
      console.error("join queue error", e);
    }

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
  }

  // create the enemies in the game, and design their behaviors
  private createEnemies() {
    return;
  }

  // toggle the focus of the input

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
    if (CheckIfTyping()) return;

    const speed = 100;
    SetUpPlayerSyncWithServer(this);

    // send input to the server

    // Can add more custom behaviors here
    // custom behavior of dialog box following Lizard in this scene
  }
}
