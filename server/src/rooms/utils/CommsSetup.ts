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
  // Define a variable to track the time since the last input for each player
  const playerLastInputTime = new Map<string, number>();

  room.onMessage("move", (client, input) => {
    // Get reference to the player who sent the message
    const player = room.state.players.get(client.sessionId);
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
}

export { setUpChatListener, setUpVoiceListener, setUpRoomUserListener, setUpPlayerMovementListener };
