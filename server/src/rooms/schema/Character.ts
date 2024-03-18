import { Schema, type, ArraySchema, MapSchema } from "@colyseus/schema";
import { TeamColor } from "./Group";

const PLAYER_MAX_HEALTH = 100;

export abstract class Character extends Schema {
  @type("number") x: number;
  @type("number") y: number;
  @type("string") direction: string;
  @type("number") lastMovedTime: number | undefined;
  @type("boolean") isMoving: boolean = false;
  @type("number") id: number | undefined;
}

export class Player extends Character {
  @type("string") username: string;
  @type("string") sessionId: string;
  @type("string") charName: string="hero1"; //make sure this is modified to user's preference
  @type("number") playerEXP: number;
  constructor(x: number, y: number, username: string, charName:string, sessionId: string, playerEXP: number) {
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

  constructor(question: string, options: ArraySchema<string>) {
    super();
    this.question = question;
    this.options = options;
  }
}

export class TeamSpecificMonsterInfo extends Schema {
  @type("number") health: number;
  @type(["string"]) playerIDsAttacking = new ArraySchema<string>();
}

export class Monster extends Character {
  @type("boolean") isDefeated: boolean;
  @type("string") defeatedBy: TeamColor | null;
  @type("number") score: number;
  @type("number") health: number;
  @type("string") monsterType: string;
  @type([MonsterMCQ]) questions = new ArraySchema<MonsterMCQ>();
  @type([TeamSpecificMonsterInfo]) teams = new MapSchema<TeamSpecificMonsterInfo, TeamColor>();
}

export class InBattlePlayer extends Player {
  @type("number") health: number = PLAYER_MAX_HEALTH;
  @type("number") totalScore: number = 0;
  @type(["number"]) totalQuestionIdsSolved: ArraySchema<number> = new ArraySchema<number>();
  @type("number") roundScore: number = 0;
  @type(["number"]) roundQuestionIdsSolved: ArraySchema<number> = new ArraySchema<number>();
  @type("string") teamColor: TeamColor;

  constructor(x: number, y: number, username: string, charName: string, sessionId: string, playerEXP: number) {
    super(x, y, username, charName, sessionId, playerEXP);
    this.health = PLAYER_MAX_HEALTH;
    this.totalScore = 0;
    this.totalQuestionIdsSolved = new ArraySchema<number>();
    this.roundScore = 0;
    this.roundQuestionIdsSolved = new ArraySchema<number>();
  }
}
