import { Physics } from "phaser";
import ClientInBattlePlayer from "./ClientInBattlePlayer";
import ClientInBattleMonster from "./ClientInBattleMonster";
import { HeroEnum, MonsterEnum } from "../../types/CharacterTypes";

export const createCharacter = (username: string | undefined, scene: Phaser.Scene, character: MonsterEnum | HeroEnum, x: number, y: number, playerEXP: number): ClientInBattlePlayer | ClientInBattleMonster | undefined => {
    var newCharacter: ClientInBattlePlayer | ClientInBattleMonster | undefined = undefined;

    switch (character) {
        //heroes
        case HeroEnum.Hero1:
            newCharacter = new ClientInBattlePlayer(scene, x, y, username, "hero", "hero1-walk-down-0", "hero1", playerEXP);
            break;
        case HeroEnum.Hero2:
            newCharacter = new ClientInBattlePlayer(scene, x, y, username, "hero", "hero2-walk-down-0", "hero2", playerEXP);
            break;
        case HeroEnum.Hero3:
            newCharacter = new ClientInBattlePlayer(scene, x, y, username, "hero", "hero3-walk-down-0", "hero3", playerEXP);
            break;
        //monsters
        case MonsterEnum.Monster1:
            // console.log("creating monster1");
            newCharacter = new ClientInBattleMonster(scene, x, y, "dragon", "dragon-0"); //doesn't need charname as no anims
            break;
        case MonsterEnum.Grimlock:
            newCharacter = new ClientInBattleMonster(scene, x, y, "grimlock", "grimlock-idle-0");
            newCharacter.setScale(2);
            break;
        case MonsterEnum.Golem1:
            newCharacter = new ClientInBattleMonster(scene, x, y, "golem1", "golem1-idle-0");
            newCharacter.anims.play("golem1-idle");
            break;
        case MonsterEnum.Golem2:
            newCharacter = new ClientInBattleMonster(scene, x, y, "golem2", "golem2-idle-0");
            newCharacter.anims.play("golem2-idle");
            break;
    }

    return newCharacter;
}