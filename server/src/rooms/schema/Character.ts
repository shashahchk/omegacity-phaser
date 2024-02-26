import {
  Schema,
  Context,
  type,
  MapSchema,
  ArraySchema,
} from "@colyseus/schema";

export abstract class Character extends Schema {
  @type("number") x: number;
  @type("number") y: number;
  @type("string") pos: string;
  @type("string") lastMovedTime: string;
  @type("boolean") isMoving: boolean;
  @type("number") id: number;
}

export class Player extends Character {
  @type("string") userName: string;
}

export class Monster extends Character {
  @type(["string"]) playersTackling = new ArraySchema<string>();
  @type("boolean") isTackled: boolean;
  @type("number") health: number;
  @type("number") score: number;
  @type("string") monsterType: string;
}

export class InBattlePlayer extends Player {
  @type("number") health: number;
  @type("number") totalScore: number;
  @type("number") roundScore: number;
  @type("number") teamId: number;
  @type("boolean") isAlive: boolean;
  @type(["number"]) questionsSolved: number; // abit sus but we'll see
  @type(Monster) monster: Monster;
}
