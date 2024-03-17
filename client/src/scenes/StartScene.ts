import Phaser from 'phaser';
import * as Colyseus from 'colyseus.js';
import { UsernamePopup } from '../components/UsernamePopup';
import UIPlugin from "phaser3-rex-plugins/templates/ui/ui-plugin.js";
import { createCharacterAnims } from '~/anims/CharacterAnims';

export default class StartScene extends Phaser.Scene {
  rexUI: UIPlugin;
  private client: Colyseus.Client;
  private room: Colyseus.Room | undefined;
  private currentUsername: string = '';

  constructor() {
    super('start');
    this.client = new Colyseus.Client('ws://localhost:2567');
  }

  preload() {
    this.load.scenePlugin({
      key: "rexuiplugin",
      url: "https://raw.githubusercontent.com/rexrainbow/phaser3-rex-notes/master/dist/rexuiplugin.min.js",
      sceneKey: "rexUI",
    });
    // Preload assets
    this.load.image('background', 'ui/start-background.png');
    this.load.image('startButton', 'ui/start-button.png');
  }

  create() {
    try {
      this.add.image(this.cameras.main.centerX, this.cameras.main.centerY, 'background').setDisplaySize(this.cameras.main.width, this.cameras.main.height);

      this.add.text(this.cameras.main.centerX, this.cameras.main.centerY - 100, 'Welcome to Omega City!', {
        fontFamily: '"Press Start 2P", cursive',
        fontSize: '36px',
        color: '#FFFFFF',
        fontStyle: 'bold',
        stroke: '#000000',
        strokeThickness: 8,
        shadow: { offsetX: 2, offsetY: 2, color: '#000', blur: 5, fill: true }
      }).setOrigin(0.5);


      this.createGraphicalStartButton();

      createCharacterAnims(this.anims);
    } catch (e) {
      console.error('Error creating start scene:', e);
    }
  }

  private createGraphicalStartButton() {
    const button = this.add.image(this.cameras.main.centerX, this.cameras.main.centerY, 'startButton')
      .setInteractive({ useHandCursor: true })
      .on('pointerdown', () => this.createUsernamePopup());


    button.setScale(0.5);
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
      this.scene.start('game', { username: this.currentUsername, playerEXP: 0 });
      console.log('passing username to game room as ', this.currentUsername);
    } catch (error) {
      console.error('joinOrCreate failed:', error);
    }
  }
}