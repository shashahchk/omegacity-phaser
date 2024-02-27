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
import { setUpVoiceComm } from "~/communications/SceneCommunication";
import { setUpSceneChat, checkIfTyping } from "~/communications/SceneChat";

export default class Battle extends Phaser.Scene {
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
  private monsters!: Phaser.Physics.Arcade.Group;
  private playerEntities: { [sessionId: string]: any } = {};
  private inputPayload = {
    left: false,
    right: false,
    up: false,
    down: false,
  };
  private timerText: Phaser.GameObjects.Text;
    private roundText: Phaser.GameObjects.Text;

  constructor() {
    super("battle");
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
    try {
      this.room = await this.client.joinOrCreate("battle", {
        /* options */
      });
      console.log(
        "Joined battle room successfully",
        this.room.sessionId,
        this.room.name,
      );
      this.scene.run("game-ui");
      this.addBattleText();
      this.addTimerText();
            this.addRoundText();

      createCharacterAnims(this.anims);
      createLizardAnims(this.anims);

      setUpSceneChat(this);
      setUpVoiceComm(this);

      this.setupTileMap(-200, -200);

      this.createEnemies();
      this.addMainCharacterSprite();
      this.collisionSetUp();

      //listeners
      this.setUpPlayerListeners();
      this.setUpDialogBoxListener();
      this.setUpBattleRoundListeners();
    } catch (e) {
      console.error("join error", e);
    }
  }

    private addRoundText() {
        // this.roundText = this.add.text(300, 200, 'Round ' + this.room.state.currentRound, { fontSize: '30px' }).setScrollFactor(0);
    }

  private updateTimer(remainingTime: number) {
    // Convert the remaining time from milliseconds to seconds
    const remainingSeconds = Math.floor(remainingTime / 1000);
    if (this.timerText != undefined) {
      this.timerText.setText(`Time: ${remainingSeconds}`);
    }
  }

