import { Room, Client } from "@colyseus/core";
import { BattleTeam, TeamColor } from "./schema/Group";
import { ArraySchema } from "@colyseus/schema";
import {
  setUpChatListener,
  setUpRoomUserListener,
  setUpVoiceListener,
  setUpPlayerMovementListener,
  setUpPlayerStateInterval,
} from "./utils/CommsSetup";
import { GameState, BattleRoomState } from "./schema/BattleRoomState";
import { InBattlePlayer } from "./schema/Character";

export class BattleRoom extends Room<BattleRoomState> {
  maxClients = 4; // always be even 
  TOTAL_ROUNDS = 3;

  MINUTE_TO_MILLISECONDS = 60 * 1000;
  roundTimer: NodeJS.Timeout | null = null;
  roundCount = 1;
  roundStartTime: number | null = null;
  start_x_pos = 128;
  start_y_pos = 128;

  onCreate(options: any) {
    this.setState(new BattleRoomState());
    this.state.teams = new ArraySchema<BattleTeam>();
    // need to initialise team color and id too cannot hard code it
    this.state.teams.setAt(0, new BattleTeam(TeamColor.Red));
    this.state.teams.setAt(1, new BattleTeam(TeamColor.Blue));
    this.state.totalRounds = this.TOTAL_ROUNDS;
    this.state.currentRound = 0;
    this.state.roundDurationInMinute = 0.2;
    this.state.currentGameState = GameState.Waiting;
    // need to initialise monsters too

    setUpChatListener(this);
    setUpVoiceListener(this);
    setUpRoomUserListener(this);
    setUpPlayerMovementListener(this);
    setUpPlayerStateInterval(this);
    this.setUpGameListeners();
    this.startRound();
  }

  setUpGameListeners() {
    this.onMessage("verify_answer", (client, message) => {

      let player: InBattlePlayer = null;
      let playerTeam: BattleTeam = null;
      // find playerTeam and player
      this.state.teams.forEach((team) => {
        if (team.teamPlayers.has(client.sessionId)) {
          player = team.teamPlayers.get(client.sessionId);
          playerTeam = team;
        }
      })

      if (player && playerTeam) {
        if (message.answer == "correct") {
          this.answerCorrectForQuestion(player, playerTeam);
        } else {
          this.answerWrongForQuestion(player, playerTeam);
        }
      } else {
        console.log("player not found");
      } this.broadcast("teamUpdate", { teams: this.state.teams });
    });
  };

  answerWrongForQuestion(player: InBattlePlayer, playerTeam: BattleTeam) {
    // assume question score is 10 and question id is 1
    const healthDamage = 10;
    player.health -= healthDamage;
  }


  // might need to take in question ID
  answerCorrectForQuestion(player: InBattlePlayer, playerTeam: BattleTeam) {
    // assume question score is 10 and question id is 1
    const questionScore = 10;
    const questionId = 1;
    player.roundScore += questionScore;
    player.totalScore += questionScore;
    player.roundQuestionIdsSolved.push(questionId);
    player.totalQuestionIdsSolved.push(questionId);
    playerTeam.teamRoundScore += questionScore;
  }


  startRound() {
    this.state.currentRound++;
    this.state.roundStartTime = Date.now();
    console.log(this.state.roundStartTime);
    this.state.currentRoundTimeRemaining =
      this.state.roundDurationInMinute * this.MINUTE_TO_MILLISECONDS;

    // Send a message to all clients that a new round has started
    this.broadcast("roundStart", { round: this.state.currentRound });
    this.broadcast("teamUpdate", { teams: this.state.teams });

    // Start the round timer
    this.roundTimer = setInterval(() => {
      this.endRound();
    }, this.state.roundDurationInMinute * this.MINUTE_TO_MILLISECONDS);

    // Send timer updates to the clients every second
    setInterval(() => {
      if (this.state.roundStartTime) {
        const timeElapsed = Date.now() - this.state.roundStartTime;
        this.state.currentRoundTimeRemaining =
          this.state.roundDurationInMinute * this.MINUTE_TO_MILLISECONDS -
          timeElapsed;
        // this.broadcast("timerUpdate", { timeRemaining });
      }
    }, 1000);
  }

