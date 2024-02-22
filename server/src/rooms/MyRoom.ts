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

    this.onMessage("joinQueue", (client: Client) => {
      // Check if the client is already in the queue
      if (this.queue.find((c) => c.sessionId === client.sessionId)) {
        console.log(`Player ${client.sessionId} is already in the queue.`);
        return;
      }

      console.log(`Player ${client.sessionId} joined the queue.`);
      this.queue.push(client);
      this.queuePopup.push(client.sessionId); // Update display list

      // Broadcast the updated queue to all clients
      this.broadcast("queueUpdate", { queue: this.queuePopup });
      this.checkQueueAndCreateRoom(); // Check if there are enough players to create a battle room
    });

    this.onMessage("leaveQueue", (client: Client) => {
      const index = this.queue.indexOf(client);
      console.log(index);
      if (index !== -1) {
        this.queue.splice(index, 1); // Remove the client from the queue
        this.queuePopup.splice(index, 1); // Also update the queuePopup for display purposes
        console.log(`Player ${client.sessionId} left the queue.`);
        this.broadcast('leaveQueue', { sessionId: client.sessionId, queue: this.queuePopup });
      }
    });

  }

  async checkQueueAndCreateRoom() {
    if (this.queue.length >= this.num_players_per_battle) {
      const clients = this.queue.splice(0, this.num_players_per_battle);
      const sessionIds = clients.map((client) => client.sessionId);
      this.queuePopup = this.queuePopup.filter(
        (id) => !sessionIds.includes(id)
      ); // Update display list
      // Broadcast the updated queue to all clients
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