import { Room, Client } from "@colyseus/core";
import { BattleTeam } from "./schema/Group";
import { ArraySchema } from "@colyseus/schema";
import {
  setUpChatListener,
  setUpRoomUserListener,
  setUpVoiceListener,
  setUpPlayerMovementListener,
} from "./utils/CommsSetup";
import { BattleRoomState } from "./schema/BattleRoomState";
import { InBattlePlayer } from "./schema/Character";

export class BattleRoom extends Room<BattleRoomState> {
  maxClients = 4;
  TOTAL_ROUNDS = 3;

  onCreate(options: any) {
    this.setState(new BattleRoomState());
    this.state.teams = new ArraySchema<BattleTeam>();
    // need to initialise team color and id too cannot hard code it
    this.state.teams.setAt(0, new BattleTeam());
    this.state.teams.setAt(1, new BattleTeam());
    this.state.totalRounds = this.TOTAL_ROUNDS;
    this.state.currentRound = 1;
    this.state.roundTimeLeft = 60;
    this.state.currentGameState = "waiting";
    // need to initialise monsters too

    setUpChatListener(this);
    setUpVoiceListener(this);
    setUpRoomUserListener(this);
    setUpPlayerMovementListener(this);
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

    this.state.teams[0].teamPlayers.delete(client.sessionId);
  }

  onDispose() {
    console.log("room", this.roomId, "disposing...");
  }
}
