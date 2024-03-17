import {
  Schema,
  Context,
  type,
  MapSchema,
  ArraySchema,
} from "@colyseus/schema";
import { Player } from "./Character";


export class GameRoomState extends Schema {
  @type({ map: Player }) players = new MapSchema<Player>();
}
