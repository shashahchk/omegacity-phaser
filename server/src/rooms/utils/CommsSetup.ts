import { Room } from "@colyseus/core";
import { MyRoomState } from "../schema/MyRoomState";
import { BattleRoom } from "../BattleRoom";

function setUpChatListener(room: Room<MyRoomState>) {
  // room.onMessage("sent_message", (client, message) => {
  //   // get the user name from the player object
  //   const player = room.state.players.get(client.sessionId);
  //
  //   room.broadcast("new_message", {
  //     message: message,
  //     senderName: player.userName,
  //   });
  room.onMessage(
    "sent_message",
    (client, { message, channel, channelType }) => {
      console.log(message);
      console.log(channel);
      const sender = room.state.players.get(client.sessionId);
      if (channelType === "all") {
        console.log("broadcasting");
        room.broadcast("new_message", {
          message: message,
          senderName: sender.userName,
        });
      }

      if (channelType === "team") {
        // loop through all the teams and find if there is this player
        // if there is, get the team id and broadcast to that team
        // @ts-ignore
        // check if room is a BattleRoom
        if (room instanceof BattleRoom) {
          console.log("broadcasting to team");
          var teamId;
          // @ts-ignore
          room.state.teams.forEach((team) => {
            if (team.teamPlayers.has(client.sessionId)) {
              teamId = team.teamId;
            }
          });

          // set to all players int the team
          // @ts-ignore
          console.log("teamId", teamId);
          console.log("room.state.teams", room.state.teams);
          // @ts-ignore
          room.state.teams[teamId].teamPlayers.forEach((player) => {
            const client = room.clients.find(
              (client) => client.sessionId === player.sessionId,
            );
            client.send("new_message", {
              message: "(Team) " + message,
              senderName: sender.userName,
            });
          });
        }
      } else {
        // find the receiver with that username
        // use channel to find the session id
        const receiverId = findIdByUsername(channel, room);
        if (receiverId == null) {
          console.log("receiver not found");
        }
        if (receiverId) {
          client.send("new_message", {
            message: "(Private) " + message,
            senderName: sender.userName,
          });
          const receiver = room.clients.find((client) => {
            return client.sessionId === receiverId;
          });
          receiver.send("new_message", {
            message: "(Private) " + message,
            senderName: sender.userName,
          });
        }
      }
    },
  );
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

  room.onMessage("playerJoined", (client, message) => {
    //get all currentplayer's session ids
    // not used as room userlistener anymore
    // room.broadcast("new_player", [allPlayers]);
    const allPlayers = room.clients.map((client) => {
      return room.state.players.get(client.sessionId).userName;
    });
    allPlayers.filter((player) => player !== undefined);
    room.broadcast("newPlayer", [allPlayers]);
  });

  room.onMessage("updatePlayerList", (client, message) => {
    const allPlayers = room.state.players;
    const allPlayersUsername = Array.from(allPlayers.values()).map(
      (player) => player.userName,
    );
    allPlayersUsername.filter((player) => player !== undefined);

    room.broadcast("newPlayer", [allPlayersUsername]);
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

function findIdByUsername(username: string, room: any) {
  for (let [sessionId, player] of room.state.players.entries()) {
    if (player.userName === username) {
      return sessionId; // Found the sessionId for the given username
    }
  }
  return null; // If no player with the given username is found
}

export {
  setUpChatListener,
  setUpVoiceListener,
  setUpRoomUserListener,
  setUpPlayerMovementListener,
  setUpPlayerStateInterval,
};
