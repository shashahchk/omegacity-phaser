import Phaser from "phaser";
export default class Dragon extends Phaser.Physics.Arcade.Sprite {
  constructor(
    scene: Phaser.Scene,
    x: number,
    y: number,
    texture: string,
    frame?: string | number
  ) {
    super(scene, x, y, texture, frame);

    this.anims.play("dragon-idle-down");
  }

  destroy(fromScene?: boolean | undefined): void {
    super.destroy(fromScene);
  }
}
