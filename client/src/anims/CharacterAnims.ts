import Phaser from "phaser";
const createFauneAnims = (anims: Phaser.Animations.AnimationManager) => {
  //genereate an rray of all the frames automatically instead of writing out manually.
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
    frames: [{ key: "faune", frame: "walk-down-3.png" }],
  });

  anims.create({
    key: "faune-idle-side",
    frames: [{ key: "faune", frame: "walk-side-3.png" }],
  });

  anims.create({
    key: "faune-idle-down",
    frames: [{ key: "faune", frame: "walk-down-3.png" }],
  });
}

const createHeroAnims = (anims: Phaser.Animations.AnimationManager) => {
  for (let heroId = 1; heroId <= 3; heroId++) {
    //initiate idle
    anims.create({
      key: `hero${heroId}-idle-up`,
      frames: [{ key: "hero", frame: `hero${heroId}-walk-up-0` }],
    });

    anims.create({
      key: `hero${heroId}-idle-down`,
      frames: [{ key: "hero", frame: `hero${heroId}-walk-down-0` }],
    });


    anims.create({
      key: `hero${heroId}-idle-side`,
      frames: [{ key: "hero", frame: `hero${heroId}-walk-left-0` }],
    });


    anims.create({
      key: `hero${heroId}-walk-down`,
      frames: anims.generateFrameNames("hero", {
        start: 0,
        end: 2,
        prefix: `hero${heroId}-walk-down-`,
      }),
      repeat: -1,
      frameRate: 10, // Reduced frameRate to slow down the animation
      duration: 2000,
    });

    anims.create({
      key: `hero${heroId}-walk-up`,
      frames: anims.generateFrameNames("hero", {
        start: 0,
        end: 2,
        prefix: `hero${heroId}-walk-up-`,
      }),
      repeat: -1,
      frameRate: 10, // Reduced frameRate to slow down the animation
      duration: 2000,
    });

    anims.create({
      key: `hero${heroId}-walk-side`,
      frames: anims.generateFrameNames("hero", {
        start: 0,
        end: 2,
        prefix: `hero${heroId}-walk-right-`,
      }),
      repeat: -1,
      frameRate: 10, // Reduced frameRate to slow down the animation
      duration: 2000,
    });
  }
};

const createCharacterAnims = (anims: Phaser.Animations.AnimationManager) => {
  createFauneAnims(anims);
  createHeroAnims(anims);

};

export { createCharacterAnims };
