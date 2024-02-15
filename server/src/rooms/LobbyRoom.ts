import { Room, Client } from "colyseus";
import { matchMaker } from "colyseus";
import { MyRoomState } from "./schema/MyRoomState";

export class LobbyRoom extends Room<MyRoomState> {
  private lobbyQueue: Client[] = [];
  private num_players_per_battle = 3;

  onCreate(options: any) {
    this.setState(new MyRoomState());
    
    this.onMessage("joinQueue", (client: Client) => {
      console.log(`Player ${client.sessionId} joined the queue`);
      this.lobbyQueue.push(client);       // Add player to lobby queue
      this.checkQueueAndCreateRoom();    // Check if there are enough players to create a battle room
    });
  }

  async onDispose() {
    // Custom cleanup logic if needed
  }

  // Custom method to check queue and create a battle room
  async checkQueueAndCreateRoom() {
    if (this.lobbyQueue.length >= this.num_players_per_battle) {
      const clients = this.lobbyQueue.splice(0, this.num_players_per_battle);

      // Create a battle room with these players
      const battleRoom = await matchMaker.createRoom("battle", {}); // Pass an empty object as the second argument

      // Move clients to the new room
    try {
      const joinPromises = clients.map(client => { client.send('startBattle', { roomId: battleRoom.roomId }); // Send the new room ID to the client
      });
      await Promise.all(joinPromises);
    } catch (error) {
      console.error('Error moving clients to the new room:', error);
    }
    }
  }
  onLeave(client: Client, consented: boolean) {
    console.log(client.sessionId, "left!");
    
    if (client.sessionId in this.state.players) {
      this.state.players.delete(client.sessionId);
    }
  }

}