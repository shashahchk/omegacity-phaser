import { Scene } from "phaser";
import { SceneEnum } from "../../types/SceneType";

export class GuidedCaptionsPopup {
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
        characterImage: "robot",
        backgroundImage: "dungeon-background"
      }],
      [SceneEnum.START, {
        texts: ["Welcome to Omega City, community for coders!", "Here is where you can meet and interact with fellow aspiring programmers", "I am your mayor, Mayor Codey, here to serve you!"],
        characterImage: "robot",
        backgroundImage: "village-background"
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
    if (!this.robotSprite) {
      this.robotSprite = this.scene.add.sprite(
        this.scene.cameras.main.centerX - 100, // Move to the left
        this.scene.cameras.main.centerY,
        this.characterImage
      ).setScale(1.5).setDepth(0).setOrigin(0.5, 0.5).setInteractive();
  
      this.robotSprite.on('pointerdown', () => {
        this.nextCaption();
      });
    }
  }
  
  addTextBubble() {
    if (!this.textBubble) {
      this.textBubble = this.scene.add.sprite(
        this.scene.cameras.main.centerX + 200, // Move to the right
        this.scene.cameras.main.centerY - 100, // Move up
        this.textBubbleImage
      ).setScale(1.2).setDepth(2).setInteractive();
    }

    this.textBubble.on('pointerdown', () => {
      this.nextCaption();
    })
  }
  
  addCaption() {
    if (this.caption) {
      this.caption.setText(this.texts[this.currentIndex]);
    } else {
      this.caption = this.scene.add.text(
        this.textBubble.x, // Align with the text bubble's x position
        this.textBubble.y - this.textBubble.height / 6, // Align with the text bubble's y position
      this.texts[this.currentIndex],
        {
          fontFamily: '"Press Start 2P", cursive',
          fontSize: "15px",
          color: "black",
          align: "center",
          backgroundColor: "transparent",
          wordWrap: { width: this.textBubble.displayWidth - 70 },
          fixedWidth: this.textBubble.displayWidth - 70, // Set a fixed width to align the text properly
        }
      ).setDepth(3).setOrigin(0.5, 0); // Set origin to center horizontally and align to top vertically
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