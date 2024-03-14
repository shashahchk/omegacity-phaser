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
    faune.flipX = true;
  } else if (cursors.right?.isDown) {
    faune.anims.play("faune-walk-side", true);
    faune.setVelocity(speed, 0);
    faune.flipX = false;
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
    scene.faune.direction = "left";
  } else if (scene.cursors.right.isDown) {
    scene.faune.x += velocity;
    scene.faune.direction = "right";
  } else if (scene.cursors.up.isDown) {
    scene.faune.y -= velocity;
    scene.faune.direction = "up";
  } else if (scene.cursors.down.isDown) {
    scene.faune.y += velocity;
    scene.faune.direction = "down";
  }  // Send the new position to the server
  scene.room.send("move", { x: scene.faune.x, y: scene.faune.y, direction: scene.faune.direction });
};

const SetUpPlayerListeners = (scene: Phaser.Scene) => {
  // Listen for new players, updates, removal, and leaving.
  scene.room.state.players.onAdd((player, sessionId) => {
    console.log("new player joined!", sessionId);
    var entity;

    if (sessionId !== scene.room.sessionId) {
      entity = scene.physics.add.sprite(
        player.x,
        player.y,
        "faune",
        "faune-idle-down",
      );
    } else {
      entity = this.faune;
    }

    // keep a reference of it on `playerEntities`
    scene.playerEntities[sessionId] = entity;

    // listening for server updates
    player.onChange(() => {

      if (!entity) return;
      console.log(player);
      // Update local position immediately
      entity.x = player.x;
      entity.y = player.y;

      // Assuming entity is a Phaser.Physics.Arcade.Sprite and player.pos is 'left', 'right', 'up', or 'down'
      const direction = player.direction; // This would come from your server update
      var animsDir;
      var animsState;

      switch (direction) {
        case "left":
          animsDir = "side";
          entity.flipX = true; // Assuming the side animation faces right by default
          break;
        case "right":
          animsDir = "side";
          entity.flipX = false;
          break;
        case "up":
          animsDir = "up";
          break;
        case "down":
          animsDir = "down";
          break;
      }

      if (player.isMoving) {
        animsState = "walk";
      } else {
        animsState = "idle";
      }
      entity.anims.play("faune-" + animsState + "-" + animsDir, true);
    });
  });

  scene.room.state.players.onRemove((player, sessionId) => {
    const entity = scene.playerEntities[sessionId];
    if (entity) {
      // destroy entity
      entity.destroy();

      // clear local reference
      delete scene.playerEntities[sessionId];
    }
  });
}

export {
  SetUpPlayerListeners, SetUpPlayerSyncWithServer, SetupPlayerAnimsUpdate,
  SetupPlayerOnCreate
};

