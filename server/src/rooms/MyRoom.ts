import { Room, Client } from "@colyseus/core";
import { MyRoomState, Player } from "./schema/MyRoomState";

import {
  setUpChatListener,
  setUpRoomUserListener,
  setUpVoiceListener,
} from "./utils/CommsSetup";
import { matchMaker } from "colyseus";

export class MyRoom extends Room<MyRoomState> {
  maxClients = 10;
  private queue: Client[] = [];
  private num_players_per_battle = 4;

  onCreate(options: any) {
    this.setState(new MyRoomState());

    setUpChatListener(this);
    setUpVoiceListener(this);
    setUpRoomUserListener(this);

    // Define a variable to track the time since the last input for each player
    const playerLastInputTime = new Map<string, number>();

    this.onMessage("move", (client, input) => {
      // Get reference to the player who sent the message
      const player = this.state.players.get(client.sessionId);
      const velocity = 2;

      if (input.left) {
        player.x -= velocity;
        player.pos = "left";
      } else if (input.right) {
        player.x += velocity;
        player.pos = "right";
      }

      if (input.up) {
        player.y -= velocity;
        player.pos = "up";
      } else if (input.down) {
        player.y += velocity;
        player.pos = "down";
      }

      if (!(input.left || input.right || input.up || input.down)) {
        // if player move before
        // if it was more than 1secs ago, stop moving
        if (player.lastMovedTime) {
          const lastMovedTime = parseInt(player.lastMovedTime);
          if (
            !isNaN(lastMovedTime) &&
            Date.now() - lastMovedTime > 500 &&
            player.isMoving
          ) {
            player.isMoving = false;
          }
        }
      } else {
        player.isMoving = true;
        player.lastMovedTime = Date.now().toString();
      }
    });

    this.onMessage("joinQueue", (client: Client) => {
      console.log(`Player ${client.sessionId} joined the queue`);
      if (client.sessionId in this.state.players) {
        console.log("player already in queue");
        return;
      }
      this.queue.push(client); // Add player to lobby queue
      this.checkQueueAndCreateRoom(); // Check if there are enough players to create a battle room
    });
  }

  private async checkQueueAndCreateRoom() {
    if (this.queue.length >= this.num_players_per_battle) {
      const clients = this.queue.splice(0, this.num_players_per_battle);
      const battleRoom = await matchMaker.createRoom("battle", {}); // Pass an empty object as the second argument

      for (const client of clients) {
        await matchMaker.joinById(battleRoom.roomId, client.sessionId);
        client.send("startBattle", {});
      }
    }
  }

  onJoin(client: Client, options: any) {
    console.log(client.sessionId, "joined my_room" + this.roomId + "!");

    const mapWidth = 800;
    const mapHeight = 600;

    // create Player instance
    const player = new Player();

    // place Player at a random position
    player.x = 128;
    player.y = 128;

    // place player in the map of players by its sessionId
    // (client.sessionId is unique per connection!)
    this.state.players.set(client.sessionId, player);
  }

  onLeave(client: Client, consented: boolean) {
    if (this.state.players.has(client.sessionId)) {
      this.state.players.delete(client.sessionId);
      this.broadcast("player_leave", client.sessionId);
    }
    console.log(client.sessionId, "left my_room!");
  }

  onDispose() {
    console.log("room", this.roomId, "disposing...");
  }
}
