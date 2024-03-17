import { Room, Client } from "@colyseus/core";
import { GameRoomState } from "./schema/GameRoomState";
import { Player } from "./schema/Character";

import {
  setUpChatListener,
  setUpPlayerMovementListener,
  setUpRoomUserListener,
  setUpVoiceListener,
  setUpPlayerStateInterval,
} from "./utils/CommsSetup";
import { matchMaker } from "colyseus";

export class GameRoom extends Room<GameRoomState> {
  maxClients = 10;
  private queue: Client[] = [];
  public queuePopup: string[] = [];
  private NUM_PLAYERS_PER_BATTLE = 4;
  private spawnPosition = { x: 128, y: 128 };
  // this will not be used in the final version after schema change
  private playerList: string[] = [];

  onCreate(options: any) {
    this.setState(new GameRoomState());

    setUpChatListener(this);
    setUpVoiceListener(this);
    setUpRoomUserListener(this);
    setUpPlayerMovementListener(this);
    setUpPlayerStateInterval(this);

    this.onMessage("joinQueue", (client: Client) => {
      // Check if the client is already in the queue

      const player = this.state.players.get(client.sessionId);
      console.log(player.username);
      if (player) {
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

    this.onMessage("leaveQueue", (client: Client) => {
      const index = this.queue.findIndex(
        (c) => c.sessionId === client.sessionId,
      );
      console.log(index);
      if (index !== -1) {
        this.queue.splice(index, 1);
        this.queuePopup.splice(index, 1);
        console.log(`Player ${message.data} left the queue.`);
        this.broadcast("leaveQueue", {
          username: message.data,
          queue: this.queuePopup,
        });
      }
    });
  }

  async checkQueueAndCreateRoom() {
    if (this.queue.length >= this.NUM_PLAYERS_PER_BATTLE) {
      const clients = this.queue.splice(0, this.NUM_PLAYERS_PER_BATTLE);
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
    console.log(client.sessionId, "joined game" + this.roomId + "!");
    this.playerList.push(client.sessionId);

    // create Player instance
    const player = new Player(130, 60, options.username, client.sessionId, options.playerEXP);

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
      this.playerList = this.playerList.filter((id) => id !== client.sessionId);
      const usernameList = this.playerList.map((id) => {
        return this.state.players.get(id).username;
      });
      this.broadcast("player_left", [usernameList]);
    }
    console.log(client.sessionId, "left game!");
  }

  onDispose() {
    console.log("room", this.roomId, "disposing...");
  }
}
