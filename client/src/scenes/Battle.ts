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
  SetUpPlayerListeners,
} from "~/anims/PlayerSync";
import { setUpVoiceComm } from "~/communications/SceneCommunication";
import { setUpSceneChat, checkIfTyping } from "~/communications/SceneChat";
import { SetUpQuestions } from "~/questions/QuestionUI";
import { SetUpTeamListeners } from "~/teams/TeamUI";
import { QuestionPopup } from "~/components/QuestionPopup";

type PlayerEntity = {
  sprite: Phaser.GameObjects.Sprite;
  usernameLabel: Phaser.GameObjects.Text;
};

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
  private currentUsername: string | undefined;
  private currentUsernameList: string[] = [];
  private usernameDisplay: any;
  private recorderLimitTimeout = 0;
  // a map that stores the layers of the tilemap
  private layerMap: Map<string, Phaser.Tilemaps.TilemapLayer> = new Map();
  private monsters!: Phaser.Physics.Arcade.Group;
  private playerEntities: { [sessionId: string]: PlayerEntity } = {};
  private inputPayload = {
    left: false,
    right: false,
    up: false,
    down: false,
  };
  private timerText: Phaser.GameObjects.Text;
  private roundText: Phaser.GameObjects.Text;
  private teamUIText: Phaser.GameObjects.Text;
  // private teamColorHolder = { color: '' };

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
      false,
    );
  }

  async create(data) {
    try {
      this.room = await this.client.joinOrCreate("battle", {
        /* options */
        username: data.username,
      });

      console.log(
        "Joined battle room successfully",
        this.room.sessionId,
        this.room.name,
      );
      this.addBattleText();
      this.addTimerText();
      this.addRoundText();

      // notify battleroom of the username of the player
      this.currentUsername = data.username;
      this.room.send("player_joined", this.currentUsername);

      createCharacterAnims(this.anims);
      createLizardAnims(this.anims);

      setUpSceneChat(this, "battle");
      setUpVoiceComm(this);

      this.setupTileMap(-200, -200);
      this.setupTeamUI();

      this.createEnemies();
      this.addMainCharacterSprite();
      this.collisionSetUp();

      //listeners
      SetUpPlayerListeners(this);
      this.setUpDialogBoxListener();
      this.setUpBattleRoundListeners();

      SetUpTeamListeners(this, this.teamUIText);
      SetUpQuestions(this);
      this.setUpUsernames(data.username);
      this.setUpUsernamesDisplay(data.username);

      this.events.emit("usernameSet", this.currentUsername);

      // this.setMainCharacterPositionAccordingToTeam();
      // SetUpTeamListeners(this, this.teamUIText);

      // only this is needed, if separated from the rest, it will not be updated at the start
      this.setUpTeamListeners();
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

  // set up the team listener to display the team  when teams.onChange
  private setUpTeamListeners() {
    // on message for "teamUpdate"
    this.room.onMessage("team-update", (message) => {
      const teamList = message.teams;
      let allInfo = "";
      let currentPlayer = null;
      let currentPlayerInfo = "";

      teamList.map((team, index) => {
        console.log("Team", index);
        if (team && typeof team === "object") {
          let teamColor = team.teamColor;
          let teamPlayersNames = [];

          for (let playerId in team.teamPlayers) {
            if (team.teamPlayers.hasOwnProperty(playerId)) {
              let player = team.teamPlayers[playerId];

              teamPlayersNames.push(player.userName);
              if (playerId === this.room.sessionId) {
                currentPlayer = player;
                // scene.teamColorHolder.color = teamColor;
              }
            }
          }

          let teamPlayers = teamPlayersNames.join(", ");
          let teamInfo = `\nTeam ${teamColor}: ${teamPlayers}`;

          // Add additional details
          teamInfo += `\nMatchScore: ${team.teamMatchScore}`;
          teamInfo += `\nRound number: ${this.room.state.currentRound}`;
          teamInfo += `\nTeamRoundScore: ${team.teamRoundScore}\n`;

          if (currentPlayer && currentPlayerInfo == "") {
            currentPlayerInfo += `\nPlayer:`;
            currentPlayerInfo += `\nRound Score: ${currentPlayer.roundScore}`;
            currentPlayerInfo += `\nQuestions Solved This Round: ${currentPlayer.roundQuestionIdsSolved}`; // Assuming this is an array
            currentPlayerInfo += `\nTotal Score: ${currentPlayer.totalScore}`;
            currentPlayerInfo += `\nTotal Questions Solved: ${currentPlayer.totalQuestionIdsSolved}\n`; // Assuming this is an array
            currentPlayerInfo += `\nHealth: ${currentPlayer.health}/100`; // Assuming this is an array
          }

          allInfo += teamInfo;
        } else {
          console.error("Unexpected team structure", team);
          return "";
        }
      });
      allInfo += currentPlayerInfo;

      this.teamUIText.setText(allInfo); // Added extra newline for separation between teams
    });
  }

  private addMainCharacterSprite() {
    //Add sprite and configure camera to follow
    this.faune = this.physics.add.sprite(130, 60, "faune", "walk-down-3.png");
    this.faune.anims.play("faune-idle-down");
    SetupPlayerOnCreate(this.faune, this.cameras);
  }

  private addBattleText() {
    const battleText = this.add
      .text(0, 0, "Battle Room", {
        fontSize: "32px",
      })
      .setScrollFactor(0);
    battleText.setDepth(100);
  }

  private addTimerText() {
    console.log("add text");
    this.timerText = this.add
      .text(300, 300, "Time remaining", { fontSize: "30px" })
      .setScrollFactor(0);
    this.timerText.setDepth(100);
  }

  private startNewRound() {
    console.log("Starting new round");
    // this.setMainCharacterPositionAccordingToTeam();
    this.faune.x = this.team_A_start_x_pos;
    this.faune.y = this.team_A_start_y_pos;
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

  // should display the following
  // MatchScore
  // Round number
  // TeamRoundScore
  // PlayerRoundScore and QuestionSolved
  private setupTeamUI() {
    this.teamUIText = this.add
      .text(0, 50, "Team:", {
        fontSize: "16px",
      })
      .setScrollFactor(0);
    this.teamUIText.setDepth(100);
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

    Object.values(this.playerEntities).forEach(({ sprite, usernameLabel }) => {
      usernameLabel.x = sprite.x;
      usernameLabel.y = sprite.y - 20;
  });

  if (this.usernameDisplay) {
      this.usernameDisplay.setPosition(this.faune.x, this.faune.y - 20);
  }

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

    this.dialog.on(
      "button.click",
      function (button, groupName, index) {
        if (button.name === "fightButton") {
          // Check if the 'Fight' button was clicked
          const qp = new QuestionPopup(this);
          qp.createPopup();
          // onclick call back
          this.dialog.setVisible(false);
        }
      }.bind(this),
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

  setUpOtherUsernamesDisplay(username: string, sessionId: string) {
    let playerEntity = this.playerEntities[sessionId];
    if (!playerEntity) {
        console.error("Player entity not found for sessionId:", sessionId);
        return;
    }

    if (!playerEntity.usernameLabel) {
        playerEntity.usernameLabel = this.add.text(playerEntity.sprite.x, playerEntity.sprite.y - 20, username, {
            fontFamily: '"Press Start 2P", cursive',
            fontSize: "10px",
            color: "#ffffff",
        }).setOrigin(0.5);
    } else {
        // Update existing username label
        playerEntity.usernameLabel.setText(username);
    }
}

}
