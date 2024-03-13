import { Room, Client } from "@colyseus/core";
import { MyRoomState } from "./schema/MyRoomState";
import { Player } from "./schema/Character";

import {
  setUpChatListener,
  setUpPlayerMovementListener,
  setUpRoomUserListener,
  setUpVoiceListener,
  setUpPlayerStateInterval,
  SetUpCollabIDEListeners
} from "./utils/CommsSetup";
import { matchMaker } from "colyseus";
import * as Y from "yjs";

export class MyRoom extends Room<MyRoomState> {
  maxClients = 10;
  private queue: Client[] = [];
  public queuePopup: string[] = [];
  private num_players_per_battle = 4;
  private spawnPosition = { x: 128, y: 128 };
  // this will not be used in the final version after schema change
  private playerList: string[] = [];
  public ideStates = new Map<string, Y.Doc>();

  onCreate(options: any) {
    this.setState(new MyRoomState());

    SetUpCollabIDEListeners(this);

    setUpChatListener(this);
    setUpVoiceListener(this);
    setUpRoomUserListener(this);
    setUpPlayerMovementListener(this);
    setUpPlayerStateInterval(this);

    this.onMessage("joinQueue", (client: Client, message) => {
      // Check if the client is already in the queue
      console.log(message.data);

      const player = this.state.players.get(client.sessionId);
      if (player) {
        player.userName = message.data;
        console.log(
          `Player ${client.sessionId} updated their username to ${message.data}`,
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
    });

    this.onMessage("set_username", (client: Client, message) => {
      const player = this.state.players.get(client.sessionId);
      if (player) {
        player.userName = message;
        console.log(
          `Player ${client.sessionId} updated their username to ${message}`,
        );
      } else {
        // Handle the case where the player is not found (though this should not happen)
        console.log(`Player not found: ${client.sessionId}`);
        client.send("error", { message: "Player not found." });
      }
    });

    this.onMessage("leaveQueue", (client: Client, message) => {
      const index = this.queue.findIndex(
        (c) => c.sessionId === client.sessionId,
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
    });
  }

  async checkQueueAndCreateRoom() {
    if (this.queue.length >= this.num_players_per_battle) {
      const clients = this.queue.splice(0, this.num_players_per_battle);
      const sessionIds = clients.map((client) => client.sessionId);
      this.queuePopup = this.queuePopup.filter(
        (id) => !sessionIds.includes(id),
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
    this.playerList.push(client.sessionId);

    // create Player instance
    const player = new Player("", client.sessionId);

    // place Player at a random position
    player.x = this.spawnPosition.x;
    player.y = this.spawnPosition.y;

    // place player in the map of players by its sessionId
    // (client.sessionId is unique per connection!)
    this.state.players.set(client.sessionId, player);

    // Create a new Y.Doc for this player's IDE state
    const ideState = new Y.Doc();
    this.ideStates.set(client.sessionId, ideState);
    const editorCount = this.ideStates.size; // Implement this
    this.broadcast('editorCountUpdated', { count: editorCount });
  }

  onLeave(client: Client, consented: boolean) {
    if (this.state.players.has(client.sessionId)) {
      this.state.players.delete(client.sessionId);
      this.playerList = this.playerList.filter((id) => id !== client.sessionId);
      const usernameList = this.playerList.map((id) => {
        return this.state.players.get(id).userName;
      });
      this.broadcast("player_left", [usernameList]);
    }

    this.ideStates.delete(client.sessionId);

    console.log(client.sessionId, "left my_room!");
  }

  onDispose() {
    console.log("room", this.roomId, "disposing...");
  }
}
