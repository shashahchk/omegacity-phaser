import * as Colyseus from "colyseus.js";
import Phaser from "phaser";
import UIPlugin from "phaser3-rex-plugins/templates/ui/ui-plugin.js";
import {
  setCamera,
  // syncInBattlePlayerWithServer,
  setUpInBattlePlayerListeners,
  // updateInBattlePlayerAnims,
} from "~/communications/InBattlePlayerSync";
import { checkIfTyping, setUpSceneChat } from "~/communications/SceneChat";
import { setUpVoiceComm } from "~/communications/SceneCommunication";
import { QuestionPopup } from "~/components/QuestionPopup";
import Scoreboard from "~/components/Scoreboard";
import { debugDraw } from "../utils/debug";
import ClientInBattlePlayer from "~/character/ClientInBattlePlayer";
import { createCharacter } from "~/character/Character";
// import { MonsterEnum, HeroEnum } from "../../types/CharacterTypes";
import ClientInBattleMonster from "~/character/ClientInBattleMonster";
import { HeroEnum } from "../../types/CharacterTypes";
import { BattleUi } from "./BattleUi";
import { GuidedCaptionsPopup } from "~/components/GuidedCaptionsPopup";
import { SceneEnum } from "../../types/SceneType";

// import ClientInBattlePlayer from "~/character/ClientInBattlePlayer";

export default class Battle extends Phaser.Scene {
  rexUI: UIPlugin;
  private client: Colyseus.Client;
  private cursors!: Phaser.Types.Input.Keyboard.CursorKeys; //trust that this will exist with the !
  private faune: ClientInBattlePlayer;
  private recorder: MediaRecorder | undefined;
  room: Colyseus.Room | undefined; //room is a property of the class
  private xKey!: Phaser.Input.Keyboard.Key;
  private ignoreNextClick: boolean = false;
  private scoreboard: Scoreboard | undefined;
  dialog: any;
  private popUp: any;
  private mediaStream: MediaStream | undefined;
  private currentUsername: string | undefined;
  private currentPlayerEXP: number | undefined;
  private currentCharName: string | undefined;
  private recorderLimitTimeout = 0;
  private music: Phaser.Sound.BaseSound | undefined;

  // a map that stores the layers of the tilemap
  private layerMap: Map<string, Phaser.Tilemaps.TilemapLayer> = new Map();
  private monsters!: ClientInBattleMonster[];
  private playerEntities: { [sessionId: string]: any } = {};
  private inputPayload = {
    left: false,
    right: false,
    up: false,
    down: false,
  };
  private countdownTimer: Phaser.Time.TimerEvent;
  private timerText: Phaser.GameObjects.Text;
  private roundText: Phaser.GameObjects.Text;
  private teamUIText: Phaser.GameObjects.Text;
  private questionPopup: QuestionPopup;
  private currentMonsterSelected: ClientInBattleMonster | undefined;
  private isWaiting;
  private dialogTitle;
  // private teamColorHolder = { color: '' };
  private hasRoundStarted: boolean = false;
  isAnsweringQuestion: boolean = false;
  private battleUIScene: BattleUi;

  team_A_start_x_pos = 128;
  team_A_start_y_pos = 128;

