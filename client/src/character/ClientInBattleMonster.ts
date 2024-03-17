// @ts-nocheck
import { HealthBar } from "~/components/HealthBar";
import * as Colyseus from "colyseus.js";

export default class ClientInBattleMonster extends Phaser.Physics.Arcade
  .Sprite {
  //cannot make other classes extend directly from this, must extend from sprite to use physics(?)
  private id: number;
  private healthBar: HealthBar;
  public scene: Phaser.Scene;
  private question: string;
  private options: string[];
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
        this.anims.play("golem1-die", true);
        // super.destroy();
    }

  decreaseHealth(amount: number) {
    this.healthBar.decreaseHealth(amount);
  }

  getQuestion() {
    return this.question;
  }

  getOptions() {
    return this.options;
  }

  setQuestion(question: string) {
    this.question = question;
  }

  setOptions(options: string[]) {
    this.options = options;
  }

  setID(id: number) {
    this.id = id;
  }

  getId() {
    return this.id;
  }

  sendQuestionToServer(string: answer, room: Colyseus.Room) {
    room.send("answerQuestion", { id: this.id, answer: answer });
  }
}
