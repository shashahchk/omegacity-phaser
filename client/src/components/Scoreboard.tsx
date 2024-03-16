// @ts-nocheck

// ScoreBoard.ts
import Phaser from 'phaser';

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

export class Scoreboard {
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
    this.createScoreboard();
  }

  createScoreboard() {

    this.scoreText = this.scene.add
    .text(300, 300, "Scoreboard:", { fontSize: "30px" })
    .setScrollFactor(0);
  this.scoreText.setDepth(100);
    }

    public getCurrentPlayerInfoText(team) {
        if (!team) return;

        let teamPlayersNames = [];
        var currentPlayer= null;

        for (let playerId in team.teamPlayers) {
            //iterating through eveyr player to find sessionId that matches current player
            if (team.teamPlayers.hasOwnProperty(playerId)) {
              let player = team.teamPlayers[playerId];

              teamPlayersNames.push(player.userName);
              if (playerId === this.scene.room.sessionId) {
                currentPlayer = player;
                // scene.teamColorHolder.color = teamColor;
              }
            }
          }

          if (!currentPlayer) return;

        let currentPlayerInfo = "";
        // currentPlayerInfo += `currentPlayer: ${currentPlayer.userName}\n`;
        // currentPlayerInfo += `Round Score: ${currentPlayer.roundScore}\n`;
        // currentPlayerInfo += `Questions Solved This Round: ${currentPlayer.roundQuestionIdsSolved}\n`; // Assuming this is an array
        // currentPlayerInfo += `Total Score: ${currentPlayer.totalScore}\n`;
        // currentPlayerInfo += `Total Questions Solved: ${currentPlayer.totalQuestionIdsSolved}\n`; // Assuming this is an array
        // currentPlayerInfo += `Health: ${currentPlayer.health}/100\n`; // Assuming this is an array
        return currentPlayerInfo;
    }

  public updateScoreboard(message) {
    //update team info
    //update current player info

    const teamList = message.teams;
      let allInfo = "";
      let currentPlayer = null;
      let currentPlayerInfo = "";

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

    // Inside the ScoreBoard class

    // private createScoreBoard(): void {
    //     this.teamData.forEach((team, teamIndex) => {
    //         team.players.forEach((player, playerIndex) => {
    //             // Container for player's scoreboard entry
    //             const playerContainer = this.scene.add.container(this.x, this.y + 50 + (teamIndex * 100) + (playerIndex * 30));
                
    //             // Ensure it doesn't scroll with the map
    //             playerContainer.setScrollFactor(0);
        
    //             // Set a depth value higher than any map element
    //             playerContainer.setDepth(100);
        
    //             // Background graphics for this entry
    //             const background = this.scene.add.graphics();
    //             background.fillStyle(team.color, 1);
    //             background.fillRect(0, 0, 300, 30);
        
    //             // Adding background to the container
    //             playerContainer.add(background);
        
    //             // Text displaying the player's details
    //             const playerDetails = `${player.name} - Questions: ${player.questionsSolved} - Score: ${player.score}`;
    //             const playerText = this.scene.add.text(5, 5, playerDetails, {
    //             font: '18px Arial',
    //             color: '#fff',
    //             }).setScrollFactor(0);
        
    //             // Adding text to the container
    //             playerContainer.add(playerText);
        
    //             // Add the player container to the scene
    //             this.scene.add.existing(playerContainer);
    //             this.teamContainers[teamIndex].add(playerContainer);
    //         });
    //     });
    // }
    

    // public updatePlayerData(teamIndex: number, playerIndex: number, newPlayerData: PlayerData): void {
    //     const playerContainer = this.teamContainers[teamIndex];
    //     const playerNameText = playerContainer.getAt(playerIndex * 3) as Phaser.GameObjects.Text;
    //     playerNameText.setText(newPlayerData.name);

    //     const questionsSolvedText = playerContainer.getAt(playerIndex * 3 + 1) as Phaser.GameObjects.Text;
    //     questionsSolvedText.setText(`Questions: ${newPlayerData.questionsSolved}`);

    //     const scoreText = playerContainer.getAt(playerIndex * 3 + 2) as Phaser.GameObjects.Text;
    //     scoreText.setText(`Score: ${newPlayerData.score}`);
    // }


    // private clearScoreBoard(): void {
    //     // Loop through each team's containers and destroy them
    //     this.teamContainers.forEach(teamContainer => {
    //         teamContainer.destroy();
    //     });
    
    //     // Reset the teamContainers array for fresh scoreboard creation
    //     this.teamContainers = this.teamData.map(() => this.scene.add.container());
    // }
    

export default Scoreboard;
