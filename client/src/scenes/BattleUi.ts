import Phaser from "phaser";
import UIPlugin from "phaser3-rex-plugins/templates/ui/ui-plugin.js";
import * as Colyseus from "colyseus.js";
import { serverInBattlePlayerType, serverTeamType } from "../../types/CharacterTypes";
import { MapSchema } from "@colyseus/schema";

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
  private myTeam = undefined;
  private battleEnded: Boolean = false;

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
    console.log('create in battleui called againnnnnnn')
    this.room = data.room;
    this.createBattleStatsBar(this.scale.width, this.scale.height);
    this.setUpPlayerListeners()
  }

  recreateBattleStatsBar() {
    console.log('recreateBattleStatsBar called')
    this.gridSizer.clear(true);
    this.gridSizer.destroy();
    this.container.destroy();
    this.createBattleStatsBar(this.scale.width, this.scale.height);
  }

  setUpPlayerListeners() {
    this.room.state.players.onAdd((player, sessionId) => {
      if (this.myTeam == undefined) {
        this.myTeam = player.teamColor;
      }
      //shouldnt call for the first player
      if (sessionId !== this.room.sessionId) {
        this.recreateBattleStatsBar();
      }

      player.onChange(() => {
        this.recreateBattleStatsBar();
      })
    }
    )
  }
  createBattleStatsBar(width, height) {
    //onyl called at the beginning of the round
    this.width = width;
    this.height = height;
    this.container = this.add.container(0, 0);
  
    this.gridSizer = this.rexUI.add.gridSizer({
      x: 125,
      y: 50,
      column: 2,
      row: 1,
      space: { column: 20, row: 20 },
      anchor: {
        left: 'left+0',
        top: 'top+0',
      }
    })

    this.gridSizer.layout();
    this.createAllPlayersPanel();
    this.container.add(this.gridSizer);
    this.setupToggleVisibility();
  }

  createAllPlayersPanel() {
    const players = this.room.state.players;
    if (!this.room || !this.room.state.players || this.battleEnded) return;

    const playerInfoSizer = this.rexUI.add.sizer({
      orientation: 'vertical',
      space: { item: 10 }
    });

    players.forEach((player, playerId) => {
      const playerInfoPanel = this.createPlayerInfo(player);
      playerInfoSizer.add(playerInfoPanel)
      playerInfoSizer.layout();
    });

    this.gridSizer.add(playerInfoSizer);
    this.gridSizer.layout();

  }

  createPlayerSprite(player) {
    const sprite = this.add.sprite(0, 0, "hero", `${player.charName}-walk-down-0`);
    if (player.teamColor !== this.myTeam) {
      sprite.setTint(0xcc0000); // Tint the sprite red
    }
    if (player.health == 0) {
      sprite.setAlpha(0.5); // Make the sprite semi-transparent if the player is dead
    }
    return sprite
  }

  createEXPText(player) {
    const EXPText = this.add.text(0, 0, `EXP: ${player.playerEXP}`, { fontSize: '10px' , fill: '#000000'});
    if (player.health == 0) {
      EXPText.setAlpha(0.5); // Make the text semi-transparent if the player is dead
    }
    return EXPText
  }

  createPlayerInfo(player) {
    const healthBar = this.createHealthBar(0, 0, player.health, this.PLAYER_MAX_HEALTH, 80, 7);
    const sprite = this.createPlayerSprite(player);
    const username = this.add.text(0, 0, player.username, { fontSize: '10px' });
    const expText = this.createEXPText(player);
    const spriteAndUsername = this.rexUI.add.sizer({
      orientation: 'vertical',
      space: { item: 3 }
    }).add(sprite).add(username).layout();

    return this.rexUI.add.sizer({// Set the background color of the panel to the player's team color
      orientation: 'horizontal',
      space: { item: 15 } // This sets the space between items. Adjust the value to increase or decrease the spacing.
    }).add(spriteAndUsername, { proportion: 0, align: 'left', padding: { right: 10 } }) // Add padding to the right of the sprite
      .add(healthBar, { proportion: 0, align: 'center', padding: { left: 20, right: 20 } }) // Add padding on both sides of the health bar
      .add(expText, { proportion: 0, align: 'right', padding: { left: 20 } }) // Add padding to the left of the EXP text
      .layout(); // This applies the layout changes
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
    let backgroundBar = this.rexUI.add.roundRectangle(0, 0, width, height, 8, 0x808080); // Grey background

    healthBarContainer.add(backgroundBar); // Add background bar to the container

    // Create the foreground health bar
    let healthBarLength = healthPercentage * width;
    let healthBar = this.rexUI.add.roundRectangle(0, 0, healthBarLength, height, 8, color);
    if (health == 0) {
      healthBar.setVisible(false);
    }
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

  createConfirmButton(x: number, y: number, text: string): Phaser.GameObjects.Text {
    const style = { font: "32px Arial", fill: "#ffffff", align: "center" };
    const button = this.add.text(x, y, text, style)
      .setInteractive({ useHandCursor: true })  // Make the text interactive and show the hand cursor on hover

    return button;
  }

  // null if draw
  findWinningTeam(teams: Record<string, serverTeamType>): string | null {
    let maxScore = 0;
    let winningTeam: string | null = null;

    for (let teamColor in teams) {
      let team = teams[teamColor];
      console.log(team);
      console.log("team.teamMatchScore", team.teamMatchScore, teamColor);
      if (team.teamMatchScore > maxScore) {
        maxScore = team.teamMatchScore;
        winningTeam = teamColor;
        console.log("set winning team to ", teamColor);
      } else if (team.teamMatchScore === maxScore) {
        winningTeam = null;
        console.log("set winning team to null ", teamColor);
      }
    }

    return winningTeam;
  }

  // find mvp 
  // if tied, then return all tied players, list of players 
  findMVP(players: Record<string, serverInBattlePlayerType>): serverInBattlePlayerType[] {
    let mvp: serverInBattlePlayerType[] = [];
    let maxScore = 0;

    for (let key in players) {
      let player = players[key];
      if (player.totalScore > maxScore) {
        maxScore = player.totalScore;
        mvp = [player];
      } else if (player.totalScore === maxScore) {
        mvp.push(player);
      }
    }

    return mvp;
  }

  // somehow dont have .sort() method, so using bubble sort
  // descending order
  sortPlayersAccordingToTotalScore(players: Record<string, serverInBattlePlayerType>): serverInBattlePlayerType[] {
    let playersArray = [];
    for (let key in players) {
      playersArray.push(players[key]);
    }

    let len = playersArray.length;
    for (let i = 0; i < len; i++) {
      for (let j = 0; j < len - i - 1; j++) {
        if (playersArray[j].totalScore < playersArray[j + 1].totalScore) {
          let temp = playersArray[j];
          playersArray[j] = playersArray[j + 1];
          playersArray[j + 1] = temp;
        }
      }
    }

    return playersArray;
  }
  
  createAllPlayerSummaryPanel(mainSizer, players, winningTeam) {
    const playerSummarySizer = this.rexUI.add.sizer({
      orientation: 'vertical',
      space: { item: 10 }
    });
  
    players.forEach((player, playerId) => {
      const playerSummaryPanel = this.createPlayerSummaryInfo(player, winningTeam);
      playerSummarySizer.add(playerSummaryPanel);
    });
  
    playerSummarySizer.layout(); // Layout should be called once after all items are added
    mainSizer.add(playerSummarySizer);
    mainSizer.layout(); // Layout should be called once after all items are added
  }
  
  createPlayerSummaryInfo(player, winningTeam) {
    const sprite = this.createPlayerSprite(player);

    let usernameText = player.username;
    if (player.sessionId === this.room.sessionId) {
      usernameText += " (Me)";
    }
    const username = this.add.text(0, 0, usernameText, { fontSize: '10px', color: '#000000' });
    const scoreText = this.add.text(0, 0, `Score: ${player.totalScore}`, { fontSize: '10px', color: '#000000' });
    const killsText = this.add.text(0, 0, `Kills: ${player.totalQuestionIdsSolved.length}`, { fontSize: '10px', color: '#000000' });
    const teamText = this.add.text(0, 0, `Team:  ${player.teamColor}`, { fontSize: '10px', color: '#000000' });
    const expText = this.createEXPText(player);
    let expEarnedText;
    
    if (player.teamColor === winningTeam) {
        expEarnedText = this.add.text(0, 0, `+ 10 EXP`, { fontSize: '10px', color: 'green' });
    } else {
        expEarnedText = this.add.text(0, 0, `+ 0 EXP`, { fontSize: '10px', color: 'green' });
    }

    const spriteAndUsername = this.rexUI.add.sizer({
      orientation: 'vertical',
      space: { item: 3 }
    }).add(sprite).add(username).layout();
  
    return this.rexUI.add.sizer({
      orientation: 'horizontal',
      space: { item: 15 } // This sets the space between items. Adjust the value to increase or decrease the spacing.
    })
      .add(spriteAndUsername, { proportion: 0, align: 'left'}) // Add padding to the right of the sprite
      .add(scoreText, { proportion: 0, align: 'center' }) // Add padding on both sides of the health bar
      .add(killsText, { proportion: 0, align: 'center' }) // Add padding on both sides of the health bar
      .add(teamText)
      .add(expText, { proportion: 0, align: 'right' }) // Add padding to the left of the EXP text
      .add(expEarnedText, { proportion: 0, align: 'right'}) // Add padding to the left of the EXP text
      .layout(); // This applies the layout changes
  }

  addBackground() {
    // Panel Background
    const blackBackground = this.add.graphics({ fillStyle: { color: 0x000000, alpha: 0.8 } });
    blackBackground.fillRect(0, 0, this.cameras.main.width, this.cameras.main.height);

    // Panel Background
    const whiteBackgroundpadding = 50; // Adjust this value to change the padding
    const whiteBackground = this.add.graphics({ fillStyle: { color: 0xfffff0 } });
    whiteBackground.fillRect(whiteBackgroundpadding, whiteBackgroundpadding,
      this.cameras.main.width - 2 * whiteBackgroundpadding,
      this.cameras.main.height - 2 * whiteBackgroundpadding);
  }

  createDefeatOrVictoryText(mainSizer, teams, players) {
    const winningTeamColor: string | null = this.findWinningTeam(teams);

    // Victory/Defeat Text
    const myPlayer = players[this.room.sessionId];

    if (myPlayer.teamColor === winningTeamColor) {
      // show victory
      mainSizer.add(this.add.text(this.cameras.main.centerX, this.cameras.main.centerY, `Victory`, { fontSize: '30px', color: '#00ff00' }).setOrigin(0.5));
    } else {
      mainSizer.add(this.add.text(this.cameras.main.centerX, this.cameras.main.centerY, `Defeat`, { fontSize: '30px', color: '#ff0000' }).setOrigin(0.5));
    }
  }


  createMVPPanel() {
    const playerMVP: serverInBattlePlayerType[] = this.findMVP(this.room.state.players);
    if (playerMVP.length > 0) {
      this.add.text(this.cameras.main.centerX, this.cameras.main.centerY + 50, `MVP is: ${playerMVP[0].username}`, { fontSize: '16px', color: '#000000' }).setOrigin(0.5);
    }
  }

  // return buttons that redirects to main page when pointerdown
  createMatchSummaryPanel(roomState) {
    this.battleEnded = true;
    const players: Record<string, serverInBattlePlayerType> = roomState.players;
    const teams: Record<string, serverTeamType> = roomState.teams;

    if (!players || !teams) return;

    this.addBackground();
    const mainSizer = this.rexUI.add.sizer({
      orientation: 'vertical',
      space: { item: 10 },
      anchor: {
        centerX: 'center',
        centerY: 'center'
      }
    });

    const winningTeam = this.findWinningTeam(teams);

    this.createDefeatOrVictoryText(mainSizer, teams, players);

    this.createAllPlayerSummaryPanel(mainSizer, this.sortPlayersAccordingToTotalScore(players), winningTeam)

    this.createMVPPanel();

    // mvp is a list but i only show first player if exist
    // if (playerMVP.length > 0) {
    //   this.add.text(this.cameras.main.centerX, panelY + (-3 - 2) * spacingBetween, `MVP is: ${playerMVP[0].username}`, { fontSize: '16px', color: '#000000' }).setOrigin(0.5);
    // }
    // const sortedPlayers = this.sortPlayersAccordingToTotalScore(players);
    // let index = 0;
    // sortedPlayers.forEach((player, sessionId) => {
    //   var playerName: string = player.username
    //   if (player.sessionId === this.room.sessionId) {
    //     playerName += " (Me)"
    //   }
    //   this.add.text(panelX - 1 * panelPadding, panelY + (index - 2) * spacingBetween, `Player: ${playerName}`, { fontSize: '10px', color: '#000000' });
    //   this.add.text(panelX + 0 * panelPadding, panelY + (index - 2) * spacingBetween, `Score: ${player.totalScore}`, { fontSize: '10px', color: '#000000' });
    //   this.add.text(panelX + 1 * panelPadding, panelY + (index - 2) * spacingBetween, `Kills: ${player.totalQuestionIdsSolved.length}`, { fontSize: '10px', color: '#000000' }); // Assuming kills can be represented by total questions solved
    //   this.add.text(panelX + 2 * panelPadding, panelY + (index - 2) * spacingBetween, `EXP: ${player.playerEXP}`, { fontSize: '10px', color: '#000000' });
    //   this.add.text(panelX + 3 * panelPadding, panelY + (index - 2) * spacingBetween, `Team:  ${player.teamColor}`, { fontSize: '10px', color: '#000000' });

    //   // should abstract this, again, winningTeamColor is somehow always null 
    //   if (player.teamColor === winningTeamColor) {
    //     this.add.text(panelX + 4 * panelPadding, panelY + (index - 2) * spacingBetween, `+ 10 EXP`, { fontSize: '10px', color: '#000000' });
    //   } else {
    //     this.add.text(panelX + 4 * panelPadding, panelY + (index - 2) * spacingBetween, `- 5 EXP`, { fontSize: '10px', color: '#000000' });
    //   }
    //   index++;
    // });

  }

  createBackToLobbyButton() {
      // Confirm Button
      const confirmButton = this.createConfirmButton(this.cameras.main.centerX, this.cameras.main.height - 50, 'Confirm');
      confirmButton.setOrigin(0.5, 0.5); // Center the button origin
  
      // Style the button
      const buttonBackground = this.add.graphics({ fillStyle: { color: 0x1e1e1e } });
      buttonBackground.fillRoundedRect(confirmButton.x - 50, confirmButton.y - 20, 100, 40, 10);
      confirmButton.setDepth(1); // Ensure the button is above the background
  
      return confirmButton;
}


  displayMatchSummary(roomState): Promise<void> {
    return new Promise((resolve) => {
      this.createMatchSummaryPanel(roomState);
      this.createBackToLobbyButton().on('pointerdown', () => {
        resolve();
      });
    });
  }
}