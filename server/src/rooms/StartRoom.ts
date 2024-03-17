import { Room, Client } from "@colyseus/core";
import { GameRoomState } from "./schema/GameRoomState";
import { Player } from "./schema/Character";

export class StartRoom extends Room<GameRoomState> {
  onCreate(options: any) {
    this.setState(new GameRoomState());
  }

  onJoin(client: Client, options: any) {
    console.log(`${client.sessionId} joined the lobby!`);
    // need to fix something here, do we need to make a new player here?
    const player = new Player(160, 100, options.username, client.sessionId, 0);
    this.state.players.set(client.sessionId, player);
  }

  onLeave(client: Client, consented: boolean) {
    console.log(`${client.sessionId} left the lobby!`);
    this.broadcast("player_leave", { sessionId: client.sessionId });
    this.state.players.delete(client.sessionId);
  }

  onDispose() {
    console.log(`Lobby ${this.roomId} disposing...`);
  }
}
