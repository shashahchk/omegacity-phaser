import { Room, Client } from "@colyseus/core";
import { MyRoomState, Player } from "./schema/MyRoomState";
import { setUpChatListener, setUpRoomUserListener, setUpVoiceListener } from "./utils/CommsSetup";

export class MyRoom extends Room<MyRoomState> {
  maxClients = 4;

  onCreate(options: any) {
    this.setState(new MyRoomState());

    this.onMessage("push", (client, _) => {
      const player = this.state.players.get(client.sessionId);
    });

    this.onMessage("keydown", (client, message) => {
      //
      this.broadcast('keydown', message, {
        except: client
      })
      // handle "type" message
      //
    });


    setUpChatListener(this)
    setUpVoiceListener(this)
    setUpRoomUserListener(this)



  }

  onJoin(client: Client, options: any) {

  }

  onLeave(client: Client, consented: boolean) {
    console.log(client.sessionId, "left!");
  }

  onDispose() {
    console.log("room", this.roomId, "disposing...");
  }





}
