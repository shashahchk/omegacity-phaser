import { Room, Client } from "colyseus";
import { matchMaker } from "colyseus";
import { MyRoomState } from "./schema/MyRoomState";

export class LobbyRoom extends Room<MyRoomState> {
  // A simple lobby queue
  private lobbyQueue: Client[] = [];

  onCreate(options: any) {
    this.setState(new MyRoomState());
    
    this.onMessage("joinQueue", (client: Client) => {
      console.log(`Player ${client.sessionId} joined the queue`);
      // Add player to lobby queue
      this.lobbyQueue.push(client);
      // Check queue and create room if necessary
      this.checkQueueAndCreateRoom();
    });
  }

  async onDispose() {
    // Custom cleanup logic if needed
  }

  // Custom method to check queue and create a battle room
  async checkQueueAndCreateRoom() {
    if (this.lobbyQueue.length >= 2) {
      console.log(this.lobbyQueue.length)
      const clients = this.lobbyQueue.splice(0, 3); // Get the first 3 players

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