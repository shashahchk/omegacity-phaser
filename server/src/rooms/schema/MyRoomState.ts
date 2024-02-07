import { Schema, Context, type, MapSchema } from "@colyseus/schema";


export class Player extends Schema {

}

export class MyRoomState extends Schema {
  @type({ map: Player }) players = new MapSchema<Player>();
  @type("string") mySynchronizedProperty: string = "Hello world";

}
