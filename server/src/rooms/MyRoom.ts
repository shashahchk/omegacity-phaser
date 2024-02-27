import { Room, Client } from "@colyseus/core";
import { MyRoomState, Player } from "./schema/MyRoomState";

import {
  setUpChatListener,
  setUpPlayerMovementListener,
  setUpRoomUserListener,
  setUpVoiceListener,
} from "./utils/CommsSetup";
import { matchMaker } from "colyseus";

export class MyRoom extends Room<MyRoomState> {
  maxClients = 10;
  private queue: Client[] = [];
  public queuePopup: string[] = [];
  private num_players_per_battle = 4;
  private spawnPosition = { x: 128, y: 128 };

  onCreate(options: any) {
    this.setState(new MyRoomState());

    setUpChatListener(this);
    setUpVoiceListener(this);
    setUpRoomUserListener(this);
    setUpPlayerMovementListener(this);

    this.onMessage(
      "joinQueue",
      (client: Client, message) => {
        // Check if the client is already in the queue
        console.log(message.data);

        const player = this.state.players.get(client.sessionId);
        if (player) {
          player.userName = message.data;
          console.log(
            `Player ${client.sessionId} updated their username to ${message.data}`
          );
        }

        if (this.queue.find((c) => c.sessionId === client.sessionId)) {
          console.log(`Player ${message.data} is already in the queue.`);
          return;
        }
        console.log(`Player ${message.data} joined the queue.`);
        this.queue.push(client);
        this.queuePopup.push(message.data);

        // Broadcast the updated queue to all clients
        this.broadcast("queueUpdate", { queue: this.queuePopup });
        this.checkQueueAndCreateRoom();
      }
    );

    this.onMessage(
      "setUsername",
      (client: Client, message) => {
        const player = this.state.players.get(client.sessionId);
        if (player) {
          player.userName = message.data;
          console.log(
            `Player ${client.sessionId} updated their username to ${message.data}`
          );

        } else {
          // Handle the case where the player is not found (though this should not happen)
          console.log(`Player not found: ${client.sessionId}`);
          client.send("error", { message: "Player not found." });
        }
      }
    );

    this.onMessage(
      "leaveQueue",
      (client: Client, message) => {
        const index = this.queue.findIndex(
          (c) => c.sessionId === client.sessionId
        );
        console.log(index);
        if (index !== -1) {
          this.queue.splice(index, 1);
          this.queuePopup.splice(index, 1);
          console.log(`Player ${message.data} left the queue.`);
          this.broadcast("leaveQueue", {
            userName: message.data,
            queue: this.queuePopup,
          });
        }
      }
    );
  }

  async checkQueueAndCreateRoom() {
    if (this.queue.length >= this.num_players_per_battle) {
      const clients = this.queue.splice(0, this.num_players_per_battle);
      const sessionIds = clients.map((client) => client.sessionId);
      this.queuePopup = this.queuePopup.filter(
        (id) => !sessionIds.includes(id)
      );

      this.broadcast("queueUpdate", { queue: this.queuePopup });

      // Create a new room for the battle
      const battleRoom = await matchMaker.createRoom("battle", {});

      // Move the selected clients to the new battle room
      clients.forEach(async (client) => {
        await matchMaker.joinById(battleRoom.roomId, client.sessionId);
        client.send("startBattle", { roomId: battleRoom.roomId });
      });
    }
  }

  onJoin(client: Client, options: any) {
    console.log(client.sessionId, "joined my_room" + this.roomId + "!");

    const mapWidth = 800;
    const mapHeight = 600;

    // create Player instance
    const player = new Player();

    // place Player at a random position
    player.x = this.spawnPosition.x;
    player.y = this.spawnPosition.y;

    // place player in the map of players by its sessionId
    // (client.sessionId is unique per connection!)
    this.state.players.set(client.sessionId, player);
  }

  onLeave(client: Client, consented: boolean) {
    if (this.state.players.has(client.sessionId)) {
      this.state.players.delete(client.sessionId);
      this.broadcast("player_leave", client.sessionId);
      this.broadcast("player_leave", client.sessionId);
    }
    console.log(client.sessionId, "left my_room!");
  }

  onDispose() {
    console.log("room", this.roomId, "disposing...");
  }
}
