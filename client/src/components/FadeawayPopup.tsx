import { Scene } from "phaser";
import { SceneEnum } from "../../types/SceneType";

export class FadeawayPopup {
  private scene: Scene;
  private caption: Phaser.GameObjects.Text | null = null;
  private fadeAway: Phaser.Tweens.Tween | null = null;
  private robotSprite: Phaser.GameObjects.Sprite | null = null;
  private textBubble: Phaser.GameObjects.Sprite | null = null;
  private background: Phaser.GameObjects.Sprite | null = null;
  private currentIndex: number = 0; // Add a currentIndex to keep track of the current caption
  private x: number = 0;
  private y: number = 0;
  private sceneToAssetsMap: Map<SceneEnum, {texts: string[], characterImage: string, backgroundImage: string}>;
  private texts: string[] = []; // Store texts array
  private characterImage: string = ""; 
  private backgroundImage: string = "";
  private textBubbleImage: string = "big-speech-bubble";
  private sceneType : SceneEnum;
  private onEndCallback: () => void;


  constructor(scene: Scene, sceneType: SceneEnum, onEndCallback: () => void){
    this.scene = scene;
    this.sceneType = sceneType;
    this.sceneToAssetsMap = new Map([
      [SceneEnum.BATTLE, {
        texts: ["Welcome to the battle room!", "Defeat each monster to win points.", "Remember, each monster can only be defeated once, so hurry up before your enemy team!"],
        characterImage: "",
        backgroundImage: ""
      }],
      [SceneEnum. START, {
        texts: ["Welcome to Omega City, community for coders!", "Here is where you can meet and interact with fellow aspiring programmers", "I am your mayor, Mayor Codey, here to serve you!"],
        characterImage: "robot",
        backgroundImage: "background"
      }],
    ]);
    this.backgroundImage = this.sceneToAssetsMap.get(sceneType)?.backgroundImage || "";
    this.characterImage = this.sceneToAssetsMap.get(sceneType)?.characterImage || "";
    this.texts = this.sceneToAssetsMap.get(sceneType)?.texts || [];
    this.onEndCallback = onEndCallback;

    this.draw()
  }

  draw() {
    this.addBackground();
    this.addCharacter();
    this.addTextBubble();
    this.addCaption();
    // this.setFadeaway(); // Uncomment if you want automatic fadeaway
  }

  addBackground() {
    // Ensure background is only added once
    if (!this.background) {
      this.background = this.scene.add.sprite(
        this.scene.cameras.main.centerX,
        this.scene.cameras.main.centerY,
        this.backgroundImage
      ).setInteractive().setDepth(0);

      // Properly handle the background click
      this.background.on('pointerdown', () => {
        this.nextCaption();
      });
      this.background.setDisplaySize(this.scene.cameras.main.width, this.scene.cameras.main.height);
    }
  }

  addCharacter() {
    // Ensure character is only added once
    if (!this.robotSprite) {
      this.robotSprite = this.scene.add.sprite(
        this.scene.cameras.main.centerX,
        this.scene.cameras.main.centerY - 40,
        this.characterImage
      ).setScale(1.5).setDepth(0).setOrigin(0.5, 0.5).setInteractive();

      // Properly handle the character click
      this.robotSprite.on('pointerdown', () => {
        this.nextCaption();
      });
    }
  }

  addTextBubble() {
    // Add or update the text bubble
    if (!this.textBubble) {
      this.textBubble = this.scene.add.sprite(
        this.robotSprite.x + 30, // Adjust X for better visibility
        this.robotSprite.y - 100, // Adjust Y for better visibility above the character
        this.textBubbleImage
      ).setScale(0.5).setDepth(2).setOrigin(0.5, 1).setInteractive();
    }
  }

  addCaption() {
    // Update or add new caption text
    if (this.caption) {
      this.caption.setText(this.texts[this.currentIndex]);
    } else {
      this.caption = this.scene.add.text(
        this.textBubble.x - this.textBubble.displayWidth / 2 + 20, // Position inside the bubble
        this.textBubble.y - this.textBubble.displayHeight / 2 + 10, // Position inside the bubble
        this.texts[this.currentIndex],
        {
          fontFamily: '"Press Start 2P", cursive',
          font: "20px",
          color: "black",
          align: "center",
          backgroundColor: "transparent", // Set to transparent or a suitable background color
          wordWrap: { width: this.textBubble.displayWidth - 40 }, // Adjust word wrap width to fit inside the bubble
        }
      ).setDepth(3);
    }
  }

  nextCaption() {
    this.currentIndex++;
    if (this.currentIndex < this.texts.length) {
      this.addCaption(); // Update the caption text
    } else {
      this.markFinished(); // All captions shown
    }
  }
  markFinished() {
    //destory everything
    this.background?.destroy();
    this.robotSprite?.destroy();
    this.textBubble?.destroy();
    this.caption?.destroy();
    this.onEndCallback();
  }
}