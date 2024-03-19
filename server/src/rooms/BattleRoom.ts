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

import { setUpMonsterQuestionListener } from "./utils/MonsterQuestion";
import { MonsterEnum } from "../../types/CharacterTypes";

import {
  InBattlePlayer,
  MCQ,
  Monster,
  MonsterMCQ,
  Player,
  Question,
  TeamSpecificMonsterInfo,
} from "./schema/Character";
import { loadMCQ } from "./utils/LoadQuestions";
import {
  BattleRoomCurrentState,
  BattleRoomState,
} from "./schema/BattleRoomState";

export class BattleRoom extends Room<BattleRoomState> {
  maxClients = 4; // always be even
  // TOTAL_ROUNDS = 3;
  TOTAL_ROUNDS = 1;
  // WAITING_TIME_BEFORE_ROUND_START = 2000;
  WAITING_TIME_BEFORE_ROUND_START = 100;
  // TOTAL_TIME_PER_ROUND_IN_MIN = 10;
  TOTAL_TIME_PER_ROUND_IN_MIN = 0.2
  PLAYER_MAX_HEALTH = 100;
  NUM_MONSTERS = 8;
  MINUTE_TO_MILLISECONDS = 60 * 1000;
  roundTimer: NodeJS.Timeout | null = null;
  roundCount = 1;
  roundStartTime: number | null = null;
  clientTimerUpdates: NodeJS.Timeout | null = null;


  monstersArray: { id: string; monster: Monster }[] | null;
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
    this.state.roundDurationInMinute = this.TOTAL_TIME_PER_ROUND_IN_MIN;
    // this.state.roundDurationInMinute = 0.01;
    this.state.currentGameState = BattleRoomCurrentState.Waiting;
    // need to initialise monsters too

