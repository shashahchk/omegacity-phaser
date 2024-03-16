// @ts-nocheck

// ScoreBoard.ts
import Phaser from "phaser";
import RexUIPlugin from "phaser3-rex-plugins/templates/ui/ui-plugin.js";

type PlayerData = {
  name: string;
  questionsSolved: number;
  score: number;
  roundScore: number;
  totalScore: number;
  health: number;
  sessionId?: string;
};

type TeamData = {
  teamColor: string;
  teamPlayers: PlayerData[];
  teamMatchScore: number;
  teamRoundScore: number;
};

export class Scoreboard {
  private scene: Phaser.Scene;
  private teamData: TeamData[];
  private totalRounds: number;
  private currentRound: number;
  private roundDurationInMinute: number;
  private currentRoundTimeRemaining: number;
  private scorePanel: any;
  private border: Phaser.GameObjects.Graphics;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
    this.teamData = [];
    this.totalRounds = 0;
    this.currentRound = 0;
    this.roundDurationInMinute = 0;
    this.currentRoundTimeRemaining = 0;

    this.createScoreboard();
  }

  createScoreboard() {
    const { width } = this.scene.scale;

    // Scoreboard configuration
    const scoreboardWidth = Math.min(700, width - 100);
    const scoreboardHeight = 100;

    // Create a RexUI panel for the scoreboard
    this.scorePanel = this.scene.rexUI.add
      .scrollablePanel({
        x: width / 2,
        y: 50, // set y position to a little below the top of the screen
        width: Math.min(700, width - 100), // adjust the width as necessary
        height: 100, // adjust the height as necessary
        scrollMode: 0,
        background: this.scene.rexUI.add.roundRectangle(
          0,
          0,
          2,
          2,
          10,
          0x4e342e
        ),
        panel: {
          child: this.createContent(),
          mask: { padding: 1 },
        },
        slider: {
          track: this.scene.rexUI.add.roundRectangle(
            0,
            0,
            20,
            10,
            10,
            0x260e04
          ),
          thumb: this.scene.rexUI.add.roundRectangle(0, 0, 0, 0, 13, 0x7b5e57),
        },
        space: {
          left: 10,
          right: 10,
          top: 10,
          bottom: 10,
          panel: 10,
        },
      })
      .layout()
      .setOrigin(0.5, 0); // set the origin to the middle top

    // Ensure the scoreboard is on top of other game objects
    this.scorePanel.setDepth(100).setScrollFactor(0);

    // Debugging log
    console.log("Is the scoreboard visible?", this.scorePanel.visible);

    // this.border = this.scene.add.graphics();
    // this.border.lineStyle(4, 0xffffff, 1);
    // this.border.fillStyle(0x000000, 0.5);
    // this.border.strokeRect(
    //   this.scorePanel.x - scoreboardWidth / 2,
    //   this.scorePanel.y,
    //   scoreboardWidth,
    //   scoreboardHeight
    // );
    // this.border.fillRect(
    //   this.scorePanel.x - scoreboardWidth / 2,
    //   this.scorePanel.y,
    //   scoreboardWidth,
    //   scoreboardHeight
    // );
    // this.border.setDepth(99).setScrollFactor(0);
    // Add the keyboard event listener
    // Toggle visibility on TAB key
    this.scene.input.keyboard.on("keydown-TAB", this.toggleVisibility, this);
  }

  createContent() {
    const colorMap = {
      blue: "#0000FF",
      red: "#FF0000",
      green: "#00FF00",
    };

    const sizer = this.scene.rexUI.add.sizer({
      orientation: "y",
      space: { item: 10 },
    });

    this.teamData.forEach((team) => {
      const hexColor = colorMap[team.teamColor.toLowerCase()];
      let teamColorBox = this.scene.rexUI.add.roundRectangle(
        0,
        0,
        100,
        40,
        10,
        Phaser.Display.Color.HexStringToColor(hexColor).color
      );
      let teamScoreText = `Team ${team.teamColor.toUpperCase()}: Match Score: ${
        team.teamMatchScore
      }, Round Score: ${team.teamRoundScore}`;
      let teamLabel = this.scene.add.text(0, 0, teamScoreText, {
        fontFamily: '"Press Start 2P", cursive',
        fontSize: "20px",
        color: "#ffffff",
      });
      sizer.add(teamColorBox);
      sizer.add(teamLabel);
    });

    return sizer;
  }

  // Inside the Scoreboard class

  public updateScoreboard(rawTeamData: any) {
    // Debugging: Log raw data
    console.log("Raw team data:", rawTeamData);

    const teamDataArray = Object.keys(rawTeamData).map((key) => {
      const team = rawTeamData[key];
      return {
        teamColor: key,
        teamPlayers: team.teamPlayers || [],
        teamMatchScore: team.teamMatchScore,
        teamRoundScore: team.teamRoundScore,
      };
    });

    console.log("Formatted team data array:", teamDataArray);

    if (teamDataArray.length > 0) {
      this.teamData = teamDataArray;

      // Ensure panel is ready and clear it
      if (this.scorePanel) {
        this.scorePanel.clear(true);
        // Add the updated content
        const content = this.createContent();
        if (content) {
          this.scorePanel.add(content);
          // Refresh the layout
          this.scorePanel.layout();
        } else {
          console.error("Failed to create content for the scoreboard.");
        }
      }
    } else {
      console.error("No team data available to update scoreboard.");
    }
  }
  private toggleVisibility() {
    const isVisible = this.scorePanel.visible;
    this.scorePanel.setVisible(!isVisible);
    this.border.setVisible(!isVisible);
  }
}

export default Scoreboard;
