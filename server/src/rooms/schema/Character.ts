import { Schema, type, ArraySchema } from "@colyseus/schema";
import { TeamColor } from "./Group";

const PLAYER_MAX_HEALTH = 100;

export abstract class Character extends Schema {
  @type("number") x: number;
  @type("number") y: number;
  @type("string") direction: string;
  @type("number") lastMovedTime: number | undefined;
  @type("boolean") isMoving: boolean=false;
  @type("number") id: number | undefined;
}

export class Player extends Character {
  @type("string") userName: string;
  @type("string") sessionId: string;
  @type("string") charName: string = "hero1"; //make sure this is modified to user's preference
  constructor(x:number, y:number, userName: string, sessionId: string) {
    super();
    this.x = x;
    this.y = y;
    this.userName = userName;
    this.sessionId = sessionId;
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
  @type("number") health: number= PLAYER_MAX_HEALTH;
  @type("number") totalScore: number=0;
  @type(["number"]) totalQuestionIdsSolved: ArraySchema<number>= new ArraySchema<number>();
  @type("number") roundScore: number=0;
  @type(["number"]) roundQuestionIdsSolved: ArraySchema<number> = new ArraySchema<number>();
  @type("string") teamColor: TeamColor;

  constructor(x:number, y:number, userName: string, sessionId: string) {
    super(x, y, userName, sessionId);
    this.health = PLAYER_MAX_HEALTH;
    this.totalScore = 0;
    this.totalQuestionIdsSolved = new ArraySchema<number>();
    this.roundScore = 0;
    this.roundQuestionIdsSolved = new ArraySchema<number>();
  }
}
