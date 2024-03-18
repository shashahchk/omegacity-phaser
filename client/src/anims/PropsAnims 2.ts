
export const createPropsAnims = (anims: Phaser.Animations.AnimationManager) => {
    anims.create({
      key: "blue-flag",
      frames: anims.generateFrameNames("blue-flag", {
        start: 0,
        end: 4,
        prefix: "blue-flag-",
      }),
      repeat: -1,
      frameRate: 15,
      duration: 2000,
    });

    anims.create({
        key: "red-flag",
        frames: anims.generateFrameNames("red-flag", {
            start: 0,
            end: 4,
            prefix: "red-flag-",
        }),
        repeat: -1,
        frameRate: 15,
        duration: 2000,
    })
}