import { Client, Room } from "@colyseus/core";
import { BattleTeam, TeamColor } from "./schema/Group";
import { ArraySchema, MapSchema } from "@colyseus/schema";
import {
  setUpChatListener,
  setUpRoomUserListener,
  setUpVoiceListener,
  setUpPlayerMovementListener,
  setUpPlayerStateInterval,
} from "./utils/CommsSetup";
import { GameState, BattleRoomState } from "./schema/BattleRoomState";
import {
  InBattlePlayer,
  MCQ,
  Monster,
  MonsterMCQ,
  Player,
  Question,
} from "./schema/Character";
import { loadMCQ } from "./utils/LoadQuestions";

export class BattleRoom extends Room<BattleRoomState> {
  maxClients = 4; // always be even
  TOTAL_ROUNDS = 3;
  PLAYER_MAX_HEALTH = 100;
  NUM_MONSTERS = 8;
  MINUTE_TO_MILLISECONDS = 60 * 1000;
  roundTimer: NodeJS.Timeout | null = null;
  roundCount = 1;
  roundStartTime: number | null = null;

  team_A_start_x_pos = 128;
  team_A_start_y_pos = 128;

  team_B_start_x_pos = 914;
  team_B_start_y_pos = 1176;
  private allQuestions: MCQ[];

  onCreate(options: any) {
    this.setState(new BattleRoomState());
    this.state.teams = new MapSchema<BattleTeam>();
    // need to initialise team color and id too cannot hard code it
    this.state.teams.set(TeamColor.Red, new BattleTeam(TeamColor.Red, 0));
    this.state.teams.set(TeamColor.Blue, new BattleTeam(TeamColor.Blue, 1));
    this.state.totalRounds = this.TOTAL_ROUNDS;
    this.state.currentRound = 0;
    this.state.roundDurationInMinute = 1;
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
    this.onMessage("answerQuestion", (client, { id, answer }) => {
      let playerTeam: BattleTeam | undefined = undefined;
      // find playerTeam and player

      const player = this.state.players.get(client.sessionId) as InBattlePlayer;
      playerTeam = this.state.teams.get(player.teamColor);

      if (player && playerTeam) {
        if (this.allQuestions[id].answer === answer) {
          this.answerCorrectForQuestion(player, playerTeam);
        } else {
          this.answerWrongForQuestion(player, playerTeam);
        }
      }

      // convert map into array

      this.broadcast("teamUpdate", { teams: this.state.teams });
    });
  }

  answerWrongForQuestion(player: InBattlePlayer, playerTeam: BattleTeam) {
    // assume question score is 10 and question id is 1
    const healthDamage = 10;
    player.health = Math.max(0, player.health - healthDamage);
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

    //damage monster
    this.damageMonster(questionId.toString());
  }

  damageMonster(questionId: string) {
    let damageAmount = 10;
    let monster = this.state.monsters.get(questionId);
    if (monster != undefined && monster.health != undefined) {
      monster.health = Math.min(0, monster.health - damageAmount);
    }
  }

  resetPlayersHealth() {
    if (!this.state.teams) return;

    this.state.players.forEach((player) => {
      (player as InBattlePlayer).health = this.PLAYER_MAX_HEALTH;
    });
  }

