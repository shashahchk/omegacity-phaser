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
  constructor(scene, x, y, texture, frame) {
    super(scene, x, y, texture, frame);

    this.scene = scene;
    this.healthBar = new HealthBar(scene, x, y);

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

  destroy() {
    this.healthBar.destroy();
    super.destroy();
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
