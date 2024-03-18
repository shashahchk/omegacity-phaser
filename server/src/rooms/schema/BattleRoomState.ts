import {
  Schema,
  Context,
  type,
  MapSchema,
  ArraySchema,
} from "@colyseus/schema";
import { BattleTeam } from "./Group";
import { GameRoomState } from "./GameRoomState";
import { InBattlePlayer, Monster } from "./Character";

export enum BattleRoomCurrentState {
  Waiting = "waiting",
}

export class BattleRoomState extends GameRoomState {
  @type({ map: BattleTeam }) teams = new MapSchema<BattleTeam>();
  @type({ map: Monster }) monsters = new MapSchema<Monster>();
  @type("number") totalRounds: number;
  @type("number") currentRound: number;
  @type("number") roundDurationInMinute: number;
  @type("number") currentRoundTimeRemaining: number;
  @type("number") roundStartTime: number;
  @type("string") currentGameState: BattleRoomCurrentState;
}
