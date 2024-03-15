// @ts-nocheck
import Phaser from "phaser";
import ClientInBattlePlayer from "~/character/ClientInBattlePlayer";

// This function is used to set up the player's animations based on the input from the keyboard.
// const updateInBattlePlayerAnims = (
//   faune: Phaser.Physics.Arcade.Sprite,
//   cursors: Phaser.Types.Input.Keyboard.CursorKeys,
// ) => {
//   if (!cursors || !faune) return;

//   const speed = 100;

//   if (cursors.left?.isDown) {
//     faune.anims.play("faune-walk-side", true);
//     faune.setVelocity(-speed, 0);
//     faune.flipX = true;
//   } else if (cursors.right?.isDown) {
//     faune.anims.play("faune-walk-side", true);
//     faune.setVelocity(speed, 0);
//     faune.flipX = false;
//   } else if (cursors.up?.isDown) {
//     faune.anims.play("faune-walk-up", true);
//     faune.setVelocity(0, -speed);
//   } else if (cursors.down?.isDown) {
//     faune.anims.play("faune-walk-down", true);
//     faune.setVelocity(0, speed);
//   } else {
//     if (faune.anims && faune.anims.currentAnim != null) {
//       const parts = faune.anims.currentAnim.key.split("-");
//       parts[1] = "idle"; //keep the direction

//       if (parts.every((part) => part !== undefined)) {
//         faune.anims.play(parts.join("-"), true);
//       }
//       faune.setVelocity(0, 0);
//     }
//   }
// };


const setCamera = (
  faune: Phaser.Physics.Arcade.Sprite,
  cameras: Phaser.Cameras.Scene2D.CameraManager,
) => {
  cameras.main.startFollow(faune, true);
  cameras.main.centerOn(0, 0);
};

const syncInBattlePlayerWithServer = (scene: Phaser.Scene) => {
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

const setUpInBattlePlayerListeners = (scene: Phaser.Scene) => {
  // Listen for new players, updates, removal, and leaving.
  scene.room.state.players.onAdd((player, sessionId) => {
    console.log("new player joined!", sessionId);
    var entity;

    if (sessionId !== scene.room.sessionId) {
      entity = new ClientInBattlePlayer(scene, player.x, player.y, "faune", "walk-down-3.png")
    } else {
      entity = scene.faune;
    }

    // keep a reference of it on `playerEntities`
    scene.playerEntities[sessionId] = entity;

    // listening for server updates
    player.onChange(() => {

      if (!entity) return;
      console.log(player);
      entity.updateHealthWithServerInfo(player);
      entity.updateAnimsWithServerInfo(player);
    });
  });

  scene.room.state.players.onRemove((player, sessionId) => {
    console.log('onRemove event triggered', sessionId);
    // console.log('playerEntities', scene.playerEntities);

    const entity = scene.playerEntities[sessionId];
    console.log('entity', entity);
    if (entity) {
      // destroy entity
      entity.destroy();

      // clear local reference
      delete scene.playerEntities[sessionId];
    }
  });
}

export {
  // updateInBattlePlayerAnims,
  setCamera,
  syncInBattlePlayerWithServer,
  setUpInBattlePlayerListeners
};
