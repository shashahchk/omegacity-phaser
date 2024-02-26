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