  // reset round and increment match score
  endRound() {
    // Send a message to all clients that round ended, handle position reset, and timer reset
    this.broadcast("roundEnd", { round: this.roundCount });
    //move the positions of all clietns to the start position?    
    for (let [playerId, player] of this.state.players.entries()) {
      if (player != undefined) {
        player.x = 128;
        player.y = 128;
        console.log("player reset");
      }
    }

    // team with highest roundScore, matchscore += 1
    // assuming more than two teams 
    // if draw, both teams add one point to match score
    let maxScore = 0;
    let maxScoreTeamIndices: (number)[] = [];
    this.state.teams.forEach((team, index) => {
      if (team.teamRoundScore > maxScore) {
        maxScore = team.teamRoundScore;
        maxScoreTeamIndices = [index]; // start a new list of max score teams
      } else if (team.teamRoundScore === maxScore) {
        maxScoreTeamIndices.push(index); // add to the list of max score teams
      }
    });

    // If there's a draw, all teams with the max score get a point
    if (maxScoreTeamIndices.length > 0) {
      maxScoreTeamIndices.forEach(index => {
        this.state.teams[index].teamMatchScore += 1;
      });
    } else {
      // If there are no teams with a max score, increment the match score for all teams
      this.state.teams.forEach(team => {
        team.teamMatchScore += 1;
      });
    }

    this.state.teams.forEach((team) => {
      team.teamRoundScore = 0;
      team.teamPlayers.forEach((player) => {
        player.roundQuestionIdsSolved = new ArraySchema<number>();
        player.roundScore = 0;
        player.health = 100;
      })
    })


    // Clear the round timer
    if (this.roundTimer) {
      clearInterval(this.roundTimer);
      this.roundTimer = null;
    }

    // If less than 5 rounds have been played, start a new round
    if (this.state.currentRound < this.state.totalRounds) {
      this.startRound();
    } else {
      this.endBattle();
    }
  }

  endBattle() {
    // Send a message to all clients that the battle has ended
    this.broadcast("battleEnd");
    this.state.roundStartTime = Date.now();
  }

  onJoin(client: Client, options: any) {
    console.log(client.sessionId, "joined battle room!");

    const mapWidth = 800;
    const mapHeight = 600;

    // create Player instance
    const player = new InBattlePlayer();

    player.x = this.start_x_pos;
    player.y = this.start_y_pos;
    // Randomise player team, should be TeamColor.Red or TeamColor.Blue
    // Total have 6 players, so 3 red and 3 blue
    let teamIndex = Math.floor(Math.random() * 2); // Randomly select 0 or 1
    let selectedTeam = this.state.teams[teamIndex];

    // If the selected team is full, assign the player to the other team
    if (selectedTeam.teamPlayers.size >= Math.floor(this.maxClients / 2)) {
      teamIndex = 1 - teamIndex; // Switch to the other team
      selectedTeam = this.state.teams[teamIndex];
    }

    player.teamColor = selectedTeam.teamColor;

    // Place player in the map of players by its sessionId
    // (client.sessionId is unique per connection!)
    this.state.teams[teamIndex].teamPlayers.set(client.sessionId, player);
    this.state.players.set(client.sessionId, player);
    this.broadcast("teamUpdate", { teams: this.state.teams });

  }

  onLeave(client: Client, consented: boolean) {
    console.log(client.sessionId, "left!");

    // for teams in this.state.teams, if the team has the client.sessionId, delete it from the team
    this.state.teams.forEach((team) => {
      if (team.teamPlayers.has(client.sessionId)) {
        team.teamPlayers.delete(client.sessionId);
      }
    })
  }

  onDispose() {
    console.log("room", this.roomId, "disposing...");

    if (this.roundTimer) {
      clearInterval(this.roundTimer);
      this.roundTimer = null;
    }
  }
}
