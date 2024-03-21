import { TeamColorEnum } from "../../types/TeamColorType";

//add at a particular location
//make a method to return the flag image
export const Flag = (scene: Phaser.Scene, teamColor: TeamColorEnum, x: number, y: number) => {
  return (
    scene.add.image(x, y, `flag-${teamColor}`)
  );
};
