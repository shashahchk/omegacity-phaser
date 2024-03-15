import Phaser from "phaser";

export default class Monster extends Phaser.Physics.Arcade.Sprite {
  private question: string;
  private options: string[];
  constructor(
    question: string,
    options: string[],
    scene,
    x,
    y,
    char_name,
    frame,
  ) {
    super(scene, x, y, char_name, frame);
    this.question = question;
    this.options = options;

    this.setInteractive();
    this.on("pointerdown", () => {
      {
        if (!scene.dialog) {
          scene.showDialogBox(this);
        }
      } // Show dialog box when lizard is clicked
    });
    this.anims.play("dragon-idle-down");
  }

  getQuestion() {
    return this.question;
  }

  getOptions() {
    return this.options;
  }

  sendQuestionToServer() {
    // Send question to server
  }
}
