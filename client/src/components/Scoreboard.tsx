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
  private width: number;
  private height: number;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
    this.teamData = [];
    this.totalRounds = 0;
    this.currentRound = 0;
    this.roundDurationInMinute = 0;
    this.currentRoundTimeRemaining = 0;

    this.createScoreboard(scene.scale.width, scene.scale.height);
  }

  createScoreboard(width: number, height:number) {
    // Scoreboard configuration
    this.width = width;
    this.height = height;

    // Create a RexUI panel for the scoreboard
    this.scorePanel = this.scene.rexUI.add.sizer(
      {
        x: this.scene.cameras.main.width / 2,
        y: this.scene.cameras.main.height / 2 - 230,
        orientation: "y",
        space: { item: 10 },
      },
      { expand: true }
      )
      .layout()
      .setOrigin(0.5, 0)

    // Ensure the scoreboard is on top of other game objects
    this.scorePanel.setDepth(10).setScrollFactor(0);

    // Debugging log
    console.log("Is the scoreboard visible?", this.scorePanel.visible);

    this.scene.input.keyboard.on("keydown-TAB", this.toggleVisibility, this);
    //this.createPermanentScoreboard();
  }

    // Inside the Scoreboard class
    public updateScoreboard(rawTeamData: any) {
      if (rawTeamData == undefined) {
        return;
      }

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
        if (this.scorePanel && this.scorePanel.layout) {
          this.scorePanel.clear(true);
          // Add the updated content
          const content = this.createContent();
          if (content) {
            this.scorePanel.add(content);
            // // Refresh the layout
            this.scorePanel.layout();
          } else {
            console.error("Failed to create content for the scoreboard.");
          }
        }
      } else {
        console.error("No team data available to update scoreboard.");
      }
      if (this.scorePanel && this.scorePanel.layout) {
        this.scorePanel.layout();
      }
    }


  createContent() {
    const colorMap = {
      blue: "#0000FF",
      red: "#FF0000",
      green: "#00FF00",
    };

    // Horizontal sizer to hold each team's information
    const horizontalSizer = this.scene.rexUI.add.sizer({
      orientation: 'x', // Changed to 'y' for a horizontal layout
      space: { item: 10 }, // Space between items
    });

    this.teamData.forEach((team) => {
      const hexColor = colorMap[team.teamColor.toLowerCase()];
      // let teamColorBox = this.scene.rexUI.add.roundRectangle(
      //   0,
      //   0,
      //   100, // Width of the color box
      //   20,
      //   10,
      //   Phaser.Display.Color.HexStringToColor(hexColor).color
      // );

      let teamScoreText = `Team: ${team.teamColor.toUpperCase()}\nMatch Score: ${team.teamMatchScore}\nRound Score: ${team.teamRoundScore}`;

      let teamLabel = this.scene.add.text(0, 0, teamScoreText, {
        fontFamily: '"Press Start 2P", cursive',
        fontSize: "13px", // Reduced font size for better fit
        color: "#ffffff",
      }).setWordWrapWidth(250, true); // Added word wrap to prevent overflow

      teamLabel.setColor(hexColor);

      const teamSizer = this.scene.rexUI.add.sizer({
        orientation: 'y', // Horizontal orientation
        space: { item: 5 }, // Space between color box and label
      })
        .add(teamLabel, { expand: true, align: 'left' }); // Add label to teamSizer with alignment

      horizontalSizer.add(teamSizer, { expand: true, align: 'left' }); // Add each teamSizer to the horizontalSizer
    });

    if (horizontalSizer && typeof horizontalSizer === 'object') {
      return horizontalSizer.layout();
    } else {
      console.error('horizontalSizer is not defined or not an object');
      return null;
    }
  }


  private toggleVisibility() {
    const isVisible = this.scorePanel?.visible;
    this.scorePanel?.setVisible(!isVisible);
    this.border?.setVisible(!isVisible);
  }
}

export default Scoreboard;