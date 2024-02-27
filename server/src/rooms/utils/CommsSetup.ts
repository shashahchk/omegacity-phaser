import { Room } from "@colyseus/core";
import { MyRoomState } from "../schema/MyRoomState";

function setUpChatListener(room: Room<MyRoomState>) {
  room.onMessage("sent_message", (client, message) => {
    room.broadcast("new_message", {
      message: message,
      senderName: client.sessionId,
    });
  });
}

function setUpVoiceListener(room: Room<MyRoomState>) {
  room.onMessage("player-talking", (client, payload) => {
    const player = room.state.players.get(client.sessionId);

    console.log("client message received");

    room.broadcast("player-voice", [client.sessionId, payload], {
      except: client,
    });
  });
}

function setUpRoomUserListener(room: Room<MyRoomState>) {
  room.onMessage("player_joined", (client, message) => {
    //get all currentplayer's session ids
    const allPlayers = room.clients.map((client) => {
      return client.sessionId;
    });

    room.broadcast("new_player", [allPlayers]);
  });
}

function setUpPlayerMovementListener(room: Room<MyRoomState>) {
  room.onMessage("move", (client, { x, y }) => {
    // Get reference to the player who sent the message
    const player = room.state.players.get(client.sessionId);

    // Set the player's position to the received coordinates
    player.x = x;
    player.y = y;

    // Determine if the player is moving
    const isMoving = player.x !== x || player.y !== y;

    if (isMoving) {
      player.isMoving = true;
      player.lastMovedTime = Date.now();
    } else {
      // if player moved before
      // if it was more than 1secs ago, stop moving
      if (player.lastMovedTime) {
        const lastMovedTime = player.lastMovedTime;
        if (
          !isNaN(lastMovedTime) &&
          Date.now() - lastMovedTime > 500 &&
          player.isMoving
        ) {
          player.isMoving = false;
        }
      }
    }
  });
}

export { setUpChatListener, setUpVoiceListener, setUpRoomUserListener, setUpPlayerMovementListener };
