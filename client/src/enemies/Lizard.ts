import Phaser from "phaser";

enum Direction {
  UP,
  DOWN,
  LEFT,
  RIGHT,
}

const randomDirection = (exclude: Direction) => {
  let newDirection = Phaser.Math.Between(0, 3);
  while (newDirection === exclude) {
    newDirection = Phaser.Math.Between(0, 3);
  }

  return newDirection;
};
export default class Lizard extends Phaser.Physics.Arcade.Sprite {
  private moveEvent: Phaser.Time.TimerEvent;
  private direction = Direction.RIGHT;
  constructor(
    scene: Phaser.Scene,
    x: number,
    y: number,
    texture: string,
    frame?: string | number
  ) {
    super(scene, x, y, texture, frame);

    this.anims.play("lizard-idle");

    scene.physics.world.on(
      Phaser.Physics.Arcade.Events.TILE_COLLIDE,
      this.handleTileCollision,
      this
    );

    this.moveEvent = scene.time.addEvent({
      delay: 2000,
      callback: () => {
        this.direction = randomDirection(this.direction);
      },
      loop: true,
    });
  }

  destroy(fromScene?: boolean | undefined): void {
    this.moveEvent.destroy();
    super.destroy(fromScene);
  }

  private handleTileCollision(
    gameObject: Phaser.GameObjects.GameObject,
    tile: Phaser.Tilemaps.Tile
  ) {
    if (gameObject !== this) {
      return;
    }

    this.direction = randomDirection(this.direction);
  }

  // The preUpdate method, on the other hand, is called before the update method. It's often used for logic that needs to run before the main game update, such as preparing data or updating the state of game objects.
  // In your Lizard class, the preUpdate method is used to update the lizard's velocity based on its direction. This is done in preUpdate rather than update because it needs to happen before any other game logic that might depend on the lizard's position or velocity.
  //
  protected preUpdate(time: number, delta: number): void {
    super.preUpdate(time, delta);

    const speed = 10;

    switch (this.direction) {
      case Direction.UP:
        this.setVelocity(0, -speed);
        break;
      case Direction.DOWN:
        this.setVelocity(0, speed);
        break;
      case Direction.LEFT:
        this.setVelocity(-speed, 0);
        break;
      case Direction.RIGHT:
        this.setVelocity(speed, 0);
        break;
    }
  }
}
