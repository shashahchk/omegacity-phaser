import {
  Schema,
  Context,
  type,
  MapSchema,
  ArraySchema,
} from "@colyseus/schema";
import { Monster, Player } from "./Character";

export class GameRoomState extends Schema {
  @type({ map: Player }) players = new MapSchema<Player>();
}
