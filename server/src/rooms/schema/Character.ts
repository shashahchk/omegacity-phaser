import { Schema, type, ArraySchema, MapSchema } from "@colyseus/schema";
import { TeamColor } from "./Group";
import { Client, Room } from "@colyseus/core";
import { BattleRoom } from "../BattleRoom";
import clean = Mocha.utils.clean;
import { HeroEnum, MonsterEnum } from "../../../types/CharacterTypes";

const PLAYER_MAX_HEALTH = 100;

export abstract class Character extends Schema {
  @type("number") x: number;
  @type("number") y: number;
  @type("string") direction: string;
  @type("number") lastMovedTime: number | undefined;
  @type("boolean") isMoving: boolean = false;
  @type("number") id: number | undefined;
  @type("string") charName: HeroEnum | MonsterEnum;
}

export class Player extends Character {
  @type("string") username: string;
  @type("string") sessionId: string;
  @type("number") playerEXP: number;
  constructor(
    x: number,
    y: number,
    username: string,
    charName: HeroEnum,
    sessionId: string,
    playerEXP: number,
  ) {
    super();
    this.x = x;
    this.y = y;
    this.username = username;
    this.charName = charName;
    this.sessionId = sessionId;
    this.playerEXP = playerEXP;
  }
}

export class Question extends Schema {
  @type("number") id: number;
  @type("string") question: string;
  @type("string") answer: string;
}

export class MCQ extends Question {
  @type(["string"]) options: string[];

  constructor(props: { options: string[]; question: string; answer: string }) {
    super(props);
    this.options = props.options;
    this.question = props.question;
    this.answer = props.answer;
  }
}

export class MonsterMCQ extends Schema {
  @type("string") question: string;
  @type(["string"]) options: ArraySchema<string>;
  @type("string") answer: string;

  constructor(question: string, options: ArraySchema<string>, answer: string) {
    super();
    this.question = question;
    this.options = options;
    this.answer = answer;
  }
}

export class TeamSpecificMonsterInfo extends Schema {
  @type("number") health: number = 100;
  @type(["string"]) playerIDsAttacking = new ArraySchema<string>();
  @type("boolean") isAttacking: boolean = false;
  @type("number") playerNumber: number = 0;
  @type("number") questionsDone: number = 0;
}

export class Monster extends Character {
  @type("boolean") isDefeated: boolean;
  @type("string") defeatedBy: TeamColor | null;
  @type("number") score: number;
  @type("string") monsterType: string;
  @type([MonsterMCQ]) questions = new ArraySchema<MonsterMCQ>();
  @type({ map: TeamSpecificMonsterInfo }) teams =
    new MapSchema<TeamSpecificMonsterInfo>();

  constructor(charName: MonsterEnum) {
    super();
    this.charName = charName;
  }

  updateTeam(room: BattleRoom, team: TeamColor) {
    // send to those with that team color
    const teamInfo = room.state.teams.get(team).teamPlayers;
    for (let i = 0; i < teamInfo.length; i++) {
      const client = room.clients.find(
        (client) => client.sessionId === teamInfo[i],
      );
      client.send("monsterUpdate" + this.id.toString(), {
        health: this.teams.get(team).health,
        playersTackling: this.teams.get(team).playerIDsAttacking,
      });
    }
  }

