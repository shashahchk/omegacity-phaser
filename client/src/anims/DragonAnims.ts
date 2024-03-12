import Phaser from "phaser";

const createDragonAnims = (anims: Phaser.Animations.AnimationManager) => {
    anims.create({
      key: "dragon-idle-down",
      frames: [{ key: "dragon", frame: "dragon_0.png" }],
    });
}
  
export { createDragonAnims };
