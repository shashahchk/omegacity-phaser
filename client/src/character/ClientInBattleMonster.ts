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
  private sfx: any; //sound effects
  private defeatedFlag: Phaser.Physics.Arcade.Sprite;

  constructor(scene, x, y, texture, frame) {
    super(scene, x, y, texture, frame);

    this.scene = scene;
    this.healthBar = new HealthBar(scene, x, y);
    this.sfx = {}
    this.sfx.scream = scene.sound.add("monster-scream");
    this.sfx.snarl = scene.sound.add("monster-snarl");
    this.sfx.background = scene.sound.add("dungeon-background");
    this.sfx.background.play();

    scene.add.existing(this);
    scene.physics.add.existing(this);

    this.body.setSize(this.width * 0.5, this.height * 0.8);
    this.setInteractive({ useHandCursor: true });
    this.on("pointerdown", () => {
      this.sfx.snarl.play();
      if (!this.scene.dialog) {
        this.scene.showDialogBox(this);
      }
    });
    
    // Change tint to greyish when mouse hovers over
    this.on('pointerover', () => {
      this.setTint(0x808080); // Greyish color
    });
    
    // Reset tint when mouse is no longer hovering over
    this.on('pointerout', () => {
      this.clearTint();
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
