import { Scene } from "phaser";

export class FadeawayPopup {
  private scene: Scene;
  private caption: Phaser.GameObjects.Text | null = null;
  private fadeAway: Phaser.Tweens.Tween | null = null;
  private characterSprite: Phaser.GameObjects.Sprite | null = null;
  private textBubble: Phaser.GameObjects.Sprite | null = null;
  private background: Phaser.GameObjects.Sprite | null = null;

  constructor(scene: Scene) {
    this.scene = scene;
  }

  private async create(
    x: number,
    y: number,
    text: string,
    characterImage: string,
    textImage: string,
    backgroundImage: string
  ): Promise<void> {
    return new Promise((resolve) => {
      this.destroy();
      this.background = this.scene.add
        .sprite(
          0,
          0,
          backgroundImage
        );
      this.background.setOrigin(0, 0); // Set the origin to the top left corner

      this.characterSprite = this.scene.add.sprite(x, y - 20, characterImage);

      this.textBubble = this.scene.add.sprite(
        x + this.characterSprite.width,
        y - 200,
        textImage
      );

      this.textBubble.setScale(1.2).setDepth(1).setOrigin(0, 0);

      this.characterSprite.setScale(1.5).setDepth(0).setOrigin(0, 0);
      this.caption = this.scene.add.text(
        x + this.characterSprite.width * 1.25,
        y - 50,
        text,
        {
          font: "20px Press Start 2P",
          color: "black",
          align: "center",
          backgroundColor: "white",
          wordWrap: { width: 250, useAdvancedWrap: true },
        }
      );

      this.caption.setDepth(1);

      this.fadeAway = this.scene.tweens.add({
        targets: this.caption,
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

      // Start the tween
      this.fadeAway.play();
    });
  }

  async createGuide(
    x: number,
    y: number,
    texts: string[],
    characterImage: string,
    textImage: string,
    backgroundImage: string
  ): Promise<void> {
    for (let text of texts) {
      await this.create(x, y, text, characterImage, textImage, backgroundImage);
    }
  }

  destroy() {
    this.fadeAway?.stop();
    this.caption?.destroy();
    this.characterSprite?.destroy();
    this.textBubble?.destroy();
    this.background?.destroy();
    this.fadeAway = null;
    this.caption = null;
    this.characterSprite = null;
  }
}
