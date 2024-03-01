import { Room, Client } from "@colyseus/core";
import { MyRoomState } from "./schema/MyRoomState";
import { Player } from "./schema/Character";

export class StartRoom extends Room<MyRoomState> {
  onCreate(options: any) {
    this.setState(new MyRoomState());

    this.onMessage(
      "set_username",
      (client: Client, data: { username: string }) => {
        const player = this.state.players.get(client.sessionId);
        if (player) {
          player.userName = data.username;
          console.log(
            `Player ${client.sessionId} updated their username to ${data.username}`,
          );
        } else {
          // Handle the case where the player is not found (though this should not happen)
          console.log(`Player not found: ${client.sessionId}`);
          client.send("error", { message: "Player not found." });
        }
        if (player) {
          player.userName = data.username;
          console.log(
            `Player ${client.sessionId} updated their username to ${data.username}`,
          );
        } else {
          // Handle the case where the player is not found (though this should not happen)
          console.log(`Player not found: ${client.sessionId}`);
          client.send("error", { message: "Player not found." });
        }
      },
    );
  }

  onJoin(client: Client, options: any) {
    console.log(`${client.sessionId} joined the lobby!`);
    // need to fix something here, do we need to make a new player here?
    const player = new Player("", "");
    player.userName = options.username || "Guest";
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
