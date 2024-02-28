import {
  Schema,
  Context,
  type,
  MapSchema,
  ArraySchema,
} from "@colyseus/schema";
import { Monster, InBattlePlayer } from "./Character";

export enum TeamColor {
  Red = 'red',
  Blue = 'blue'
}

export class BattleTeam extends Schema {
  @type({ map: InBattlePlayer }) teamPlayers = new MapSchema<InBattlePlayer>();
  @type("number") teamId: number;
  @type("string") teamColor: TeamColor;

  constructor(color: TeamColor) {
    super();
    this.teamColor = color;
  }
}
