import { Room } from "@colyseus/core";
import { InBattlePlayer } from "../schema/Character";
import { BattleRoomState } from "../schema/BattleRoomState";

function setUpMonsterQuestionListener(room: Room<BattleRoomState>) {
    room.onMessage("playerStartMonsterAttack", (client, message) => {
        // find player associated with client
        // find player team color 
        // 
        // const player: InBattlePlayer = room.clients.map((client) => {
        //     return room.state.teams .get(client.sessionId);
        // });
        // console.log(player.)


    });

    room.onMessage("playerStopMonsterAttack", (client, message) => {
        const allPlayers = room.state.players;
        const allPlayersUsername = Array.from(allPlayers.values()).map(
            (player) => player.username,
        );
        allPlayersUsername.filter((player) => player !== undefined);

        room.broadcast("newPlayer", [allPlayersUsername]);
    });

    room.onMessage("playerQueueForMonster", (client, message) => {
        const monsterId = message.monsterId;
        const playerId = message.playerId;
        const teamColor = message.teamColor;
        const playerIDsAttacking = room.state.monsters?.get(monsterId).teams?.get(teamColor).playerIDsAttacking;
        if (!playerIDsAttacking.includes(playerId)) {
            room.state.monsters.get(monsterId).teams?.get(teamColor).playerIDsAttacking?.push(playerId);
            client.send("joinQueueSuccess")
        }
    })
}


export {
    setUpMonsterQuestionListener
};
