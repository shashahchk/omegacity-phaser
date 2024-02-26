import {
  Schema,
  Context,
  type,
  MapSchema,
  ArraySchema,
} from "@colyseus/schema";
import { Monster, InBattlePlayer } from "./Character";

export class BattleTeam extends Schema {
  @type({ map: InBattlePlayer }) teamPlayers = new MapSchema<InBattlePlayer>();
  @type("number") teamId: number;
  @type("string") teamColor: string;
}
