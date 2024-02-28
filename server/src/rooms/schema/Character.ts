import {
  Schema,
  Context,
  type,
  MapSchema,
  ArraySchema,
} from "@colyseus/schema";
import { TeamColor } from "./Group";

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

  constructor() {
    super();
    this.health = 100;
    this.totalScore = 0;
    this.totalQuestionIdsSolved = new ArraySchema<number>();
    this.roundScore = 0;
    this.roundQuestionIdsSolved = new ArraySchema<number>();
  }
}
