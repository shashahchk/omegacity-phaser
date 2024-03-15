import { Schema, type, ArraySchema } from "@colyseus/schema";
import { TeamColor } from "./Group";

const PLAYER_MAX_HEALTH = 100;

export abstract class Character extends Schema {
  @type("number") x: number;
  @type("number") y: number;
  @type("string") direction: string;
  @type("number") lastMovedTime: number;
  @type("boolean") isMoving: boolean;
  @type("number") id: number;
}

export class Player extends Character {
  @type("string") userName: string;
  @type("string") sessionId: string;
  @type("string") charName: string = "hero1"; //make sure this is modified to user's preference
  constructor(userName: string, sessionId: string) {
    super();
    this.userName = userName;
    this.sessionId = sessionId;
  }

  // make a function that clones the player
  cloneNewPosPlayer(): Player {
    const newPlayer = new Player(this.userName, this.sessionId);
    newPlayer.x = this.x;
    newPlayer.y = this.y;
    newPlayer.direction = this.direction;
    newPlayer.lastMovedTime = this.lastMovedTime;
    newPlayer.isMoving = this.isMoving;
    newPlayer.id = this.id;
    return newPlayer;
  }
}

export class Monster extends Character {
  @type(["string"]) playerIdsTackling = new ArraySchema<string>();
  @type("boolean") isTackled: boolean;
  @type("number") health: number;
  @type("number") score: number;
  @type("string") monsterType: string;
}

export class InBattlePlayer extends Player {
  @type("number") health: number;
  @type("number") totalScore: number;
  @type(["number"]) totalQuestionIdsSolved: ArraySchema<number>;
  @type("number") roundScore: number;
  @type(["number"]) roundQuestionIdsSolved: ArraySchema<number>;
  @type("string") teamColor: TeamColor;
  @type(Monster) monster: Monster;

  constructor(userName: string, sessionId: string) {
    super(userName, sessionId);
    this.health = PLAYER_MAX_HEALTH;
    this.totalScore = 0;
    this.totalQuestionIdsSolved = new ArraySchema<number>();
    this.roundScore = 0;
    this.roundQuestionIdsSolved = new ArraySchema<number>();
  }
}
