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
  private queue: Player[] = [];
  private NUM_PLAYERS_PER_BATTLE = 4;
  private spawnPosition = { x: 128, y: 128 };


  onCreate(options: any) {
    this.setState(new GameRoomState());

    setUpChatListener(this);
    setUpVoiceListener(this);
    setUpRoomUserListener(this);
    setUpPlayerMovementListener(this);
    setUpPlayerStateInterval(this);

    // when player enters the room for the first time, will call this to retrieve players in queue currently 
    this.onMessage("retrieveQueueList", (client: Client) => {
      client.send("queueUpdate", { queue: this.queue });
    });

    this.onMessage("joinQueue", (client: Client) => {
      // Check if the client is already in the queue

      const player = this.state.players.get(client.sessionId);
      console.log(player.username);
      if (!player) {
        console.log(
          `Player ${player.username} with sessionID ${client.sessionId} not found`,
        );
        return;
      }

      if (this.queue.find((c) => c.sessionId === client.sessionId)) {
        console.log(`Player ${player.username} with sessionID ${client.sessionId} is already in the queue.`);
        return;
      }

      this.queue.push(player);
      // Broadcast the updated queue to all clients
      this.broadcast("queueUpdate", { queue: this.queue });
      this.checkQueueAndCreateRoom();
    });

    this.onMessage("leaveQueue", (client: Client) => {
      this.playerLeftQueue(client);
    });

  }

  playerLeftQueue(client: Client) {
    const queueIndex = this.queue.findIndex((c) => c.sessionId === client.sessionId);
    var player: Player
    if (queueIndex !== -1) {
      player = this.queue[queueIndex];
      this.queue.splice(queueIndex, 1);
      console.log(`Player ${client.sessionId} left the queue.`);
      this.broadcast("leaveQueue", {
        queue: this.queue,
        playerLeftName: player.username,
      }
      );
    }
  }

  async checkQueueAndCreateRoom() {
    if (this.queue.length >= this.NUM_PLAYERS_PER_BATTLE) {

      const players = this.queue.splice(0, this.NUM_PLAYERS_PER_BATTLE);
      const playerSessionIds = players.map(player => player.sessionId);
      const clientsToBroadcast = this.clients.filter(client => playerSessionIds.includes(client.sessionId));
      // Update display list
      // Broadcast the updated queue to all clients
      this.broadcast("queueUpdate", { queue: this.queue });

      // Create a new room for the battle
      const battleRoom = await matchMaker.createRoom("battle", {});

      // Move the selected clients to the new battle room
      clientsToBroadcast.forEach(async (client) => {
        await matchMaker.joinById(battleRoom.roomId, client.sessionId);
        client.send("startBattle", { roomId: battleRoom.roomId });
        this.state.players.delete(client.sessionId); //remove all these players from the room state
      });
    }
  }

  onJoin(client: Client, options: any) {
    console.log(client.sessionId, "joined game" + this.roomId + "!");

    // create Player instance
    const player = new Player(130, 60, options.username, options.charName, client.sessionId, options.playerEXP);

    // place Player at a random position
    player.x = this.spawnPosition.x;
    player.y = this.spawnPosition.y;

    // place player in the map of players by its sessionId
    // (client.sessionId is unique per connection!)
    this.state.players.set(client.sessionId, player);
  }

  onLeave(client: Client, consented: boolean) {
    this.playerLeftQueue(client);
    console.log(client.sessionId, "left game!");
  }

  onDispose() {
    console.log("room", this.roomId, "disposing...");
  }
}
