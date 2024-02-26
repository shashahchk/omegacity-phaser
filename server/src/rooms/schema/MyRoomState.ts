import {
  Schema,
  Context,
  type,
  MapSchema,
  ArraySchema,
} from "@colyseus/schema";
import { Monster, Player } from "./Character";
import { BattleRoom } from "../BattleRoom";
import { BattleTeam } from "./Group";

export class MyRoomState extends Schema {
  @type({ map: Player }) players = new MapSchema<Player>();
}

export class BattleRoomState extends MyRoomState {
  @type([BattleTeam]) teams = new ArraySchema<BattleTeam>();
  @type({ map: Monster }) monsters = new MapSchema<Monster>();
  @type("number") totalRounds: number;
  @type("number") currentRound: number;
  @type("number") roundTimeLeft: number;
  @type("string") currentGameState: string;
}
