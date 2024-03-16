import {
  Schema,
  Context,
  type,
  MapSchema,
  ArraySchema,
} from "@colyseus/schema";
import { BattleTeam } from "./Group";
import { MyRoomState } from "./MyRoomState";
import { InBattlePlayer, Monster } from "./Character";

export enum GameState {
  Waiting = 'waiting',
}

export class BattleRoomState extends MyRoomState {
  @type([BattleTeam]) teams = new ArraySchema<BattleTeam>();
  //questionId to monster
  @type({ map: Monster }) monsters = new MapSchema<Monster>();
  @type("number") totalRounds: number;
  @type("number") currentRound: number;
  @type("number") roundDurationInMinute: number;
  @type("number") currentRoundTimeRemaining: number;
  @type("number") roundStartTime: number;
  @type("string") currentGameState: GameState;
}