  team_B_start_x_pos = 914;
  team_B_start_y_pos = 1176;

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
      false
    );

    // createLizardAnims(this.anims);
  }

  async create(data) {
    this.cameras.main.setZoom(1.5)
    this.game.sound.stopAll()
    const popup = new GuidedCaptionsPopup(this, SceneEnum.BATTLE, () => {
      this.setUpBattle(data);
    });
  }

  async setUpBattle(data) {
    var username = data.username;
    var charName = data.charName;
    var playerEXP = data.playerEXP;

    if (!username) {
      username = "Guest";
    }
    if (!charName) {
      charName = HeroEnum.Hero1;
    }
    if (playerEXP == undefined) {
      playerEXP = 0;
    }

    try {
      this.room = await this.client.joinOrCreate("battle", {
        /* options */
        charName: charName,
        username: username,
        playerEXP: playerEXP,
      });

      console.log(
        "Joined battle room successfully",
        this.room.sessionId,
        this.room.name
      );

      // notify battleroom of the username of the player
      this.currentUsername = username;
      this.currentPlayerEXP = playerEXP;
      this.currentCharName = charName;

      // this.room.send("player_joined", this.currentUsername);
      this.events.emit("usernameSet", this.currentUsername);
      setUpSceneChat(this, "battle");
      setUpVoiceComm(this);

      this.setupTileMap(-200, -200);
      this.scoreboard = new Scoreboard(this);

      // console.log("scoreboard created", this.scoreboard);

      await this.addEnemies();
      await this.addMainPlayer(data.username, charName, playerEXP);
      this.addBattleText();

      this.addCollision();

      //listeners
      setUpInBattlePlayerListeners(this);
      this.setUpDialogBoxListener();
      this.setUpBattleRoundListeners();

      // SetUpQuestions(this);
      this.room.send("playerJoined");

      // this.setMainCharacterPositionAccordingToTeam();
      // SetUpTeamListeners(this, this.teamUIText);

      // only this is needed, if separated from the rest, it will not be updated at the start

      this.setUpTeamListeners();

      this.scene.launch('battle-ui', { room: this.room })
      this.battleUIScene = this.scene.get('battle-ui') as BattleUi;

      this.music = this.sound.add("battle", {
        loop: true,
        volume: 0.5,
      });
      this.music.play();
    } catch (e) {
      console.error("join error", e);
    }
  }

  addWaitingForNext() {
    if (this.roundText != undefined) {
      this.roundText.setVisible(true);
    } else {
      this.roundText = this.add
        .text(
          this.cameras.main.width - 420,
          this.cameras.main.centerY,
          "Waiting for new round to start...",
          {
            fontSize: "32px",
            color: "#fff",
          },
        )
        .setScrollFactor(0)
        .setOrigin(0.5);
    }
  }

  private updateTimer(remainingTime: number) {
    console.log("update timer still called")
    // Convert the remaining time from milliseconds to seconds
    const remainingSeconds = Math.floor(remainingTime / 1000);

    if (remainingSeconds <= 0) {
      this.timerText?.setText("");
      this.addWaitingForNext();
      this.hasRoundStarted = false;
    } else if (this.timerText
   != undefined) {
      this.hasRoundStarted = true;

      this.roundText?.setVisible(false);
      this.timerText.setText(`Time: ${remainingSeconds}`);
    }
  }

  // set up the team listener to display the team  when teams.onChange
  private setUpTeamListeners() {
    // on message for "teamUpdate"
    this.room.onMessage("teamUpdate", (message) => {
      console.log("Team update", message);
      this.scoreboard.updateScoreboard(message.teams);
    });
  }

  private battleEnded(playerEXP: number,roomState) {
    this.timerText.setVisible(false);

    if (this.roundText != undefined && this.roundText instanceof Phaser.GameObjects.Text) {
      this.roundText?.setVisible(false);
    }
    console.log("battle end called")

    let battleEndNotification = this.add
      .text(
        this.cameras.main.centerX,
        this.cameras.main.centerY,
        "Battle Ends in 3...",
        {
          fontSize: "32px",
          color: "#fff",
        },
      )
      .setScrollFactor(0)
      .setOrigin(0.5);

    // add a countdown to the battle end
    let countdown = 300; // Start countdown from 3
    let countdownInterval = setInterval(() => {
      countdown -= 1; // Decrease countdown by 1
      if (countdown > 0) {
        // Update text to show current countdown value
        battleEndNotification.setText(`Battle Ends in ${countdown}...`);
      } else {
        // When countdown reaches 0, show "Battle Ended!" and begin fade out
        battleEndNotification.setText("Battle Ended!");
        clearInterval(countdownInterval);
      }
    }, 1000);

    
    // show match popup
    this.showMatchPopup(roomState).then(() => {
      // destroy everything and redirect to game scene
      this.tweens.add({
        targets: battleEndNotification,
        alpha: 0,
        ease: "Power1",
        duration: 1000,
        onComplete: () => {
          clearInterval(countdownInterval); // Clear the interval before destroying the notification
          battleEndNotification.destroy();
          this.room.leave().then(() => {
            this.scene.stop("battle-ui");
            this.scene.start("game", { username: this.currentUsername, charName: this.currentCharName, playerEXP: playerEXP });
          });
        },
      });
    });
  };

  private showMatchPopup(roomState): Promise<void> {
    return new Promise((resolve) => {
      this.battleUIScene.displayMatchSummary(roomState).then(() => {
        resolve();
      })
    });
  }

  private addMainPlayer(username: string, charName: string, playerEXP: number) {
    if (charName === undefined) {
      charName = "hero1";
      console.log("undefined char name");
    }

    if (playerEXP === undefined) {
      playerEXP = 0;
      console.log("undefined playerEXP");
    }
    if (username == undefined) {
      username = "Guest";
    }

    //Add sprite and configure camera to follow
    this.faune = new ClientInBattlePlayer(
      this,
      130,
      60,
      username,
      "hero",
      `${charName}-walk-down-0`,
      charName,
      playerEXP,
    );
    setCamera(this.faune, this.cameras);
  }

  private addBattleText() {
    this.addTimerText();
    this.addWaitingForNext();
  }

  private addTimerText() {
    //at top right
  console.log("add text");
    this.timerText = this.add
      .text(this.cameras.main.width/2 + 300, this.cameras.main.height / 2 - 220, "", { fontSize: "30px" })
      .setScrollFactor(0).setDepth(5);

    this.countdownTimer = this.time.addEvent({
      delay: 100000,
      callback: this.updateTimer,
      callbackScope: this,
      loop: true,
    });
    console.log("added timer text");
  }

  private resetPosition(message) {
    //m essage includes both new position and new monsters
    console.log("Starting new round");
    if (message.x != undefined && message.y != undefined) {
      if (this.faune instanceof ClientInBattlePlayer) {
        this.faune.setPosition(message.x, message.y);
      }
    }
    // if (this.dialog != undefined && this.dialog instanceof Phaser.GameObjects.GameObject) {
    //   this.dialog.setVisible(false);
    // }
    this.dialog = undefined;
  }

  async setUpBattleRoundListeners() {
    this.room.onMessage("roundStart", (message) => {
      console.log(`Round ${message.round} has started.`);
      this.scene.launch('battle-ui', { room: this.room })
      this.battleUIScene = this.scene.get('battle-ui') as BattleUi;
      if (this.dialog) {
        this.dialog.scaleDownDestroy(100);
        this.dialog = undefined;
      }
      if (this.questionPopup) {
        this.questionPopup.closePopup();
        this.questionPopup = undefined;
      }
    });

    this.room.onMessage("resetPosition", (message) => {
      console.log("resetting positions");
      this.resetPosition(message);
    });

    this.room.onMessage("spawnMonsters", (message) => {
      console.log("spawn monster");
      //clear existing monster entities
      console.log(message.monsters);
      if (this.monsters != undefined) {
        for (let monster of this.monsters) {
          monster.destroy();
        }
      }

      //convert message.monsters to an array
      if (message.monsters == undefined) {
        return;
      }

      const monsterEXPnotUsed = 0;
      message.monsters.forEach((monster) => {
        const newMonster: ClientInBattleMonster = createCharacter(
          this.currentUsername,
          this,
          monster.monster.charName,
          monster.monster.x,
          monster.monster.y,
          monsterEXPnotUsed,
        ) as ClientInBattleMonster;
        let id = monster.monster.id;
        newMonster.setID(id);
        monster.monster.questions.forEach((question) => {
          newMonster.addQuestion(question.question);
          newMonster.addOptions(question.options);
        });

        newMonster.body.onCollide = true;
        newMonster.setInteractive({useHandCursor: true});
        newMonster
        .on("pointerhover", () => {
          newMonster.setTint(0xff0000);
        })
        .on("pointerdown", () => {
          this.sound.play('monster-snarl');
          newMonster.clearTint();
          {
            if (this.isAnsweringQuestion) {
              return;
            }
            if (!this.dialog) {
              this.showDialogBox(newMonster);
            }
          } // Show dialog box when lizard is clicked
        })
        .on("pointerout", () => {
          newMonster.clearTint();
        });
        newMonster.anims.play("dragon-idle-down");
        newMonster.setUpUpdateListeners(this.room);
        this.events.on("destroy" + id.toString(), (message) => {
          console.log("monster killed" + id.toString());
          newMonster.die(message.teamColor);
        });

        this.monsters.push(newMonster);
      });
    });

        this.room.onMessage("roundEnd", (message) => {
      console.log(`Round ${message.round} has ended.`);

      // Here you can stop your countdown timer and prepare for the next round
    });

    this.room.onMessage("battleEnd", (message) => {
      this.sound.play("game-completed");
      console.log("The battle has ended. playerEXP: " + message.playerEXP);
      this.battleEnded(message.playerEXP, message.roomState);
      this.sound.play("experience-gained");
      // Here you can stop your countdown timer and show a message that the battle has ended
    });

    // set up a listener for the time change on the server batte room
    this.room.state.listen(
      "currentRoundTimeRemaining",
      (currentValue, previousValue) => {
        this.updateTimer(currentValue);
      }
    );
  }

  // set up the map and the different layers to be added in the map for reference in collisionSetUp
  private setupTileMap(x_pos, y_pos) {
    const map = this.make.tilemap({ key: "battle_room" });
    const tileSetTech = map.addTilesetImage("tech", "tech"); //tile set name and image key
    const tileSetDungeon = map.addTilesetImage("dungeon", "dungeon");
    const tileSetOverWorld = map.addTilesetImage("Overworld", "Overworld");
    const tileSetCave = map.addTilesetImage("cave", "cave");
    const tileSetMoreProps = map.addTilesetImage("moreProps, moreProps");
    console.log("made interior and modern")
    const tileSetSlates = map.addTilesetImage("slates", "slates");

    const floorLayer = map.createLayer("Floor", tileSetDungeon); //the tutorial uses staticlayer
    floorLayer.setPosition(x_pos, y_pos); // Set position here

    const floorLayerSlates = map.createLayer("Floor_Slate", tileSetSlates); //the tutorial uses staticlayer
    floorLayerSlates.setPosition(x_pos, y_pos); // Set position here
    this.layerMap.set("floorLayerSlates", floorLayerSlates);

    const floorLayerCave = map.createLayer("Floor_Cave", tileSetCave); //the tutorial uses staticlayer
    floorLayerCave.setPosition(x_pos, y_pos); // Set position here
    this.layerMap.set("floorLayerCave", floorLayerCave);

    const wallLayer = map.createLayer("Walls", tileSetTech);
    wallLayer.setCollisionByProperty({ collides: true });
    wallLayer.setPosition(x_pos, y_pos); // Set position here
    this.layerMap.set("wallLayer", wallLayer);
    debugDraw(this.layerMap.get("wallLayer"), this);

    const wallLayerSlates = map.createLayer("Walls_Slate", tileSetSlates);
    wallLayer.setPosition(x_pos, y_pos); // Set position here
    this.layerMap.set("wallLayerSlates", wallLayerSlates);

    const decoLayer = map.createLayer("Deco", tileSetTech);
    decoLayer.setPosition(x_pos, y_pos); // Set position here
    this.layerMap.set("decoLayer", decoLayer);

    const decoLayerSlates = map.createLayer("Deco_Slate", tileSetSlates);
    decoLayerSlates.setPosition(x_pos, y_pos); // Set position here
    this.layerMap.set("decoLayerSlates", decoLayerSlates);

    const decoLayerOverWorld = map.createLayer("Deco_Overworld", tileSetOverWorld);
    decoLayerOverWorld.setPosition(x_pos, y_pos); // Set position here
    this.layerMap.set("decoLayerOverWorld", decoLayerOverWorld);

    const decoLayerCave = map.createLayer("Deco_Cave", tileSetCave);
    decoLayerCave.setPosition(x_pos, y_pos); // Set position here
    this.layerMap.set("decoLayerCave", decoLayerCave);

    const propsLayer = map.createLayer("Props", tileSetDungeon);
    propsLayer.setPosition(x_pos, y_pos); // Set position here
    this.layerMap.set("propsLayer", propsLayer);

    const propsLayerSlates = map.createLayer("Props_Slate", tileSetSlates);
    propsLayerSlates.setPosition(x_pos, y_pos); // Set position here
    this.layerMap.set("propsLayerSlate", propsLayerSlates);

    const propsLayerTech = map.createLayer("Props_Tech", tileSetTech);
    propsLayerTech.setCollisionByProperty({ collides: true });
    propsLayerTech.setPosition(x_pos, y_pos); // Set position here
    this.layerMap.set("propsLayerTech", propsLayerTech);
    debugDraw(this.layerMap.get("propsLayerTech"), this);

    const propsLayerOverWorld = map.createLayer("Props_Overworld", tileSetOverWorld);
    propsLayerOverWorld.setPosition(x_pos, y_pos); // Set position here
    this.layerMap.set("propsLayerOverWorld", propsLayerOverWorld);

    const propsLayerCave = map.createLayer("Props_Cave", tileSetCave);
    propsLayerCave.setPosition(x_pos, y_pos); // Set position here
    this.layerMap.set("propsLayerCave", propsLayerCave);

    const propsLayerMore = map.createLayer("Props_More", tileSetMoreProps);
    propsLayerMore.setPosition(x_pos, y_pos); // Set position here
    this.layerMap.set("propsLayerMore", propsLayerMore);

    const overlayLayer = map.createLayer("Overlays", tileSetSlates);
    overlayLayer.setPosition(x_pos, y_pos); // Set position here
  }

  // set up the collision between different objects in the game
  private addCollision() {
    this.physics.add.collider(this.faune, this.layerMap.get("wallLayer"));
    this.physics.add.collider(this.monsters, this.layerMap.get("wallLayer"));
    //         this.physics.add.collider(this.monsters, this.layerMap.get('interior_layer'))
    this.physics.add.collider(this.faune, this.layerMap.get("interior_layer"));
    this.physics.add.collider(this.faune, this.layerMap.get("propsLayerTech"));
  }

  // create the enemies in the game, and design their behaviors
  private addEnemies() {
    this.monsters = [];
    // this.monsters = this.physics.add.group({
    //   classType: Lizard,
    //   createCallback: (go) => {
    //     const lizardGo = go as Lizard;
    //     lizardGo.body.onCollide = true;
    //     lizardGo.setInteractive(); // Make the lizard interactive
    //     lizardGo.on("pointerdown", () => {
    //       if (!this.currentLizard) {
    //         this.currentLizard = lizardGo;
    //         this.showDialogBox(lizardGo);
    //       } // Show dialog box when lizard is clicked
    //     });
    //   },
    // });
    // this.monsters.get(200, 123, "lizard");
  }

  update(t: number, dt: number) {
    //return if not set up properly
    if (!this.cursors || !this.faune || !this.room) return;

    // this should in front as dialogbox should continue to move even if the user is typing
    if (this.dialog) {
      // Update the dialog's position to follow the lizard
      // You might want to adjust the offset to position the dialog box appropriately
      this.dialog.layout(); // Re-layout the dialog after changing its position
    }

    if (checkIfTyping()) return;
    this.faune.updateAnimsAndSyncWithServer(this.room, this.cursors);
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
          this.room.send(
            "playerLeftMonster" +
              this.currentMonsterSelected.getId().toString(),
            {},
          );
          this.isWaiting = false;
          this.dialog.scaleDownDestroy(100);
          this.dialog = undefined; // Clear the reference if destroying the dialog
          // Clear the reference to the current lizard
        }
      },
      this
    );
  }
  // custom UI behavior of dialog box following Lizard in this scene
  // This method creates a dialog box and sets up its behavior
  // can disregard for now
  showDialogBox(monster: ClientInBattleMonster) {
    // Add this line to ignore the next click (the current one that opens the dialog)
    this.currentMonsterSelected = monster;
    this.ignoreNextClick = true;
    // Check if a dialog already exists and destroy it or hide it as needed
    // Assuming `this.dialog` is a class property that might hold a reference to an existing dialog
    const dialogX = monster.x;
    const dialogY = monster.y;
    this.dialog = this.rexUI.add
      .dialog({
        x: dialogX,
        y: dialogY - 50,
        background: this.rexUI.add.roundRectangle(0, 0, 100, 100, 20, 0x0e376f),

        title: this.rexUI.add.label({
          background: this.rexUI.add.roundRectangle(
            0,
            0,
            100,
            40,
            20,
            0x182456
          ),
          text: this.add.text(
            0,
            0,
            "Players " + monster.getNumberOfPlayers().toString() + " / 2",
            {
              fontSize: "20px",
            },
          ),
          space: {
            left: 15,
            right: 15,
            top: 10,
            bottom: 10,
          },
          name: "title",
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
          }).setInteractive({ useHandCursor: true }),
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

    this.dialog.on(
      "button.click",
      function (button, groupName, index) {
        if (button.name === "fightButton") {
          // Check if the 'Fight' button was clicked
          if (!this.isWaiting) {
            button.text = "waiting...";
            this.room.send(
              "playerQueueForMonster" + monster.getId().toString(),
              {},
            );
            this.isWaiting = true;

            if (this.isWaiting) {
              this.room.onMessage(
                "start" + monster.getId().toString(),
                (message) => {
                  console.log("start" + monster.getId().toString());
                  let id = message.qnsID;
                  this.questionPopup = new QuestionPopup(this, monster, id);
                  this.questionPopup.createPopup(monster.getId(), id);
                  // loop through the index of questions of the monster
                  // create a question popup for each question

                  // this.dialog.setVisible(false);
                  this.dialog = undefined;
                  this.isWaiting = false;
                  this.isAnsweringQuestion = true;
                },
              );
            }
          } else {
            button.text = "Fight";
            console.log("no longer waiting");
            this.room.send(
              "playerLeftMonster" + monster.getId().toString(),
              {},
            );
            this.isWaiting = false;
          }
        }
      }.bind(this)
    );

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
