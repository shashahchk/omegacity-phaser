// For creating different characters, including both players and monsters.
export enum HeroEnum {
    Hero1 = 'hero1',
    Hero2 = 'hero2',
    Hero3 = 'hero3',
}

export enum MonsterEnum {
    Monster1 = 'monster1',
    Golem1 = 'golem1',
    Golem2 = 'golem2',
    Grimlock = "grimlock",
}

export type serverInBattlePlayerType = {
    health: number;
    totalScore: number;
    totalQuestionIdsSolved: number[];
    roundScore: number;
    roundQuestionIdsSolved: number[];
    teamColor: string;
    username: string;
    sessionId: string;
    playerEXP: number;
    charName: HeroEnum | MonsterEnum;
}

export type serverTeamType = { 
    teamPlayers: string[];
    teamId: number;
    teamMatchScore: number;
    teamRoundScore: number;
    teamColor: string;
}