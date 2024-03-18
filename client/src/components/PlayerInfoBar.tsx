// @ts-nocheck

// ScoreBoard.ts
import Phaser from "phaser";

type PlayerData = {
  name: string;
  questionsSolved: number;
  score: number;
  roundScore: number;
  totalScore: number;
  health: number;
  sessionId?: string; // If needed for comparison
};

type TeamData = {
  teamColor: string; // Assuming color is a string like 'red' or 'blue'
  teamPlayers: PlayerData[];
  teamMatchScore: number;
  teamRoundScore: number;
};

export class PlayerInfoBar {
  private scene: Phaser.Scene;
  private scoreText: Phaser.GameObjects.Text;
  private teamData: TeamData[];
  private totalRounds: number;
  private currentRound: number;
  private roundDurationInMinute: number;
  private currentRoundTimeRemaining: number;
  private scoreboardContainer: Phaser.GameObjects.Container;
  private teamContainers: Phaser.GameObjects.Container[];

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
    this.scoreText = [];
    this.teamData = [];
    this.totalRounds = 0;
    this.currentRound = 0;
    this.roundDurationInMinute = 0;
    this.currentRoundTimeRemaining = 0;

    // Initial rendering of the scoreboard
    this.createPlayerInfoBar();
  }

  createPlayerInfoBar() {
    this.scoreText = this.scene.add
      .text(300, 300, "PlayerInfoBar:", { fontSize: "30px" })
      .setScrollFactor(0);
    this.scoreText.setDepth(100);
  }

  public getCurrentPlayerInfoText(team) {
    if (!team) return;

    let teamPlayersNames = [];
    var currentPlayer = null;

    for (let playerId in team.teamPlayers) {
      //iterating through eveyr player to find sessionId that matches current player
      if (team.teamPlayers.hasOwnProperty(playerId)) {
        let player = team.teamPlayers[playerId];

        teamPlayersNames.push(player.username);
        if (playerId === this.scene.room.sessionId) {
          currentPlayer = player;
          // scene.teamColorHolder.color = teamColor;
        }
      }
    }

    if (!currentPlayer) return;

    let currentPlayerInfo = "";
    // currentPlayerInfo += `currentPlayer: ${currentPlayer.username}\n`;
    // currentPlayerInfo += `Round Score: ${currentPlayer.roundScore}\n`;
    // currentPlayerInfo += `Questions Solved This Round: ${currentPlayer.roundQuestionIdsSolved}\n`; // Assuming this is an array
    // currentPlayerInfo += `Total Score: ${currentPlayer.totalScore}\n`;
    // currentPlayerInfo += `Total Questions Solved: ${currentPlayer.totalQuestionIdsSolved}\n`; // Assuming this is an array
    // currentPlayerInfo += `Health: ${currentPlayer.health}/100\n`; // Assuming this is an array
    return currentPlayerInfo;
  }

  public updatePlayerInfoBar(message) {
    //update team info
    //update current player info
    // message.teams is a map of teamColor to TeamData, i want to convert it into an array
    //
    const teamList = [];
    for (let teamColor in message.teams) {
      if (message.teams.hasOwnProperty(teamColor)) {
        teamList.push(message.teams[teamColor]);
      }
    }

    let allInfo = "";
    let currentPlayer = null;
    let currentPlayerInfo = "";
    console.log("TeamList", teamList);

    teamList.map((team, index) => {
      console.log("Team", index);
      if (team && typeof team === "object") {
        let teamColor = team.teamColor;
        let teamPlayersNames = [];

        currentPlayerInfo = this.getCurrentPlayerInfoText(team);

        let teamPlayers = teamPlayersNames.join(", ");
        let teamInfo = `\nTeam ${teamColor}: ${teamPlayers}`;

        // Add additional details
        teamInfo += `\nMatchScore: ${team.teamMatchScore}`;
        //   teamInfo += `\nRound number: ${this.room.state.currentRound}`;
        teamInfo += `\nTeamRoundScore: ${team.teamRoundScore}\n`;

        allInfo += teamInfo;
      } else {
        console.error("Unexpected team structure", team);
        return "";
      }
    });
    allInfo += currentPlayerInfo;
    this.scoreText.setText(allInfo);
    //   this.scoreText = allInfo;
  }
}
export default PlayerInfoBar;
