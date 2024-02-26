import {
  Schema,
  Context,
  type,
  MapSchema,
  ArraySchema,
} from "@colyseus/schema";
import { BattleTeam } from "./Group";
import { MyRoomState } from "./MyRoomState";
import { Monster } from "./Character";

export class BattleRoomState extends MyRoomState {
  @type([BattleTeam]) teams = new ArraySchema<BattleTeam>();
  @type({ map: Monster }) monsters = new MapSchema<Monster>();
  @type("number") totalRounds: number;
  @type("number") currentRound: number;
  @type("number") roundDurationInMinute: number;
  @type("number") currentRoundTimeRemaining: number;
  @type("number") roundStartTime: number;
  @type("string") currentGameState: string;
}