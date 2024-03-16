// @ts-nocheck
import Phaser from "phaser";
import Scoreboard from "~/components/Scoreboard";

// listener to take note of all changes to team stats
const SetUpTeamListeners = (
  scene: Phaser.Scene,
  teamUIText: Phaser.GameObjects.Text,
  scoreboard: Scoreboard
) => {
  return scene.room.onMessage("team_update", (message) => {
    console.log("Team update received", message);
    scoreboard.updateScoreboard(message.teams);

    let allInfo = "";
    let currentPlayer = null;
    let currentPlayerInfo = "";

    teamList.map((team, index) => {
      console.log("Team", index);
      if (team && typeof team === "object") {
        let teamColor = team.teamColor;
        let teamPlayersNames = [];

        for (let playerId in team.teamPlayers) {
          if (team.teamPlayers.hasOwnProperty(playerId)) {
            let player = team.teamPlayers[playerId];

            teamPlayersNames.push(player.username);
            if (playerId === scene.room.sessionId) {
              currentPlayer = player;
              // scene.teamColorHolder.color = teamColor;
            }
          }
        }

        let teamPlayers = teamPlayersNames.join(", ");
        let teamInfo = `\nTeam ${teamColor}: ${teamPlayers}`;

        // Add additional details
        teamInfo += `\nMatchScore: ${team.teamMatchScore}`;
        teamInfo += `\nRound number: ${scene.room.state.currentRound}`;
        teamInfo += `\nTeamRoundScore: ${team.teamRoundScore}\n`;

        if (currentPlayer && currentPlayerInfo == "") {
          currentPlayerInfo += `\nPlayer:`;
          // currentPlayerInfo += `\nRound Score: ${currentPlayer.roundScore}`;
          // currentPlayerInfo += `\nQuestions Solved This Round: ${currentPlayer.roundQuestionIdsSolved}`; // Assuming this is an array
          // currentPlayerInfo += `\nTotal Score: ${currentPlayer.totalScore}`;
          // currentPlayerInfo += `\nTotal Questions Solved: ${currentPlayer.totalQuestionIdsSolved}\n`; // Assuming this is an array
          currentPlayerInfo += `\nHealth: ${currentPlayer.health}/100`; // Assuming this is an array
        }

        allInfo += teamInfo;
      } else {
        console.error("Unexpected team structure", team);
        return "";
      }
    });
    allInfo += currentPlayerInfo;

    teamUIText.setText(allInfo); // Added extra newline for separation between teams
  });
};

export { SetUpTeamListeners };
