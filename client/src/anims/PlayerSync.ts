// @ts-nocheck
import Phaser from "phaser";

// This function is used to set up the player's animations based on the input from the keyboard.
const SetupPlayerAnimsUpdate = (
  faune: Phaser.Physics.Arcade.Sprite,
  cursors: Phaser.Types.Input.Keyboard.CursorKeys,
) => {
  if (!cursors || !faune) return;

  const speed = 100;

  if (cursors.left?.isDown) {
    faune.anims.play("faune-walk-side", true);
    faune.setVelocity(-speed, 0);
    faune.scaleX = -1;
    faune.body.offset.x = 24;
  } else if (cursors.right?.isDown) {
    faune.anims.play("faune-walk-side", true);
    faune.setVelocity(speed, 0);
    faune.scaleX = 1;
    faune.body.offset.x = 8;
  } else if (cursors.up?.isDown) {
    faune.anims.play("faune-walk-up", true);
    faune.setVelocity(0, -speed);
  } else if (cursors.down?.isDown) {
    faune.anims.play("faune-walk-down", true);
    faune.setVelocity(0, speed);
  } else {
    if (faune.anims && faune.anims.currentAnim != null) {
      const parts = faune.anims.currentAnim.key.split("-");
      parts[1] = "idle"; //keep the direction
      faune.anims.play(parts.join("-"), true);
      faune.setVelocity(0, 0);
    }
  }
};

// Abstract all the steps needed to set up the player when the game starts.
const SetupPlayerOnCreate = (
  faune: Phaser.Physics.Arcade.Sprite,
  cameras: Phaser.Cameras.Scene2D.CameraManager,
) => {
  faune.body.setSize(faune.width * 0.5, faune.height * 0.8);

  faune.anims.play("faune-idle-down");

  cameras.main.startFollow(faune, true);
  cameras.main.centerOn(0, 0);
};

const SetUpPlayerSyncWithServer = (scene: Phaser.Scene) => {
  // Calculate the new position
  const velocity = 2; // Adjust as needed

  if (scene.cursors.left.isDown) {
    scene.faune.x -= velocity;
  } else if (scene.cursors.right.isDown) {
    scene.faune.x += velocity;
  } else if (scene.cursors.up.isDown) {
    scene.faune.y -= velocity;
  } else if (scene.cursors.down.isDown) {
    scene.faune.y += velocity;
  }

  // Send the new position to the server
  scene.room.send("move", { x: scene.faune.x, y: scene.faune.y });
};

export {
  SetupPlayerAnimsUpdate,
  SetupPlayerOnCreate,
  SetUpPlayerSyncWithServer,
};
