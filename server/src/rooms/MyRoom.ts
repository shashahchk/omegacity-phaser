import { Room, Client } from "@colyseus/core";
import { MyRoomState, Player } from "./schema/MyRoomState"; // assuming Player is defined in MyRoomState.ts

export class MyRoom extends Room<MyRoomState> {
  maxClients = 4;

  onCreate(options: any) {
    this.setState(new MyRoomState());

    this.onMessage("keydown", (client, message) => {
      //
      this.broadcast('keydown', message, {
        except: client
      })
      // handle "type" message
      //
    });

    this.onMessage("move", (client: Client, message: any) => {
      const player = this.state.players.get(client.sessionId);
      player.x = message.x;
      player.y = message.y;
    });
  }

  onJoin(client: Client, options: any) {
    console.log(client.sessionId, "joined!");
    this.state.players.set(client.sessionId, new Player());
  }

  onLeave(client: Client, consented: boolean) {
    console.log(client.sessionId, "left!");
    this.state.players.delete(client.sessionId);
  }

  onDispose() {
      console.log("room", this.roomId, "disposing...");
  }
  
}
