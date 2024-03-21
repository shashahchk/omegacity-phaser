import { HealthBar } from "~/components/HealthBar";
import * as Colyseus from "colyseus.js";
import Battle from "~/scenes/Battle";
import { TeamColorEnum } from "../../types/TeamColorType";

export default class ClientInBattleMonster extends Phaser.Physics.Arcade
  .Sprite {
  //cannot make other classes extend directly from this, must extend from sprite to use physics(?)
  private id: number;
  private healthBar: HealthBar;
  private monsterName: Phaser.GameObjects.Text;
  public battleScene: Battle;

  // private questions: string[] = [];
  // private options: string[][] = [];
  dialog: any;
  room: any;
  isWaiting: boolean = false;

  private playersTackling: string[] = [];
  private numberOfPlayers: number = 0;
  private curPlayerTeamColor: TeamColorEnum;

  sfx: any; //sound effects
  private defeatedFlag: Phaser.Physics.Arcade.Sprite;

  constructor(scene, x, y, texture, frame) {
    //id will be set by whoever calls this constructor
    super(scene, x, y, texture, frame);
    this.battleScene = scene;
    this.room = scene.room;
    this.healthBar = new HealthBar(scene, x, y);
    this.sfx = {};
    this.sfx.scream = scene.sound.add("monster-scream");
    this.sfx.snarl = scene.sound.add("monster-snarl");
    this.sfx.background = scene.sound.add("dungeon-background");
    this.sfx.background.play();

    this.battleScene.add.existing(this);
    this.battleScene.physics.add.existing(this);

    this.body.setSize(this.width * 0.5, this.height * 0.8);
    this.setInteractive({ useHandCursor: true });
    this.on("pointerdown", () => {
      this.sfx.snarl.play();
      this.createMonsterQueueBox();
    });

    // Change tint to greyish when mouse hovers over
    this.on("pointerover", () => {
      this.setTint(0x808080); // Greyish color
    });

    // Reset tint when mouse is no longer hovering over
    this.on("pointerout", () => {
      this.clearTint();
    });
  }

  createMonsterQueueBox() {
    // Check if a dialog already exists and destroy it or hide it as needed
    if (this.dialog) {
      this.dialog.scaleDownDestroy(100);
      this.dialog = undefined;
    }

    if (this.battleScene.isWaitingForMonster) {
      return;
    }

    const dialogX = this.x;
    const dialogY = this.y;

    this.dialog = this.battleScene.rexUI.add
      .dialog({
        x: dialogX,
        y: dialogY - 50,
        background: this.battleScene.rexUI.add.roundRectangle(
          0,
          0,
          100,
          100,
          20,
          0x0e376f
        ),

        title: this.battleScene.rexUI.add.label({
          background: this.battleScene.rexUI.add.roundRectangle(
            0,
            0,
            100,
            40,
            20,
            0x182456
          ),
          text: this.battleScene.add.text(
            0,
            0,
            "Players " + this.getNumberOfPlayers().toString() + " / 2",
            {
              fontSize: "20px",
            }
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
          this.battleScene.rexUI.add
            .label({
              width: 100,
              height: 40,
              background: this.battleScene.rexUI.add
                .roundRectangle(0, 0, 0, 0, 20, 0x283593)
                .setStrokeStyle(2, 0xffffff),
              text: this.battleScene.add.text(0, 0, "Fight", {
                fontSize: 18,
              }),
              space: {
                left: 10,
                right: 10,
              },
              name: "fightButton",
            })
            .setInteractive({ useHandCursor: true }),
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

    this.battleScene.isWaitingForMonster = true;

    this.room.onMessage("joinQueueSuccess", (message) => {
      if (message.playerId === this.room.sessionId) {
        // Find the 'fightButton' and change its text
        const fightButton = this.dialog.getElement("fightButton");
        if (fightButton) {
          fightButton.text = "Waiting...";
        }
        console.log("join queue success", message);
      }
    });

    this.dialog.on("button.click", (button, groupName, index) => {
      if (button.name === "fightButton") {
        // Retrieve the player from the room state
        const playerId = this.room.sessionId;
        this.room.send("playerQueueForMonster", {
          monsterId: this.id,
          playerId: playerId,
        });
      }
    });
  }

  setUpUpdateListeners(room: Colyseus.Room) {
    room.state.monsters.forEach((monster, id) => {
      monster.listen("isDefeated", (change) => {
        if (change.value) {
          this.die(monster.defeatedBy);
        }
      });
    });

    room.state.monsters.forEach((monster, id) => {
      const curPlayerTeamColor = this.room.state.players.get(
        this.room.sessionId
      )?.teamColor;
      monster.teams
        ?.get(curPlayerTeamColor)
        ?.listen("playerIDsAttacking", (change) => {
          const numberOfPlayers = change.value.length;
          if (this.dialog && this.dialog.getElement("title")) {
            this.dialog.getElement("title").text =
              "Players " + numberOfPlayers.toString() + " / 2";
          }
        });
    });
    // room.onMessage("monsterUpdate" + this.id.toString(), (message) => {
    //   this.healthBar.updateHealth(message.health);
    //   let usernamesTackling = [];
    //   message.playersTackling.forEach((playerID) => {
    //     usernamesTackling.push(room.state.players.get(playerID).username);
    //   });
    //   this.playersTackling = usernamesTackling;
    //   this.numberOfPlayers = this.playersTackling.length;
    //   // console.log("number of players tackling", this.numberOfPlayers);
    // });

    // room
    //   .onMessage("monsterKilled" + this.id.toString(), (message) => {
    //     console.log("emitting monster killed event", this.id);
    //     this.battleScene.events.emit("destroy" + this.id.toString(), {
    //       teamColor: message.teamColor,
    //     });
    //     this.off("pointerdown");
    //   })
    //   .bind(this);
  }

  // I am assuming that id is unique for each monster, this is to allow
  // players to uniquely identify the monsters when communicating with each other
  setPosition(x, y) {
    this.x = x;
    this.y = y;

    if (this.healthBar) {
      this.healthBar.setPositionRelativeToCharacter(x, y);
    }
  }

  // need to adjust this to be relative to the monster size
  setMonsterNamePositionRelativeToMonster(x, y) {
    this.monsterName.x = x - 25;
    this.monsterName.y = y + 40;
  }

  update(cursors) {}

  die(teamColor: TeamColorEnum) {
    this.healthBar.destroy();
    this.sfx.scream.play();
    setTimeout(() => {
      this.defeatedFlag = this.battleScene.physics.add.sprite(
        this.x + 20,
        this.y + 5,
        `${teamColor}-flag`
      );
    }, 1500);
    this.anims.play("golem1-die", true);
  }

  destroy() {
    super.destroy();
    if (this.monsterName) {
      this.monsterName.destroy();
    }
    if (this.healthBar) {
      this.healthBar.destroy();
    }
  }

  // decreaseHealth(amount: number) {
  //     this.healthBar.decreaseHealth(amount);
  // }

  // getQuestions(): string[] {
  //   return this.questions;
  // }

  // getOptions(): string[][] {
  //   return this.options;
  // }

  // addQuestion(question: string) {
  //   this.questions.push(question);
  // }

  // addOptions(options: string[]) {
  //   this.options.push(options);
  // }

  setID(id: number) {
    this.id = id;
    // need a better way to set the monster name, included here cos ID is not initialized at the start
    this.monsterName = this.battleScene.add.text(0, 0, "Monster " + id, {
      fontSize: "12px",
    });
    this.setMonsterNamePositionRelativeToMonster(this.x, this.y);
  }

  getId() {
    return this.id;
  }

  getNumberOfPlayers() {
    return this.numberOfPlayers;
  }
}
