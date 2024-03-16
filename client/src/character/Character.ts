import { Physics } from "phaser";
import ClientInBattlePlayer from "./ClientInBattlePlayer";
import ClientInBattleMonster from "./ClientInBattleMonster";

// For creating different characters, including both players and monsters.
export enum Character {
    Hero1 = 'hero1',
    Hero2 = 'hero2',
    Hero3 = 'hero3',
    Hero4 = 'hero4',
    Monster1 = 'monster1',
}


export const createCharacter = (scene:Phaser.Scene, character: Character, x:number, y:number): ClientInBattlePlayer | ClientInBattleMonster | undefined  => {
    var newCharacter: ClientInBattlePlayer | ClientInBattleMonster | undefined = undefined;

    switch (character) {
        //heroes
        case Character.Hero1:
            newCharacter = new ClientInBattlePlayer(scene, x, y, "hero", "hero1-walk-down-0", "hero1");
            break;
        case Character.Hero2:
            newCharacter = new ClientInBattlePlayer(scene, x, y, "hero", "hero2-walk-down-0", "hero2");
            break;
        case Character.Hero3:
            newCharacter = new ClientInBattlePlayer(scene, x, y, "hero", "hero3-walk-down-0", "hero3");
            break;
        case Character.Hero4:
            newCharacter = new ClientInBattlePlayer(scene, x, y, "hero", "hero4-walk-down-0", "hero4");
            break;
        //monsters
        case Character.Monster1:
            console.log("creating monster1");
            newCharacter = new ClientInBattleMonster(scene, x, y, "dragon", "dragon-0"); //doesn't need charname as no anims
            break;
    }

    return newCharacter;
}