import Phaser from "phaser";

const createFauneAnims = (anims: Phaser.Animations.AnimationManager) => {
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
};

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

const createMonsterAnims = (anims: Phaser.Animations.AnimationManager) => {
  anims.create({
    key: "grimlock-idle",
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
    key: "golem1-idle",
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
    key: "golem2-idle",
    frames: anims.generateFrameNames("golem2", {
      start: 0,
      end: 7,
      prefix: "golem2-idle-",
    }),
    repeat: -1,
    frameRate: 15,
    duration: 2000,
  });

  //die animations
  anims.create({
    key: "golem1-die",
    frames: anims.generateFrameNames("golem1-die", {
      start: 0,
      end: 11,
      prefix: "golem1-die-",
    }),
    frameRate: 10,
  });
};

const createCharacterAnims = (anims: Phaser.Animations.AnimationManager) => {
  createFauneAnims(anims);
  createHeroAnims(anims);
  createMonsterAnims(anims);
};

export { createCharacterAnims };
