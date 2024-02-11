import { Room, Client } from "@colyseus/core";
import { MyRoomState, Player } from "./schema/MyRoomState";

export class MyRoom extends Room<MyRoomState> {
  maxClients = 4;

  onCreate(options: any) {
    this.setState(new MyRoomState());

    this.onMessage("push", (client, _) => {
      const player = this.state.players.get(client.sessionId);
    });


    this.onMessage("talk", (client, payload) => {
      const player = this.state.players.get(client.sessionId);

      console.log("client message received")

      this.broadcast("talk", [client.sessionId, payload], { except: client });
    });

    this.setUpChat();

    this.onMessage("keydown", (client, message) => {
      //
      this.broadcast('keydown', message, {
        except: client
      })
      // handle "type" message
      //
    });

    this.onMessage("player_joined", (client, message) => {
      //

      //get all currentplayer's session ids
        const allPlayers = this.getAllPlayers()
        // send an array of all players id
        console.log(allPlayers)

        this.broadcast('new_player', [allPlayers]);
      // handle "type" message
      //
    });

  }

  onJoin(client: Client, options: any) {

  }

  onLeave(client: Client, consented: boolean) {
    console.log(client.sessionId, "left!");
  }

  onDispose() {
    console.log("room", this.roomId, "disposing...");
  }

  setUpChat() {
    this.onMessage("sent_message", (client, message ) => {

      this.broadcast("new_message", { message: message, senderName:client.sessionId});
    });
  }

  getAllPlayers() {
    return this.clients.map((client) => {
      return client.sessionId;
    })
  }

}
