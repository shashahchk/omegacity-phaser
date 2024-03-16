import { Physics } from "phaser";
import ClientInBattlePlayer from "./ClientInBattlePlayer";
import ClientInBattleMonster from "./ClientInBattleMonster";

// For creating different characters, including both players and monsters.
export enum Hero {
    Hero1 = 'hero1',
    Hero2 = 'hero2',
    Hero3 = 'hero3',
    Hero4 = 'hero4',
}

export enum Monster {
    Monster1 = 'monster1',
    Golem1 = 'golem1',
    Golem2 = 'golem2',
    Grimlock = "grimlock",
}

export const createCharacter = (scene:Phaser.Scene, character: Monster | Hero, x:number, y:number): ClientInBattlePlayer | ClientInBattleMonster | undefined  => {
    var newCharacter: ClientInBattlePlayer | ClientInBattleMonster | undefined = undefined;

    switch (character) {
        //heroes
        case Hero.Hero1:
            newCharacter = new ClientInBattlePlayer(scene, x, y, "hero", "hero1-walk-down-0", "hero1");
            break;
        case Hero.Hero2:
            newCharacter = new ClientInBattlePlayer(scene, x, y, "hero", "hero2-walk-down-0", "hero2");
            break;
        case Hero.Hero3:
            newCharacter = new ClientInBattlePlayer(scene, x, y, "hero", "hero3-walk-down-0", "hero3");
            break;
        case Hero.Hero4:
            newCharacter = new ClientInBattlePlayer(scene, x, y, "hero", "hero4-walk-down-0", "hero4");
            break;
        //monsters
        case Monster.Monster1:
            console.log("creating monster1");
            newCharacter = new ClientInBattleMonster(scene, x, y, "dragon", "dragon-0"); //doesn't need charname as no anims
            break;
        case Monster.Grimlock:
            newCharacter = new ClientInBattleMonster(scene, x, y, "grimlock", "grimlock-idle-0");
            newCharacter.setScale(2);
            break;
        case Monster.Golem1:
            newCharacter = new ClientInBattleMonster(scene, x, y, "golem1", "golem1-idle-0");
            newCharacter.anims.play("golem1-idle");
            break;
        case Monster.Golem2:
            newCharacter = new ClientInBattleMonster(scene, x, y, "golem2", "golem2-idle-0");
            newCharacter.anims.play("golem2-idle");
            break;
    }

return newCharacter;
}