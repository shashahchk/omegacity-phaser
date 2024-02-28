import { Room, Client } from "@colyseus/core";
import { MyRoomState, Player } from "./schema/MyRoomState";
import {
  setUpChatListener,
  setUpRoomUserListener,
  setUpVoiceListener,
  setUpPlayerMovementListener
} from "./utils/CommsSetup";

export class BattleRoom extends Room<MyRoomState> {
  maxClients = 4;
  roundDurationMinutes = 0.5;
  MINUTE_TO_MILLISECONDS = 60 * 1000;
  roundTimer: NodeJS.Timeout | null = null;
  roundCount = 1;
  totalRoundNum = 5;
  roundStartTime: number | null = null;
  start_x_pos = 128;
  start_y_pos = 128;

  onCreate(options: any) {
    this.setState(new MyRoomState());

    setUpChatListener(this);
    setUpVoiceListener(this);
    setUpRoomUserListener(this);
    setUpPlayerMovementListener(this);

    this.startRound()
  }

  startRound() {
    this.roundCount++;
    this.roundStartTime = Date.now();

    // Send a message to all clients that a new round has started
    this.broadcast("roundStart", { round: this.roundCount });

    // Start the round timer
    this.roundTimer = setInterval(() => {
      this.endRound();
    }, this.roundDurationMinutes * this.MINUTE_TO_MILLISECONDS);

    // Send timer updates to the clients every second
    setInterval(() => {
      if (this.roundStartTime) {
        const timeElapsed = Date.now() - this.roundStartTime;
        const timeRemaining = this.roundDurationMinutes * this.MINUTE_TO_MILLISECONDS - timeElapsed;

        this.broadcast("timerUpdate", { timeRemaining });
      }
    }, 1000);
  }

  endRound() {
    // Send a message to all clients that round ended, handle position reset, and timer reset
    this.broadcast("roundEnd", { round: this.roundCount });
    //move the positions of all clietns to the start position?
    console.log(this.state.players.size);
    for (let [playerId, player] of this.state.players.entries()) {
      if (player != undefined) {
        player.x = 128;
        player.y = 128;
        console.log("player reset");
      }
    }


    // Clear the round timer
    if (this.roundTimer) {
      clearInterval(this.roundTimer);
      this.roundTimer = null;
    }

    // If less than 5 rounds have been played, start a new round
    if (this.roundCount < this.totalRoundNum) {
      this.startRound();
    } else {
      this.endBattle();
    }
  }

  endBattle() {
    // Send a message to all clients that the battle has ended
    this.broadcast("battleEnd");
    this.roundStartTime = Date.now();
  }

  onJoin(client: Client, options: any) {
    console.log(client.sessionId, "joined battle room!");

    const mapWidth = 800;
    const mapHeight = 600;

    // create Player instance
    const player = new Player();
    player.x = this.start_x_pos;
    player.y = this.start_y_pos;

    // place player in the map of players by its sessionId
    // (client.sessionId is unique per connection!)
    this.state.players.set(client.sessionId, player);
  }

  onLeave(client: Client, consented: boolean) {
    console.log(client.sessionId, "left!");

    this.state.players.delete(client.sessionId);
  }

  onDispose() {
    console.log("room", this.roomId, "disposing...");

    // Clear the round timer when the room is disposed
    if (this.roundTimer) {
      clearInterval(this.roundTimer);
      this.roundTimer = null;
    }
  }
}
