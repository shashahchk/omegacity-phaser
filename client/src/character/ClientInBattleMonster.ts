// @ts-nocheck
import { HealthBar } from "~/components/HealthBar";
import * as Colyseus from "colyseus.js";

export default class ClientInBattleMonster extends Phaser.Physics.Arcade
  .Sprite {
  //cannot make other classes extend directly from this, must extend from sprite to use physics(?)
  private id: number;
  private healthBar: HealthBar;
  public scene: Phaser.Scene;

  private questions: string[] = [];
  private options: string[string[]] = [];
  private playersTackling: string[] = [];
  private numberOfPlayers: number = 0;

  private sfx: any; //sound effects
  private defeatedFlag: Phaser.Physics.Arcade.Sprite;

  constructor(scene, x, y, texture, frame) {
    super(scene, x, y, texture, frame);

    this.scene = scene;
    this.healthBar = new HealthBar(scene, x, y);
    this.sfx = {}
    this.sfx.scream = scene.sound.add("monster-scream");

    scene.add.existing(this);
    scene.physics.add.existing(this);

    this.body.setSize(this.width * 0.5, this.height * 0.8);
    this.setInteractive();
    this.on("pointerdown", () => {
      {
        if (!scene.dialog) {
          scene.showDialogBox(this);
        }
      } // Show dialog box when lizard is clicked
    });
  }

  setUpUpdateListeners(room: BattleRoom) {
    room.onMessage("monsterUpdate" + this.id.toString(), (message) => {
      this.healthBar.updateHealth(message.health);
      let usernamesTackling = [];
      message.playersTackling.forEach((playerID) => {
        usernamesTackling.push(room.state.players.get(playerID).username);
      });
      this.playersTackling = usernamesTackling;
      this.numberOfPlayers = this.playersTackling.length;
      console.log("number of players tackling", this.numberOfPlayers);
    });
  }

  setPosition(x, y) {
    this.x = x;
    this.y = y;

    if (this.healthBar) {
      this.healthBar.setPositionRelativeToMonster(x, y);
    }
  }

  update(cursors) {}

  die() {
      this.healthBar.destroy();
      this.sfx.scream.play();
      setTimeout(() => {
          this.defeatedFlag = this.scene.physics.add.sprite(this.x + 20, this.y + 5, "red-flag")}, 
          1500);
      this.anims.play("golem1-die", true);
  }

  destroy() {
    super.destroy()
    this.healthBar.destroy();
  }

  decreaseHealth(amount: number) {
    this.healthBar.decreaseHealth(amount);
  }

  getQuestion(id: number) {
    return this.questions[id];
  }

  getOptions(id: number) {
    return this.options[id];
  }

  addQuestion(question: string) {
    this.questions.push(question);
  }

  addOptions(options: string[]) {
    this.options.push(options);
  }

  setID(id: number) {
    this.id = id;
  }

  getId() {
    return this.id;
  }

  getNumberOfPlayers() {
    return this.numberOfPlayers;
  }

  sendQuestionToServer(
    string: answer,
    number: questionId,
    room: Colyseus.Room,
  ) {
    room.send("answerQuestion", {
      monsterId: this.id,
      questionId: questionId,
      answer: answer,
    });
  }
}