  private setUpPlayerListeners() {
    // Listen for new players, updates, removal, and leaving.
    this.room.state.players.onAdd((player, sessionId) => {
      console.log("new player joined!", sessionId);
      var entity;

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

  private addMainCharacterSprite() {
    //Add sprite and configure camera to follow
    this.faune = this.physics.add.sprite(130, 60, "faune", "walk-down-3.png");
    this.faune.anims.play("faune-idle-down");
    SetupPlayerOnCreate(this.faune, this.cameras);
  }

    private addBattleText() {
        const battleText = this.add.text(0, 0, "Battle Room", {
            fontSize: "32px",
        }).setScrollFactor(0);
        battleText.setDepth(100);
    }

    private addTimerText() {
        console.log('add text')
        this.timerText = this.add.text(300, 300, 'Time remaining', { fontSize: '30px' }).setScrollFactor(0);
        this.timerText.setDepth(100)

    }

    private startNewRound() {
        console.log("Starting new round")
        //update faune position (all otehr positions are updated except fo rthis one)
        this.faune.x = 128;
        this.faune.y = 128;
    }

  async setUpBattleRoundListeners() {
    this.room.onMessage("roundStart", (message) => {
      console.log(`Round ${message.round} has started.`);
    });

    this.room.onMessage("roundEnd", (message) => {
      console.log(`Round ${message.round} has ended.`);

            this.startNewRound();
            // Here you can stop your countdown timer and prepare for the next round
        });

    this.room.onMessage("battleEnd", () => {
      console.log("The battle has ended.");
      // Here you can stop your countdown timer and show a message that the battle has ended
    });

    // set up a listener for the time change on the server batte room
    this.room.state.listen(
      "currentRoundTimeRemaining",
      (currentValue, previousValue) => {
        console.log("Time remaining: ", currentValue);
        this.updateTimer(currentValue);
      },
    );

    // this.room.onMessage("timerUpdate", (message) => {
    //   console.log(`Time remaining: ${message.timeRemaining}`);
    //     this.updateTimer(message);
    // });
  }

  private handlePlayerLizardCollision(
    obj1: Phaser.GameObjects.GameObject,
    obj2: Phaser.GameObjects.GameObject,
  ) {
    const lizard = obj2 as Lizard;
    const dx = this.faune.x - lizard.x;
    const dy = this.faune.y - lizard.y;

    const dir = new Phaser.Math.Vector2(dx, dy).normalize().scale(200);

    this.faune.setVelocity(dir.x, dir.y);
  }

  // set up the map and the different layers to be added in the map for reference in collisionSetUp
  private setupTileMap(x_pos, y_pos) {
    const map = this.make.tilemap({ key: "battle_room" });
    const tileSetTech = map.addTilesetImage("tech", "tech"); //tile set name and image key
    const tileSetDungeon = map.addTilesetImage("dungeon", "dungeon");

    const floorLayer = map.createLayer("Floor", tileSetDungeon); //the tutorial uses staticlayer
    floorLayer.setPosition(x_pos, y_pos); // Set position here

    const wallLayer = map.createLayer("Walls", tileSetTech);
    wallLayer.setCollisionByProperty({ collides: true });
    wallLayer.setPosition(x_pos, y_pos); // Set position here
    this.layerMap.set("wallLayer", wallLayer);
    debugDraw(this.layerMap.get("wallLayer"), this);

    const decoLayer = map.createLayer("Deco", tileSetTech);
    decoLayer.setPosition(x_pos, y_pos); // Set position here
    this.layerMap.set("decoLayer", decoLayer);

    const propsLayer = map.createLayer("Props", tileSetDungeon);
    propsLayer.setPosition(x_pos, y_pos); // Set position here
    this.layerMap.set("propsLayer", propsLayer);
  }

  // set up the collision between different objects in the game
  private collisionSetUp() {
    this.physics.add.collider(this.faune, this.layerMap.get("wallLayer"));
    this.physics.add.collider(this.monsters, this.layerMap.get("wallLayer"));
    //         this.physics.add.collider(this.monsters, this.layerMap.get('interior_layer'))
    this.physics.add.collider(this.faune, this.layerMap.get("interior_layer"));
  }

  // create the enemies in the game, and design their behaviors
  private createEnemies() {
    this.monsters = this.physics.add.group({
      classType: Lizard,
      createCallback: (go) => {
        const lizardGo = go as Lizard;
        lizardGo.body.onCollide = true;
        lizardGo.setInteractive(); // Make the lizard interactive
        lizardGo.on("pointerdown", () => {
          if (!this.currentLizard) {
            this.currentLizard = lizardGo;
            this.showDialogBox(lizardGo);
          } // Show dialog box when lizard is clicked
        });
      },
    });
    this.monsters.get(200, 123, "lizard");
  }

  update(t: number, dt: number) {
    //return if not set up properly
    if (!this.cursors || !this.faune || !this.room) return;

    // this should in front as dialogbox should continue to move even if the user is typing
    if (this.currentLizard && this.dialog) {
      // Update the dialog's position to follow the lizard
      // You might want to adjust the offset to position the dialog box appropriately
      this.dialog.setPosition(this.currentLizard.x, this.currentLizard.y - 60);
      this.dialog.layout(); // Re-layout the dialog after changing its position
    }

    if (checkIfTyping()) return;
    SetupPlayerAnimsUpdate(this.faune, this.cursors);

    const speed = 100;

    SetUpPlayerSyncWithServer(this);

    // Can add more custom behaviors here
    // custom behavior of dialog box following Lizard in this scene
  }

  setUpDialogBoxListener() {
    this.input.on(
      "pointerdown",
      (pointer) => {
        // Check if we should ignore scene click (the one that opens the dialog)
        if (this.ignoreNextClick) {
          this.ignoreNextClick = false;
          return;
        }

        const x = pointer.x;
        const y = pointer.y;

        // If there's a dialog and the click is outside, hide or destroy it
        if (!this.dialog) {
          return;
        }
        if (!this.dialog.isInTouching(pointer)) {
          console.log("click outside out dialog");
          this.dialog.scaleDownDestroy(100);
          this.dialog = undefined; // Clear the reference if destroying the dialog
          this.currentLizard = undefined; // Clear the reference to the current lizard
        }
      },
      this,
    );
  }
  // custom UI behavior of dialog box following Lizard in this scene
  // This method creates a dialog box and sets up its behavior
  // can disregard for now
  showDialogBox(lizard: Lizard) {
    var btns = [];
    var options = ["1", "2", "3", "4"];
    for (var i = 0; i < options.length; i++) {
      btns.push(this.createOptionButton(options[i]));
    }

    // Add this line to ignore the next click (the current one that opens the dialog)
    this.ignoreNextClick = true;
    // Check if a dialog already exists and destroy it or hide it as needed
    // Assuming `this.dialog` is a class property that might hold a reference to an existing dialog
    this.dialog = this.rexUI.add
      .dialog({
        background: this.rexUI.add.roundRectangle(0, 0, 100, 100, 20, 0x0e376f),

        title: this.rexUI.add.label({
          background: this.rexUI.add.roundRectangle(
            0,
            0,
            100,
            40,
            20,
            0x182456,
          ),
          text: this.add.text(0, 0, "Difficulty: Simple", {
            fontSize: "20px",
          }),
          space: {
            left: 15,
            right: 15,
            top: 10,
            bottom: 10,
          },
        }),

        actions: [
          this.rexUI.add.label({
            width: 100,
            height: 40,
            background: this.rexUI.add
              .roundRectangle(0, 0, 0, 0, 20, 0x283593)
              .setStrokeStyle(2, 0xffffff),
            text: this.add.text(0, 0, "Fight", {
              fontSize: 18,
            }),
            space: {
              left: 10,
              right: 10,
            },
            name: "fightButton",
          }),
        ],

        space: {
          title: 10,
          action: 5,

          left: 10,
          right: 10,
          top: 10,
          bottom: 10,
        },
      })
      .layout()
      .popUp(500);

    this.dialog.on("button.click", function (button, groupName, index) {
      if (button.name === "fightButton") {
        // Check if the 'Fight' button was clicked
        console.log("Fight clicked");
        // onclick call back
      }

      if (button.name === "option1") {
        console.log("Option 1 clicked");
        // onclick call back
      }

      if (button.name === "option2") {
        console.log("Option 2 clicked");
        // onclick call back
      }

      if (button.name === "option3") {
        console.log("Option 3 clicked");
        // onclick call back
      }

      if (button.name === "option4") {
        console.log("Option 4 clicked");
        // onclick call back
      }
    });

    // wait 0.5 s before logging the following

    console.log("dialog created");
  }

  createOptionButton(text: string) {
    return this.rexUI.add.label({
      background: this.rexUI.add
        .roundRectangle(0, 0, 0, 0, 10, 0xffffff)
        .setStrokeStyle(2, 0xffffff),
      text: this.add.text(0, 0, text, {
        fontSize: 18,
      }),
      align: "center",
      name: "option" + text,
    });
  }
}
