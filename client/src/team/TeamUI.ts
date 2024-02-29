import Phaser from "phaser";

// listener to take note of all changes to team stats 
const SetUpTeamListeners = (scene: Phaser.Scene, teamUIText: Phaser.GameObjects.Text) => {
    scene.room.onMessage("teamUpdate", (message) => {
        const teamList = message.teams;
        console.log("Team update", teamList);

        let allInfo = ""
        let specificPlayer = null;
        let specificPlayerInfo = "";

        teamList.map((team, index) => {
            if (team && typeof team === 'object') {
                let teamColor = team.teamColor;
                let teamPlayersNames = [];

                for (let playerId in team.teamPlayers) {
                    if (team.teamPlayers.hasOwnProperty(playerId)) {
                        let player = team.teamPlayers[playerId];
                        teamPlayersNames.push(playerId);
                        if (playerId === scene.room.sessionId) {
                            specificPlayer = player;
                        }
                    }
                }

                let teamPlayers = teamPlayersNames.join(', ');
                let teamInfo = `\nTeam ${teamColor}: ${teamPlayers}`;

                // Add additional details
                teamInfo += `\nMatchScore: ${team.teamMatchScore}`;
                teamInfo += `\nRound number: ${scene.room.state.currentRound}`;
                teamInfo += `\nTeamRoundScore: ${team.teamRoundScore}\n`;

                if (specificPlayer && specificPlayerInfo == "") {
                    specificPlayerInfo += `\nPlayer:`
                    specificPlayerInfo += `\nRound Score: ${specificPlayer.roundScore}`;
                    specificPlayerInfo += `\nQuestions Solved This Round: ${specificPlayer.roundQuestionIdsSolved}`; // Assuming this is an array
                    specificPlayerInfo += `\nTotal Score: ${specificPlayer.totalScore}`;
                    specificPlayerInfo += `\nTotal Questions Solved: ${specificPlayer.totalQuestionIdsSolved}\n`; // Assuming this is an array
                    specificPlayerInfo += `\nHealth: ${specificPlayer.health}/100`; // Assuming this is an array

                }

                allInfo += teamInfo;

            } else {
                console.error("Unexpected team structure", team);
                return '';
            }

        });
        allInfo += specificPlayerInfo;

        teamUIText.setText(allInfo); // Added extra newline for separation between teams
    });
}

export {
    SetUpTeamListeners,
};