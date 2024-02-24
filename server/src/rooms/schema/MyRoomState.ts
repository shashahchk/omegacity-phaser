import {
  Schema,
  Context,
  type,
  MapSchema,
  ArraySchema,
} from "@colyseus/schema";
import { Monster, Player } from "./Character";

export class MyRoomState extends Schema {
  @type({ map: Player }) players = new MapSchema<Player>();
}

export class Team extends Schema {
  @type("number") teamId: number;
  @type("string") teamName: string;
  @type("number") score: number;
  @type("number") health: number;
  @type("number") numPlayers: number;
}
export class BattleRoomState extends MyRoomState {
  @type(["number"]) teams = new ArraySchema<number>();
  @type({ map: Monster }) monsters = new MapSchema<Monster>();
  @type("number") totalRounds: number;
  @type("number") currentRound: number;
  @type("number") roundTimeLeft: number;
  @type("string") currentGameState: string;
}
