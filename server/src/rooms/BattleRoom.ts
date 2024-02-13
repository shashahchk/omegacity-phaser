import { Room, Client } from "@colyseus/core";
import { MyRoomState, Player } from "./schema/MyRoomState";

export class BattleRoom extends Room<MyRoomState> {
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
          if (!isNaN(lastMovedTime) && Date.now() - lastMovedTime > 500 && player.isMoving) {
            player.isMoving = false;
          }
        }

      } else {
        player.isMoving = true;
        player.lastMovedTime = Date.now().toString();
      }

    });

  }

  onJoin(client: Client, options: any) {
    console.log(client.sessionId, "joined!");

    const mapWidth = 800;
    const mapHeight = 600;

    // create Player instance
    const player = new Player();

    // place Player at a random position
    player.x = 128
    player.y = 128

    // place player in the map of players by its sessionId
    // (client.sessionId is unique per connection!)
    this.state.players.set(client.sessionId, player);
  }

  onLeave(client: Client, consented: boolean) {
    console.log(client.sessionId, "left!");

    this.state.players.delete(client.sessionId);
  }

  onDispose() {
    console.log("room", this.roomId, "disposing...");
  }

}
