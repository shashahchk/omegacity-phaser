import {Room} from "@colyseus/core";
import {MyRoomState} from "../schema/MyRoomState";

function setUpChatListener(room:Room<MyRoomState>) {
    room.onMessage("sent_message", (client, message ) => {

        room.broadcast("new_message", { message: message, senderName:client.sessionId});
    });
}

function setUpVoiceListener(room:Room<MyRoomState>) {
    room.onMessage("talk", (client, payload) => {
        const player = room.state.players.get(client.sessionId);

        console.log("client message received")

        room.broadcast("talk", [client.sessionId, payload], { except: client });
    });
}


function setUpRoomUserListener(room:Room<MyRoomState>) {
    room.onMessage("player_joined", (client, message) => {
        //

        //get all currentplayer's session ids
        const allPlayers = room.clients.map((client) => {
            return client.sessionId;
        })


        room.broadcast('new_player', [allPlayers]);
        // handle "type" message
        //
    });
}



export {setUpChatListener, setUpVoiceListener, setUpRoomUserListener}