  async startRound() {
    this.state.currentRound++;
    this.state.roundStartTime = Date.now();
    console.log(this.state.roundStartTime);
    this.state.currentRoundTimeRemaining =
      this.state.roundDurationInMinute * this.MINUTE_TO_MILLISECONDS;

    // Send a message to all clients that a new round has started
    this.broadcast("roundStart", { round: this.state.currentRound });
    this.resetPlayersHealth();
    this.resetPlayersPositions();
    await this.broadcastSpawnMonsters();
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

  resetPlayersPositions() {
    if (!this.state.teams) return;
    console.log("resetting positions on server");
    for (let team of this.state.teams.values()) {
      for (let sessionID of team.teamPlayers) {
        if (sessionID != undefined) {
          // different starting position got players from different teams
          let player: InBattlePlayer | undefined = this.state.players.get(
            sessionID,
          ) as InBattlePlayer;

          if (player != undefined) {
            console.log("player not undefined,. resetting positions on server");
            if (player.teamColor == TeamColor.Red) {
              player.x = this.team_A_start_x_pos;
              player.y = this.team_A_start_y_pos;
            } else {
              player.x = this.team_B_start_x_pos;
              player.y = this.team_B_start_y_pos;
            }

            // Find the client associated with the session ID
            const client = this.clients.find(
              (client) => client.sessionId === player?.sessionId,
            );

            // Send the new position to the client
            if (client) {
              this.send(client, "resetPosition", { x: player.x, y: player.y });
            }
          }
        }
      }
    }
  }

  private async broadcastSpawnMonsters() {
    this.allQuestions = await loadMCQ();

    //put monster into map, create new monster given the number
    for (let i = 0; i < this.NUM_MONSTERS; i++) {
      let monster = new Monster();
      monster.x = Math.floor(Math.random() * 800);
      monster.y = Math.floor(Math.random() * 600);
      monster.health = 100;
      monster.id = i;
      let allOptions = new ArraySchema();
      this.allQuestions[i].options.forEach((answer) => {
        allOptions.push(answer);
      });
      let monsterQns = new MonsterMCQ(
        this.allQuestions[i].question,
        allOptions,
      );
      monster.questions.push(monsterQns);
      this.state.monsters.set(i.toString(), monster);
      //questionId to monster
    }
    // console.log([...this.state.monsters.values()]);
    console.log(this.state.monsters.get("0")?.questions[0].question);

    const monstersArray = [...this.state.monsters.entries()].map(
      ([key, monster]) => ({
        id: key, // Assuming you want to keep the map's key as an identifier
        monster: monster, // You might need to further serialize the monster if it's a complex object
      }),
    );
    this.broadcast("spawnMonsters", {
      monsters: monstersArray,
    });
  }

  incrementMatchScoreForWinningTeam() {
    let maxScore = 0;
    let maxScoreTeamIndices: string[] = [];

    if (!this.state.teams) return;

    this.state.teams.forEach((team, index) => {
      if (team.teamRoundScore > maxScore) {
        maxScore = team.teamRoundScore;
        maxScoreTeamIndices = [index]; // start a new list of max score teams
      } else if (team.teamRoundScore === maxScore) {
        maxScoreTeamIndices.push(index); // add to the list of max score teams
      }
    });

    // If there's a draw, all teams with the max score get a point
    maxScoreTeamIndices.forEach((key) => {
      this.state.teams.get(key).teamMatchScore += 1;
    });
  }

  resetRoundStats() {
    if (!this.state.teams) return;

    this.state.teams.forEach((team) => {
      team.teamRoundScore = 0;
      team.teamPlayers.forEach((sessionId) => {
        const player = this.state.players.get(sessionId) as InBattlePlayer;
        player.roundQuestionIdsSolved = new ArraySchema<number>();
        player.roundScore = 0;
        player.health = this.PLAYER_MAX_HEALTH;
      });
    });
  }
  // reset round and increment match score
  endRound() {
    // Send a message to all clients that round ended, handle position reset, and timer reset
    this.incrementMatchScoreForWinningTeam();
    this.resetRoundStats();

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

  getTeamColor(num: number): TeamColor {
    if (num === 0) {
      return TeamColor.Red;
    } else {
      return TeamColor.Blue;
    }
  }

  onJoin(client: Client, options: any) {
    console.log(client.sessionId, "joined battle room!");

    const mapWidth = 800;
    const mapHeight = 600;

    // create Player instance
    const player = new InBattlePlayer(
      300,
      300,
      options.username,
      client.sessionId,
    );

    // Randomise player team, should be TeamColor.Red or TeamColor.Blue
    // Total have 6 players, so 3 red and 3 blue
    let teamIndex = Math.floor(Math.random() * 2); // Randomly select 0 or 1
    // if 0 is RED 1 is BLUE

    if (!this.state.teams) return;

    let selectedTeam = this.state.teams.get(this.getTeamColor(teamIndex));

    // If the selected team is full, assign the player to the other team
    if (selectedTeam.teamPlayers.length >= Math.floor(this.maxClients / 2)) {
      teamIndex = 1 - teamIndex; // Switch to the other team
      let color = this.getTeamColor(teamIndex);
      selectedTeam = this.state.teams.get(color);
    }

    player.teamColor = selectedTeam.teamColor;

    // Place player in the map of players by its sessionId
    // (client.sessionId is unique per connection!)
    this.state.teams.get(player.teamColor).teamPlayers.push(client.sessionId);
    this.state.players.set(client.sessionId, player);
    // get all players in the room

    // make an array of all the players username

    this.resetPlayersPositions();
    this.broadcastSpawnMonsters();
    // done think broadcasting is here is useful since the listener is not yet set up on client side
    this.broadcast("teamUpdate", { teams: this.state.teams });
  }

  onLeave(client: Client, consented: boolean) {
    console.log(client.sessionId, "left!");

    // for teams in this.state.teams, if the team has the client.sessionId, delete it from the team
    this.state.teams.forEach((team) => {
      team.teamPlayers = team.teamPlayers.filter(
        (sessionId) => sessionId !== client.sessionId,
      );
    });
    this.state.players.delete(client.sessionId);
  }

  onDispose() {
    console.log("room", this.roomId, "disposing...");

    if (this.roundTimer) {
      clearInterval(this.roundTimer);
      this.roundTimer = null;
    }
  }
}
