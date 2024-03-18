import { Scene } from "phaser";

export class FadeawayPopup {
  private scene: Scene;
  private caption: Phaser.GameObjects.Text | null = null;
  private fadeAway: Phaser.Tweens.Tween | null = null;
  private characterSprite: Phaser.GameObjects.Sprite | null = null;
  private textBubble: Phaser.GameObjects.Sprite | null = null;
  private background: Phaser.GameObjects.Sprite | null = null;
  private currentIndex: number = 0; // Add a currentIndex to keep track of the current caption
  private texts: string[] = []; // Store texts array
  private x: number = 0;
  private y: number = 0;
  private characterImage: string = "";
  private textImage: string = "";
  private backgroundImage: string = "";

  constructor(scene: Scene) {
    this.scene = scene;
  }

  preload() {
    this.scene.load.image("narrator", "ui/cuter-narrator.png");
    this.characterImage = "narrator";
    this.scene.load.image("textBubble", "ui/pixel-speech.png");
    this.textImage = "textBubble";
    this.scene.load.image("background", "ui/start-background.png");
    this.backgroundImage = "background";
  }

  private async create(): Promise<void> {
    return new Promise((resolve) => {
      this.destroy();
      this.background = this.scene.add.sprite(0, 0, this.backgroundImage);
      this.background.setOrigin(0, 0).setScale(0.8).setAlpha(0.25);

      this.characterSprite = this.scene.add.sprite(this.x, this.y - 20, this.characterImage);

      this.textBubble = this.scene.add.sprite(
        this.x + this.characterSprite.width,
        this.y - 200,
        this.textImage
      );

      this.textBubble.setScale(1.2).setDepth(1).setOrigin(0, 0).setInteractive();

      this.characterSprite.setScale(1.5).setDepth(0).setOrigin(0, 0);
      this.caption = this.scene.add.text(
        this.x + this.characterSprite.width * 1.25,
        this.y - 50,
        this.texts[this.currentIndex],
        {
          fontFamily: '" Press Start 2P", cursive',
          font: "20px",
          color: "black",
          align: "center",
          backgroundColor: "white",
          wordWrap: { width: 250, useAdvancedWrap: true },
        }
      );

      this.caption.setDepth(1).setInteractive();

      this.fadeAway = this.scene.tweens.add({
        targets: this.caption,
        alpha: { from: 1, to: 0 },
        ease: "Linear",
        duration: 5000,
        repeat: 0,
        yoyo: false,
        onComplete: () => {
          this.nextCaption();
        },
      });

      // Start the tween
      this.fadeAway.play();
    });
  }

  async nextCaption(): Promise<void> {
    this.currentIndex++;
    if (this.currentIndex < this.texts.length) {
      await this.create();
    } else {
      this.destroy();
    }
  }

  async createGuide(
    texts: string[],
  ): Promise<void> {
    this.x = this.scene.cameras.main.centerX;
    this.y = this.scene.cameras.main.centerY;
    this.texts = texts;
    this.currentIndex = 0;
    await this.create();
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
