import Phaser from "phaser";
const createFauneAnims = (anims: Phaser.Animations.AnimationManager) => {
  anims.create({
    key: "faune-idle-down",
    frames: [{ key: "faune", frame: "walk-down-3.png" }],
  });

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
    frames: [{ key: "faune", frame: "walk-up-3.png" }],
  });

  anims.create({
    key: "faune-idle-up",
    frames: [{ key: "faune", frame: "walk-down-3.png" }],
  });

  anims.create({
    key: "faune-idle-side",
    frames: [{ key: "faune", frame: "walk-side-3.png" }],
  });
}

const createHeroAnims = (anims: Phaser.Animations.AnimationManager) => {
  for (let heroId = 1; heroId <= 3; ++heroId) {
    anims.create({
      key: `hero${heroId}-idle-down`,
      frames: [{ key: "hero", frame: `hero${heroId}-walk-down-0.png` }],
    });

    anims.create({
      key: `hero${heroId}-walk-down`,
      frames: anims.generateFrameNames("hero", {
        start: 1,
        end: 2,
        prefix: "walk-down-",
        suffix: ".png",
      }),
      repeat: -1,
      frameRate: 15, //animation frame rate, not the game's
      duration: 2000, //animation duration
    })

    anims.create({
      key: `hero${heroId}-walk-up`,
      frames: anims.generateFrameNames("hero", {
        start: 1,
        end: 2,
        prefix: "walk-up-",
        suffix: ".png",
      }),
      repeat: -1,
      frameRate: 15, //animation frame rate, not the game's
      duration: 2000, //animation duration
    })

    anims.create({
      key: `hero${heroId}-walk-left`,
      frames: anims.generateFrameNames("hero", {
        start: 1,
        end: 2,
        prefix: "walk-left-",
        suffix: ".png",
      }),
      repeat: -1,
      frameRate: 15, //animation frame rate, not the game's
      duration: 2000, //animation duration
    })

    anims.create({
      key: `hero${heroId}-walk-right`,
      frames: anims.generateFrameNames("hero", {
        start: 1,
        end: 2,
        prefix: "walk-right-",
        suffix: ".png",
      }),
      repeat: -1,
      frameRate: 15, //animation frame rate, not the game's
      duration: 2000, //animation duration
    })
  }
}

const createCharacterAnims = (anims: Phaser.Animations.AnimationManager) => {
  createFauneAnims(anims);
  createHeroAnims(anims);

};

export { createCharacterAnims };
