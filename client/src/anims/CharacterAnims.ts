import Phaser from "phaser";
import { Monster } from "~/character/Character";

const createCharacterAnims = (anims: Phaser.Animations.AnimationManager) => {
  //generate an array of all the frames automatically instead of writing out manually.
  anims.create({
    key: "faune-walk-down",
    frames: anims.generateFrameNames("faune", {
      start: 1,
      end: 8,
      prefix: "walk-down-",
      suffix: ".png",
    }),
    repeat: -1,
    frameRate: 15, //animation frame rate, not the game's
    duration: 2000, //animation duration
  });

  anims.create({
    key: "faune-walk-up",
    frames: anims.generateFrameNames("faune", {
      start: 1,
      end: 8,
      prefix: "walk-up-",
      suffix: ".png",
    }),
    repeat: -1,
    frameRate: 15, //animation frame rate, not the game's
    duration: 2000, //animation duration
  });

  anims.create({
    key: "faune-walk-side",
    frames: anims.generateFrameNames("faune", {
      start: 1,
      end: 8,
      prefix: "walk-side-",
      suffix: ".png",
    }),
    repeat: -1,
    frameRate: 15, //animation frame rate, not the game's
    duration: 2000, //animation duration
  });

  //initiate idle
  anims.create({
    key: "faune-idle-up",
    frames: [{ key: "faune", frame: "walk-up-3.png" }],
  });

  anims.create({
    key: "faune-idle-down",
    frames: [{ key: "faune", frame: "walk-down-3.png" }],
  });

  anims.create({
    key: "faune-idle-side",
    frames: [{ key: "faune", frame: "walk-side-3.png" }],
  });

  anims.create({
      key: 'grimlock-idle',
      frames: anims.generateFrameNames("grimlock", {
          start: 0,
          end: 3,
          prefix: "grimlock-idle-",
      }),
      repeat: -1,
      frameRate: 15,
      duration: 2000,
  });

  anims.create({
    key: 'golem1-idle',
    frames: anims.generateFrameNames("golem1", {
        start: 0,
        end: 7,
        prefix: "golem1-idle-",
    }),
    repeat: -1,
    frameRate: 15,
    duration: 2000,
  });

  anims.create({
    key: 'golem2-idle',
    frames: anims.generateFrameNames("golem2", {
        start: 0,
        end: 7,
        prefix: "golem2-idle-",
    }),
    repeat: -1,
    frameRate: 15,
    duration: 2000,
  });
}

export { createCharacterAnims };
