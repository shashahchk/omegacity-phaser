import {
  Schema,
  Context,
  type,
  MapSchema,
  ArraySchema,
} from "@colyseus/schema";
import { Monster, InBattlePlayer } from "./Character";

export enum TeamColor {
  Red = "red",
  Blue = "blue",
}

export class BattleTeam extends Schema {
  @type({ map: InBattlePlayer }) teamPlayers = new MapSchema<InBattlePlayer>();
  @type("number") teamId: number;
  @type("number") teamMatchScore: number;
  @type("number") teamRoundScore: number;
  @type("string") teamColor: TeamColor;

  constructor(color: TeamColor, id: number) {
    super();
    this.teamId = id;
    this.teamColor = color;
    this.teamMatchScore = 0;
    this.teamRoundScore = 0;
  }
  
}
