import { Room, Client } from "@colyseus/core";
import { BattleTeam } from "./schema/Group";
import { ArraySchema } from "@colyseus/schema";
import {
  setUpChatListener,
  setUpRoomUserListener,
  setUpVoiceListener,
  setUpPlayerMovementListener,
} from "./utils/CommsSetup";
import { GameState, BattleRoomState } from "./schema/BattleRoomState";
import { InBattlePlayer } from "./schema/Character";

export class BattleRoom extends Room<BattleRoomState> {
  maxClients = 4;
  TOTAL_ROUNDS = 3;
  roundTimer: NodeJS.Timeout | null = null;
  MINUTE_TO_MILLISECONDS = 60 * 1000;
  roundStartTime: number;

  onCreate(options: any) {
    this.setState(new BattleRoomState());
    this.state.teams = new ArraySchema<BattleTeam>();
    // need to initialise team color and id too cannot hard code it
    this.state.teams.setAt(0, new BattleTeam());
    this.state.teams.setAt(1, new BattleTeam());
    this.state.totalRounds = this.TOTAL_ROUNDS;
    this.state.currentRound = 0;
    this.state.roundDurationInMinute = 0.2;
    this.state.currentGameState = GameState.Waiting;
    // need to initialise monsters too

    setUpChatListener(this);
    setUpVoiceListener(this);
    setUpRoomUserListener(this);
    setUpPlayerMovementListener(this);
    this.startRound();
  }

  startRound() {
    this.state.currentRound++;
    this.state.roundStartTime = Date.now();
    console.log(this.state.roundStartTime);
    this.state.currentRoundTimeRemaining =
      this.state.roundDurationInMinute * this.MINUTE_TO_MILLISECONDS;

    // Send a message to all clients that a new round has started
    this.broadcast("roundStart", { round: this.state.currentRound });

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

  endRound() {
    // Send a message to all clients that the round has ended
    // i think this should stay being a broadcast instead of a schema change, just seems more intuitive?
    this.broadcast("roundEnd", { round: this.state.currentRound });

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
    // To be change later
    player.teamId = 0;

    // place Player at a random position
    player.x = 128;
    player.y = 128;

    // place player in the map of players by its sessionId
    // (client.sessionId is unique per connection!)
    this.state.teams[player.teamId].teamPlayers.set(client.sessionId, player);
    this.state.players.set(client.sessionId, player);
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
