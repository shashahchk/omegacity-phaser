import {
  Schema,
  Context,
  type,
  MapSchema,
  ArraySchema,
} from "@colyseus/schema";

export enum TeamColor {
  RED = "red",
  BLUE = "blue",
}

export class BattleTeam extends Schema {
  // @type({ map: InBattlePlayer }) teamPlayers = new MapSchema<InBattlePlayer>();
  @type(["string"]) teamPlayers = new ArraySchema<string>();
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
