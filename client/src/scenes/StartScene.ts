import Phaser from "phaser";
import * as Colyseus from "colyseus.js";
import { UsernamePopup } from "../components/UsernamePopup";
import UIPlugin from "phaser3-rex-plugins/templates/ui/ui-plugin.js";
import { createCharacterAnims } from "~/anims/CharacterAnims";
import { HeroEnum } from "../../types/CharacterTypes";
import { AUDIO_ASSETS } from "~/constants/AudioAssets";
import { GuidedCaptionsPopup } from "~/components/GuidedCaptionsPopup";
import { SceneEnum } from "../../types/SceneType";

export default class StartScene extends Phaser.Scene {
  rexUI: UIPlugin;
  private client: Colyseus.Client;
  private room: Colyseus.Room | undefined;
  private currentUsername: string = "";
  private chosenCharacter: string = "hero1";
  private backgroundImage: Phaser.GameObjects.Image | undefined;
  private welcomeText: Phaser.GameObjects.Text | undefined;

  constructor() {
    super("start");
    this.client = new Colyseus.Client("ws://localhost:2567");
  }

  preload() {
    this.load.scenePlugin({
      key: "rexuiplugin",
      url: "https://raw.githubusercontent.com/rexrainbow/phaser3-rex-notes/master/dist/rexuiplugin.min.js",
      sceneKey: "rexUI",
    });
    // Preload assets
    this.load.image("background", "ui/start-background.png");
    this.load.image("startButton", "ui/start-button.png");
    this.load.image("arrow", "ui/arrow.png");
    this.load.image("big-speech-bubble", "ui/big-speech-bubble.png");
    this.load.image("robot", "ui/robot.png");
    this.load.image("dungeon-background", "ui/dungeon-background.png");

    // this.load.audio('dafunk', [
    //   'audio/Dafunk - Hardcore Power (We Believe In Goa - Remix).ogg',
    //   'audio/Dafunk - Hardcore Power (We Believe In Goa - Remix).mp3',
    //   'audio/Dafunk - Hardcore Power (We Believe In Goa - Remix).m4a'
    // ]);

    AUDIO_ASSETS.forEach((file) => {
      this.load.audio(file.key, file.paths);
    });
    this.load.audio("battle", ["audio/battle.mp3"]);
    this.load.audio("lobby", ["audio/lobby.mp3"]);
    this.sound.once("loadeddata", () => {
      this.sound.setVolume(0.5);
    });
  }

  create() {
    try {
      this.backgroundImage = this.add
        .image(
          this.cameras.main.centerX,
          this.cameras.main.centerY,
          "background"
        )
        .setDisplaySize(this.cameras.main.width, this.cameras.main.height);

      this.welcomeText = this.add
        .text(
          this.cameras.main.centerX,
          this.cameras.main.centerY - 100,
          "Welcome to Omega City!",
          {
            fontFamily: '"Press Start 2P", cursive',
            fontSize: "36px",
            color: "#FFFFFF",
            fontStyle: "bold",
            stroke: "#000000",
            strokeThickness: 8,
            shadow: {
              offsetX: 2,
              offsetY: 2,
              color: "#000",
              blur: 5,
              fill: true,
            },
          }
        )
        .setOrigin(0.5);

      this.createGraphicalStartButton();
      createCharacterAnims(this.anims);
    } catch (e) {
      console.error("Error creating start scene:", e);
    }
  }

  private createGraphicalStartButton() {
    const button = this.add
      .image(
        this.cameras.main.centerX,
        this.cameras.main.centerY,
        "startButton"
      )
      .setScale(0.5)
      .setInteractive({ useHandCursor: true })
      .on("pointerdown", () => {
        button.setScale(0.5);
        button.removeInteractive();
        this.sound.play("start-scene", { volume: 0.3 });
        button.destroy();
        this.backgroundImage.setVisible(false);
        this.welcomeText.setVisible(false);
        this.createTutorialPopup();
        // this.createUsernamePopup();
        // this.createCharacterPopup();
      })
      .on("pointerover", () => button.setScale(0.6))
      .on("pointerout", () => button.setScale(0.5));
  }

  private createTutorialPopup() {
    const popup = new GuidedCaptionsPopup(this, SceneEnum.START, () => {
      this.add
        .image(
          this.cameras.main.centerX,
          this.cameras.main.centerY,
          "village-background"
        )
        .setDisplaySize(this.cameras.main.width, this.cameras.main.height);
      this.createUsernamePopup();
      this.createCharacterPopup();
    });
  }

  private createCharacterPopup() {
    // Array of character keys
    const characters = Object.keys(HeroEnum).map((key) => {
      console.log(key);
      return HeroEnum[key];
    });
    console.log("characters:", characters);

    // Current character index
    let currentCharacter = 0;

    // Calculate the position for the character popup
    const usernamePopupWidth = 300; // Replace with the actual width of the username popup
    const gap = 50; // Gap between the username popup and the character popup
    const x = this.cameras.main.centerX + usernamePopupWidth / 2 + gap;
    const y = this.cameras.main.centerY;

    // Create character sprite
    const characterSprite = this.add.sprite(
      x,
      y,
      "hero",
      `${characters[currentCharacter]}-walk-down-1`
    );

    characterSprite.setScale(4);
    // Create next button
    const nextButton = this.add
      .image(x + 50, y, "arrow")
      .setScale(0.05)
      .setRotation(Math.PI / 2)
      .setInteractive({ useHandCursor: true })
      .on("pointerover", () => nextButton.setScale(0.04))
      .on("pointerout", () => nextButton.setScale(0.05))
      .on("pointerdown", () => {
        // Increment current character index
        this.sound.play("change-character");
        currentCharacter = (currentCharacter + 1) % characters.length;

        // Update character sprite
        characterSprite.setFrame(`${characters[currentCharacter]}-walk-down-0`);

        this.chosenCharacter = characters[currentCharacter];
      });
    nextButton
      .on("pointerover", () => nextButton.setScale(0.06))
      .on("pointerout", () => nextButton.setScale(0.05));

    // Create previous button
    const prevButton = this.add
      .image(x - 50, y, "arrow")
      .setScale(0.05)
      .setRotation(-Math.PI / 2)
      .setInteractive({ useHandCursor: true })
      .on("pointerover", () => prevButton.setScale(0.04))
      .on("pointerout", () => prevButton.setScale(0.05))
      .on("pointerdown", () => {
        // Decrement current character index
        this.sound.play("change-character");
        currentCharacter =
          (currentCharacter - 1 + characters.length) % characters.length;

        // Update character sprite
        characterSprite.setFrame(`${characters[currentCharacter]}-walk-down-0`);

        this.chosenCharacter = characters[currentCharacter];
      });
    prevButton
      .on("pointerover", () => prevButton.setScale(0.06))
      .on("pointerout", () => prevButton.setScale(0.05));
  }

  private createUsernamePopup() {
    new UsernamePopup(this, this.handleUsernameSubmit.bind(this));
  }

  private async handleUsernameSubmit(username: string) {
    console.log("Username submitted:", username);
    this.currentUsername = username;
    await this.joinGameRoom();
  }

  private async joinGameRoom() {
    try {
      this.scene.start("game", {
        username: this.currentUsername,
        charName: this.chosenCharacter,
        playerEXP: 0,
      });
      console.log("passing username to game room as ", this.currentUsername);
      console.log("passing chosen cahracter as ", this.chosenCharacter);
    } catch (error) {
      console.error("joinOrCreate failed:", error);
    }
  }
} // End of StartScene