  setUpClientMonsterListener(room: BattleRoom) {
    room.onMessage(
      "playerQueueForMonster" + this.id.toString(),
      (client, message) => {
        const player = room.state.players.get(
          client.sessionId,
        ) as InBattlePlayer;
        if (player.health == 0) {
          client.send("cannotStart", { message: "You are dead" });
          return;
        }
        console.log(
          "playerQueueForMonster",
          this.teams.get(player.teamColor).playerNumber,
        );
        this.teams
          .get(player.teamColor)
          .playerIDsAttacking.push(client.sessionId);
        this.teams.get(player.teamColor).playerNumber++;
        this.updateTeam(room, player.teamColor);
        console.log(
          "playerQueueForMonster",
          this.teams.get(player.teamColor).playerNumber,
        );
        if (this.teams.get(player.teamColor).playerNumber === 2) {
          this.teams.get(player.teamColor).isAttacking = true;
          // send to the everyone that are tackling this monster
          this.teams
            .get(player.teamColor)
            .playerIDsAttacking.forEach((sessionId, index) => {
              const client = room.clients.find(
                (client) => client.sessionId === sessionId,
              );
              console.log("sending start to", sessionId);
              client.send("start" + this.id.toString(), {
                qnsID: index,
              });
            });
          //send to everyone in the team that this monster is being attacked
          room.state.teams
            .get(player.teamColor)
            .teamPlayers.forEach((sessionId) => {
              const client = room.clients.find(
                (client) => client.sessionId === sessionId,
              );
              client.send("monsterIsAttacked" + this.id.toString(), {
                monsterID: this.id,
              });
            });
          this.teams.get(player.teamColor).isAttacking = true;
        }
      },
    );

    room.onMessage(
      "playerLeftMonster" + this.id.toString(),
      (client, message) => {
        const player = room.state.players.get(
          client.sessionId,
        ) as InBattlePlayer;
        console.log("after playerLeftMonster");

        //shouldnt be less than 0
        let team = this.teams.get(player.teamColor);
        team.playerNumber = Math.max(0, team.playerNumber - 1);

        this.teams.get(player.teamColor).playerIDsAttacking = this.teams
          .get(player.teamColor)
          .playerIDsAttacking.filter((id) => id !== client.sessionId);
        this.updateTeam(room, player.teamColor);
      },
    );

    room.onMessage("abandon" + this.id.toString(), (client, message) => {
      const player = room.state.players.get(client.sessionId) as InBattlePlayer;
      this.sendToAllPlayersOnTheSameTeamAttackingSameMonster(
        room,
        client,
        "monsterAbandoned",
        {},
      );

      // remove all players and set playernumber to 0
      this.teams.get(player.teamColor).playerNumber = 0;
      this.teams.get(player.teamColor).playerIDsAttacking =
        new ArraySchema<string>();
      this.teams.get(player.teamColor).isAttacking = false;
      this.updateTeam(room, player.teamColor);
      //     this.teams.get(player.teamColor).playerNumber = 0;
    });
  }

  sendToAllPlayersOnTheSameTeamAttackingSameMonster(
    room: BattleRoom,
    client: Client,
    clientSideMessageListenerName: string,
    content: {},
  ) {
    const player = room.state.players.get(client.sessionId) as InBattlePlayer;
    // for each of the playersID attack, send a message to them that the monster is abandoned
    this.teams.get(player.teamColor).playerIDsAttacking.forEach((sessionId) => {
      const client = room.clients.find(
        (client) => client.sessionId === sessionId,
      );
      client.send(clientSideMessageListenerName + this.id.toString(), content);
    });
  }
}

export class InBattlePlayer extends Player {
  @type("number") health: number = PLAYER_MAX_HEALTH;
  @type("number") totalScore: number = 0;
  @type(["number"]) totalQuestionIdsSolved: ArraySchema<number> =
    new ArraySchema<number>();
  @type("number") roundScore: number = 0;
  @type(["number"]) roundQuestionIdsSolved: ArraySchema<number> =
    new ArraySchema<number>();
  @type(["number"]) currentQuestionIdsSolved: ArraySchema<number> =
    new ArraySchema<number>();
  @type("string") teamColor: TeamColor;

  constructor(
    x: number,
    y: number,
    username: string,
    charName: HeroEnum,
    sessionId: string,
    playerEXP: number,
  ) {
    super(x, y, username, charName, sessionId, playerEXP);
    this.health = PLAYER_MAX_HEALTH;
    this.totalScore = 0;
    this.totalQuestionIdsSolved = new ArraySchema<number>();
    this.roundScore = 0;
    this.roundQuestionIdsSolved = new ArraySchema<number>();
  }

  resetPlayerAfterRound() {
    this.totalQuestionIdsSolved = new ArraySchema<number>();
    this.roundScore = 0;
    this.roundQuestionIdsSolved = new ArraySchema<number>();
    this.currentQuestionIdsSolved = new ArraySchema<number>();
    this.health = PLAYER_MAX_HEALTH;
  }
}
