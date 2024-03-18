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
    this.createTeamInfoPanel();
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
        playerInfoSizer.add(playerInfoPanel);
      });

    this.gridSizer.add(playerInfoSizer);
  }

  createTeamInfoPanel() {
    const teams = this.room.state.teams;
    if (!teams) return;

    const teamInfoSizer = this.rexUI.add.sizer({
      orientation: 'vertical',
      space: { item: 10 }
    });

    teams.forEach((team, teamColor) => {
      const teamInfoPanel = this.createTeamInfo(team);
      teamInfoSizer.add(teamInfoPanel);
    });

    this.gridSizer.add(teamInfoSizer);
  }

  createPlayerInfo(player) {
    const healthBar = this.createHealthBar(player.health, this.PLAYER_MAX_HEALTH);
    const sprite = this.add.sprite(0, 0, "hero", `${player.charName}-walk-down-0`);
    const expText = this.add.text(0, 0, `EXP: ${player.exp}`);

    return this.rexUI.add.sizer({
      orientation: 'horizontal',
      space: { item: 8 }
    }).add(sprite)
      .add(healthBar)
      .add(expText);
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

  createHealthBar(health, maxHealth) {
    let color = this.getHealthBarColor(health / maxHealth);
    return this.rexUI.add.roundRectangle(0, 0, 100 * (health / maxHealth), 20, 10, color);
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