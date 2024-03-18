import Phaser from "phaser";
import UIPlugin from "phaser3-rex-plugins/templates/ui/ui-plugin.js";
import * as Colyseus from "colyseus.js";

export class BattleUi extends Phaser.Scene {
  rexUI: UIPlugin;
  private room: Colyseus.Room | undefined; //room is a property of the class
  private playerInfoBar = null;
  private container: Phaser.GameObjects.Container;
  private gridSizer: UIPlugin.GridSizer; //to separate players, teamscore
  private width: number;
  private height: number;
  private playerInfoPanel: Phaser.GameObjects.Container;
  private teamInfoPanel: Phaser.GameObjects.Container;
  private PLAYER_MAX_HEALTH: number = 100;

  constructor() {
    super({ key: 'battle-ui' });
    this.PLAYER_MAX_HEALTH = 100;
  }

  preload() {
    this.load.scenePlugin({
      key: 'rexuiplugin',
      url: 'https://raw.githubusercontent.com/rexrainbow/phaser3-rex-notes/master/dist/rexuiplugin.min.js',
      sceneKey: 'rexUI',
    });
  }

  create(data) {
    this.room = data.room;
    this.createBattleStatsBar(this.scale.width, this.scale.height);
    this.setUpPlayerListeners()

  }

  setUpPlayerListeners(){
    this.room.state.players.onAdd((player, sessionId) => {
      this.gridSizer.clear(true);
      this.gridSizer.destroy();
      this.container.destroy();
      this.createBattleStatsBar(this.scale.width, this.scale.height);
      player.onChange(() => {
        this.gridSizer.clear(true);
      this.gridSizer.destroy();
      this.container.destroy();
      this.createBattleStatsBar(this.scale.width, this.scale.height);
      })
    }
    )
  }
  createBattleStatsBar(width, height) {
    this.width = width;
    this.height = height;
    this.container = this.add.container(0, 0);
    this.gridSizer = this.rexUI.add.gridSizer({
      x: width / 2,
      y: height / 2,
      column: 2,
      row: 1,
      space: { column: 20, row: 20 },
    });

    this.createPlayerInfoPanel();
    this.container.add(this.gridSizer);
    this.setupToggleVisibility();
  }

  createPlayerInfoPanel() {
    const players = this.room.state.players;
    if (!players) return;

    const playerInfoSizer = this.rexUI.add.sizer({
      orientation: 'vertical',
      space: { item: 10 }
    });

    players.forEach((player, playerId) => {
        const playerInfoPanel = this.createPlayerInfo(player);
        playerInfoSizer.add(playerInfoPanel).layout();
      });

    this.gridSizer.add(playerInfoSizer);  
    this.gridSizer.layout();
    
  }

  createPlayerInfo(player) {
    const healthBar = this.createHealthBar(0, 0, player.health, this.PLAYER_MAX_HEALTH, 100, 20);
    const sprite = this.add.sprite(0, 0, "hero", `${player.charName}-walk-down-0`);
    const expText = this.add.text(0, 0, `EXP: ${player.playerEXP}`);

    return this.rexUI.add.sizer({
      orientation: 'horizontal',
      space: { item: 8 }
    }).add(sprite)
      .add(healthBar)
      .add(expText).layout();
  }

  createTeamInfo(team) {
    const scoreText = this.add.text(0, 0, `Score: ${team.teamMatchScore}`);
    return this.rexUI.add.sizer({
      orientation: 'horizontal'
    }).add(scoreText);
  }

  setupToggleVisibility() {
    this.input.keyboard.on("keydown-TAB", () => {
      this.container.visible = !this.container.visible;
    });
  }

  createHealthBar(x, y, health, maxHealth, width, height) {
    // Calculate the health percentage
    let healthPercentage = health / maxHealth;
  
    // Determine the health bar color
    let color = this.getHealthBarColor(healthPercentage);
  
    // Create a container for the health bar
    let healthBarContainer = this.rexUI.add.container(x, y);
  
    // Create the background bar (greyed out)
    let backgroundBar = this.rexUI.add.roundRectangle(0, 0, width, height, 10, 0x808080); // Grey background
    healthBarContainer.add(backgroundBar); // Add background bar to the container
  
    // Create the foreground health bar
    let healthBarLength = healthPercentage * width;
    let healthBar = this.rexUI.add.roundRectangle(0, 0, healthBarLength, height, 10, color);
    healthBar.setPosition(healthBarLength / 2 - width / 2, 0); // Positioning the health bar correctly within the container
    healthBarContainer.add(healthBar); // Add health bar to the container
  
    // Return the container with both bars
    return healthBarContainer;
  }
  
  getHealthBarColor(percentage) {
    if (percentage < 0.3) {
      return 0xff0000; // Red
    } else if (percentage < 0.6) {
      return 0xffa500; // Orange
    } else {
      return 0x00ff00; // Green
    }
  }
}  