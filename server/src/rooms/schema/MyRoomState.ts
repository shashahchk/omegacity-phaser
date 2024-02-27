import { Schema, Context, type, MapSchema } from "@colyseus/schema";


export class Player extends Schema {
  @type("number") x: number;
  @type("number") y: number;
  @type("string") pos: string;
  @type("string") lastMovedTime: string;
  @type("boolean") isMoving: boolean;
  @type("string") userName: string;
}

export class MyRoomState extends Schema {
  @type({ map: Player }) players = new MapSchema<Player>();
}
