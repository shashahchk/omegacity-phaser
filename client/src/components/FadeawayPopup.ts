import { Scene } from "phaser";

export class FadeawayPopup {
  private scene: Scene;
  private caption: Phaser.GameObjects.Text | null = null;
  private fadeAway: Phaser.Tweens.Tween | null = null;
  private characterSprite: Phaser.GameObjects.Sprite | null = null;
  private textBubble: Phaser.GameObjects.Sprite | null = null;
  private entranceSound: Phaser.Sound.BaseSound;
  private fadeAwaySound: Phaser.Sound.BaseSound;

  constructor(scene: Scene) {
    this.scene = scene;
    console.log("Before adding sound");
    // this.entranceSound = this.scene.sound.add("entranceSound");
    // this.fadeAwaySound = this.scene.sound.add("fadeAwaySound");
    console.log("added sound");
  }

  private async create(
    x: number,
    y: number,
    text: string,
    characterImage: string,
    textImage: string
  ): Promise<void> {
    return new Promise((resolve) => {
      this.destroy();

      this.characterSprite = this.scene.add
        .sprite(x + 200, y + 200, characterImage)
        .setDisplaySize(this.scene.scale.width, this.scene.scale.height)
        .setAlpha(0);

      this.textBubble = this.scene.add
        .sprite(x + this.characterSprite.width * 0.25, y - 200, textImage)
        .setScale(1.2)
        .setDepth(1)
        .setOrigin(0, 0)
        .setAlpha(0);

      this.scene.tweens.add({
        targets: [this.characterSprite, this.textBubble],
        alpha: { from: 0, to: 1 },
        ease: "Power1",
        duration: 800,
      });

      this.characterSprite.setScale(0.5).setDepth(0).setInteractive();
      this.textBubble
        .setScale(1.2)
        .setDepth(1)
        .setOrigin(0, 0)
        .setInteractive();

      this.caption = this.scene.add
        .text(x + this.characterSprite.width * 0.25 + 80, y - 100, text, {
          fontFamily: '"Press Start 2P", cursive',
          fontSize: "20px",
          color: "black",
          align: "center",
          wordWrap: { width: 250, useAdvancedWrap: true },
        })
        .setDepth(1)
        .setAlpha(0);

      this.scene.tweens.add({
        targets: this.caption,
        alpha: { from: 0, to: 1 },
        ease: "Power1",
        duration: 800,
      });

      this.textBubble.on("pointerdown", () => {
        this.destroy();
        resolve();
      });

      this.fadeAway = this.scene.tweens.add({
        targets: [this.caption, this.characterSprite, this.textBubble],
        alpha: { from: 1, to: 0 },
        ease: "Linear",
        duration: 3000,
        repeat: 0,
        yoyo: false,
        onComplete: () => {
          this.destroy();
          resolve();
        },
      });

      //this.fadeAwaySound.play();
    });
  }

  async createGuide(
    x: number,
    y: number,
    texts: string[],
    characterImage: string,
    textImage: string
  ): Promise<void> {
    for (let text of texts) {
      await this.create(x, y, text, characterImage, textImage);
    }
  }

  destroy() {
    this.fadeAway?.stop();
    this.caption?.destroy();
    this.characterSprite?.destroy();
    this.textBubble?.destroy();
    this.fadeAway = null;
    this.caption = null;
    this.characterSprite = null;
    this.textBubble = null;
  }
}