    setUpChatListener(this);
    setUpVoiceListener(this);
    setUpRoomUserListener(this);
    setUpPlayerMovementListener(this);
    setUpPlayerStateInterval(this);
    setUpMonsterQuestionListener(this);
    this.setUpGameListeners();
    this.startRound();
    this.createMonsterQuestions();
  }

  setUpGameListeners() {
    this.onMessage(
      "answerQuestion",
      (client, { monsterID, questionID, answer, optionIndex }) => {
        let playerTeam: BattleTeam | undefined = undefined;
        // find playerTeam and player
        // to do: should find all players on the same team solving the same question
        const player = this.state.players.get(
          client.sessionId,
        ) as InBattlePlayer;
        const teamColor = player.teamColor;
        console.log("monsterID is ", monsterID);
        let monster = this.state.monsters.get(monsterID.toString());

        playerTeam = this.state.teams.get(player.teamColor);
        let actualQuestion = monster.questions[questionID];
        let monsterKilled = false;
        if (player && playerTeam) {
          if (actualQuestion.answer === answer) {
            // should be all players solving this qns?
            console.log(
              "number of people with monster is " +
              monster.teams.get(teamColor).playerIDsAttacking.length,
            );
            for (let playerID of monster.teams.get(teamColor)
              .playerIDsAttacking) {
              const client = this.clients.find(
                (client) => client.sessionId === playerID,
              );
              console.log("updating question correct for player");
              let currPlayer = this.state.players.get(
                playerID,
              ) as InBattlePlayer;
              currPlayer.currentQuestionIdsSolved.push(questionID);
              console.log("sending answerCorrect" + questionID.toString());
              client.send(
                "answerCorrect" + questionID.toString() + "monster" + monsterID,
                {
                  questionID: questionID,
                  optionIndex: optionIndex,
                },
              );
              console.log(
                "solved questions: " +
                currPlayer.currentQuestionIdsSolved.length +
                " for " +
                playerID,
              );
              if (
                currPlayer.currentQuestionIdsSolved.length ===
                monster.questions.length
              ) {
                monsterKilled = true;
                console.log("all questions solved");
                console.log("updating player round score");
                this.answerCorrectForQuestion(currPlayer, playerTeam);
                currPlayer.currentQuestionIdsSolved = new ArraySchema<number>();
              }
            }
            if (monsterKilled) {
              console.log("broadcasting to all players that monster is dead");
              // to those who are doing the question to closepopup
              this.broadcast("monsterCompleted" + monsterID.toString(), {
                monsterID: monsterID,
              });

              // to the rest who are not doing the question to see monster dying
              this.broadcast("monsterKilled" + monsterID.toString(), {
                monsterID: monsterID,
              });
            }
          } else {
            this.answerWrongForQuestion(player, playerTeam);
            client.send("answerWrong" + questionID.toString(), {});
          }
        }

        // convert map into array

        this.broadcast("teamUpdate", { teams: this.state.teams });
      },
    );
  }

  answerWrongForQuestion(player: InBattlePlayer, playerTeam: BattleTeam) {
    // assume question score is 10
    const healthDamage = 10;
    console.log("answer wrong");
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
    // if (monster != undefined && monster.health != undefined) {
    //   monster.health = Math.min(0, monster.health - damageAmount);
    // }
  }

  resetPlayersHealth() {
    if (!this.state.teams) return;

    this.state.players.forEach((player) => {
      (player as InBattlePlayer).health = this.PLAYER_MAX_HEALTH;
    });
  }

  async startRound() {
    this.state.currentRound++;

    // Send a message to all clients that a new round has started
    this.broadcast("roundStart", { round: this.state.currentRound });
    this.resetPlayersHealth();
    this.resetPlayersPositions();
    await this.broadcastSpawnMonsters();
    this.broadcast("teamUpdate", { teams: this.state.teams });

    // Wait for a few seconds before starting the round
    setTimeout(() => {
      this.state.roundStartTime = Date.now();
      this.state.currentRoundTimeRemaining =
        this.state.roundDurationInMinute * this.MINUTE_TO_MILLISECONDS;

      // Start the round timer
      this.roundTimer = setInterval(() => {
        this.endRound();
      }, this.state.roundDurationInMinute * this.MINUTE_TO_MILLISECONDS);

      // Send timer updates to the clients every second
      this.clientTimerUpdates = setInterval(() => {
        if (this.state.roundStartTime) {
          const timeElapsed = Date.now() - this.state.roundStartTime;
          this.state.currentRoundTimeRemaining =
            this.state.roundDurationInMinute * this.MINUTE_TO_MILLISECONDS -
            timeElapsed;
          // this.broadcast("timerUpdate", { timeRemaining });
        }
      }, 1000);
    }, this.WAITING_TIME_BEFORE_ROUND_START);
  }

  resetPlayersPositions() {
    if (!this.state.teams) return;
    // console.log("resetting positions on server");
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

  private async createMonsterQuestions() {
    this.allQuestions = await loadMCQ();
    // Spawn the specified number of monsters
    // theres a chance that different monster will have the same questions but lets ignore that for now
    for (let i = 0; i < this.NUM_MONSTERS; i++) {
      let monster = new Monster(MonsterEnum.Golem1);
      monster.x = Math.floor(Math.random() * 800);
      monster.y = Math.floor(Math.random() * 600);
      monster.id = i;

      // Select two distinct random questions for the monster
      let questionIndices = this.getRandomDistinctIndices(
        2,
        this.allQuestions.length,
      );
      let question1 = this.allQuestions[questionIndices[0]];
      let question2 = this.allQuestions[questionIndices[1]];

      // Convert question options to ArraySchema
      let question1Options = this.convertOptionsToArraySchema(
        question1.options,
      );
      let question2Options = this.convertOptionsToArraySchema(
        question2.options,
      );

      // Add questions to the monster
      monster.questions.push(
        new MonsterMCQ(question1.question, question1Options, question1.answer),
      );
      monster.questions.push(
        new MonsterMCQ(question2.question, question2Options, question2.answer),
      );

      // Set up monster-specific settings
      monster.setUpClientMonsterListener(this);
      monster.teams.set(TeamColor.Red, new TeamSpecificMonsterInfo());
      monster.teams.set(TeamColor.Blue, new TeamSpecificMonsterInfo());

      // Add the monster to the state
      this.state.monsters.set(i.toString(), monster);
    }

    this.monstersArray = Array.from(this.state.monsters, ([key, monster]) => ({
      id: key,
      monster,
    }));
  }

  private async broadcastSpawnMonsters() {
    // Broadcast the spawnMonsters event
    this.broadcast("spawnMonsters", { monsters: this.monstersArray });
  }

  // Helper function to convert options to ArraySchema
  private convertOptionsToArraySchema(options: any[]): ArraySchema {
    let arraySchema = new ArraySchema();
    options.forEach((option) => arraySchema.push(option));
    return arraySchema;
  }

  // Helper function to get n distinct random indices from 0 to max
  private getRandomDistinctIndices(n: number, max: number): number[] {
    let indices = new Set<number>();
    while (indices.size < n) {
      indices.add(Math.floor(Math.random() * max));
    }
    return Array.from(indices);
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

    // Clear the round timer
    if (this.clientTimerUpdates) {
      clearInterval(this.clientTimerUpdates);
      this.clientTimerUpdates = null;
    }

    // If less than x rounds have been played, start a new round
    if (this.state.currentRound < this.state.totalRounds) {
      this.startRound();
    } else {
      this.endBattle();
    }
  }

  adjustPlayerEXP() {
    if (!this.state.teams) return;

    // winning team add 10 EXP to each player
    let maxScore = 0;
    let maxScoreTeamIndices: string[] = [];

    if (!this.state.teams) return;

    this.state.teams.forEach((team, index) => {
      if (team.teamMatchScore > maxScore) {
        maxScore = team.teamMatchScore;
        maxScoreTeamIndices = [index]; // start a new list of max score teams
      } else if (team.teamMatchScore === maxScore) {
        maxScoreTeamIndices.push(index); // add to the list of max score teams
      }
    });

    // If there's a draw, all teams with the max score get a point
    maxScoreTeamIndices.forEach((key) => {
      // each plater in team add 10 exp
      this.state.teams.get(key).teamPlayers.forEach((sessionId) => {
        const player = this.state.players.get(sessionId) as InBattlePlayer;
        player.playerEXP += 10;
        console.log("adjust player EXP ", player);
      });
    });
  }

  endBattle() {
    // Send a message to all clients that the battle has ended
    this.adjustPlayerEXP();
    // broadcast to all clients their playerEXP
    this.clients.forEach((client) => {
      const playerEXP = this.state.players.get(client.sessionId)?.playerEXP;
      console.log("sending battle end to client with playerEXP: ", playerEXP
        , " with clientId ", client.sessionId);
      this.send(client, "battleEnd", { playerEXP: playerEXP, roomState: this.state });
    });

    // Lock the room to prevent new clients from joining
    this.lock();
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
      options.charName,
      client.sessionId,
      options.playerEXP,
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

    client.send("spawnMonsters", { monsters: this.monstersArray });
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
