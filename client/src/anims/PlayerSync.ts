// @ts-nocheck
import Phaser from "phaser";
import ClientInBattlePlayer from "../characters/ClientInBattlePlayer";
import ClientPlayer from "~/characters/ClientPlayer";

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
const SetCameraOnCreate = (
  faune: ClientPlayer,
  cameras: Phaser.Cameras.Scene2D.CameraManager,
) => {

  cameras.main.startFollow(faune, true);
  cameras.main.centerOn(0, 0);
};


const SetUpPlayerListeners = (scene: Phaser.Scene) => {
  // Listen for new players, updates, removal, and leaving.
  scene.room.state.players.onAdd((player, sessionId) => {
    console.log("new player joined!", sessionId);
    var clientPlayer;

    if (sessionId !== scene.room.sessionId) {
      //if not the current player, create a new sprite, otherwise, don't create duplicate sprite
      clientPlayer = new ClientInBattlePlayer(scene, player.x, player.y, "faune", "idle-down")
    } else {
      clientPlayer = this.faune;
    }

    // keep a reference of it on `playerEntities`
    scene.playerEntities[sessionId] = clientPlayer;

    // Use Promise.resolve to make the update asynchronous
    player.onChange(() => {
      if (!entity) return;
      console.log(player);
      // Update local position immediately
      entity.x = player.x;
      entity.y = player.y;

      // Assuming entity is a Phaser.Physics.Arcade.Sprite and player.pos is 'left', 'right', 'up', or 'down'
      const direction = player.direction; 
      entity.updatePositionAndAnims(direction, player.isMoving);
    })
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
  SetupPlayerAnimsUpdate,
  SetCameraOnCreate,
  SetUpPlayerListeners
};
