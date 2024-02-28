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

function setUpPlayerStateInterval(room: Room<MyRoomState>) {
  // Send timer updates to check player movement every second
  setInterval(() => {
    // for player in room.state.players
    // if player.lastMovedTime < Date.now() - 1000
    // change isMoving to False

    if (room.state.players) {
      room.state.players.forEach((player) => {
        // console.log("lastMovedTime", player.lastMovedTime)
        if (player.lastMovedTime && player.lastMovedTime >= Date.now() - 500) {
          player.isMoving = true;
          // console.log("moving")
        } else {
          player.isMoving = false;
          // console.log("stop moving")
        }
      });
    }
  }, 500);
}

function setUpPlayerMovementListener(room: Room<MyRoomState>) {
  room.onMessage("move", (client, { x, y, direction }) => {
    // Get reference to the player who sent the message

    const player = room.state.players.get(client.sessionId);
    // Check if the player's x, y, or direction is different from the received ones
    if (player == undefined) {
      console.log("player not found");
      return;
    }
    if (player.x !== x || player.y !== y || player.direction !== direction) {
      // Set the player's position to the received coordinates
      player.x = x;
      player.y = y;
      player.direction = direction;

      // Update lastMovedTime only if there was a change
      player.lastMovedTime = Date.now();
    }
  });
}

export {
  setUpChatListener,
  setUpVoiceListener,
  setUpRoomUserListener,
  setUpPlayerMovementListener,
  setUpPlayerStateInterval,
};
