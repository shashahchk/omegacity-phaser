import Phaser from "phaser";

export default class GameUi extends Phaser.Scene {
  constructor() {
    super({ key: "game-ui" }); //can handle both object and string
  }

  create() {
    const hearts = this.add.group({
      classType: Phaser.GameObjects.Image,
    });

    hearts.createMultiple({
      key: "ui-heart-full",
      setXY: {
        x: 10,
        y: 10,
        stepX: 16,
      },
      quantity: 3,
    });
  }
}
