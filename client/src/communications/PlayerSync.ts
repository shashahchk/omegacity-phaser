// @ts-nocheck
import Phaser from "phaser";
import ClientPlayer from "~/character/ClientPlayer";

// // This function is used to set up the player's animations based on the input from the keyboard.
// const updatePlayerAnimsAndSyncWithServer = (
//   faune: ClientPlayer,
//   cursors: Phaser.Types.Input.Keyboard.CursorKeys,
// ) => {
//   if (!cursors || !faune) return;

//   const speed = 100;

//   if (cursors.left?.isDown) {
//     faune.anims.play("hero1-walk-side", true);
//     faune.setVelocity(-speed, 0);
//     faune.flipX = true;
//   } else if (cursors.right?.isDown) {
//     faune.anims.play("hero1-walk-side", true);
//     faune.setVelocity(speed, 0);
//     faune.flipX = false;
//   } else if (cursors.up?.isDown) {
//     faune.anims.play("hero1-walk-up", true);
//     faune.setVelocity(0, -speed);
//   } else if (cursors.down?.isDown) {
//     faune.anims.play("hero1-walk-down", true);
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

//   if (cursors.left?.isDown || cursors.right?.isDown || cursors.up?.isDown || cursors.down?.isDown) {
//       scene.room.send("move", {
//         x: scene.faune.x,
//         y: scene.faune.y,
//         direction: scene.faune.direction,
//       });
//   }
// };

// Abstract all the steps needed to set up the player when the game starts.
const setCamera = (
  faune: Phaser.Physics.Arcade.Sprite,
  cameras: Phaser.Cameras.Scene2D.CameraManager,
) => {

  cameras.main.startFollow(faune, true);
  cameras.main.centerOn(0, 0);
};

// const syncPlayerWithServer = (scene: Phaser.Scene) => {
//   // Calculate the new position
//   const velocity = 2; // Adjust as needed
//   var isMoved = false;
//   if (scene.cursors.left.isDown) {
//     scene.faune.x -= velocity;
//     scene.faune.direction = "left";
//     isMoved = true;
//   } else if (scene.cursors.right.isDown) {
//     scene.faune.x += velocity;
//     scene.faune.direction = "right";
//     isMoved = true;
//   } else if (scene.cursors.up.isDown) {
//     scene.faune.y -= velocity;
//     scene.faune.direction = "up";
//     isMoved = true;
//   } else if (scene.cursors.down.isDown) {
//     scene.faune.y += velocity;
//     scene.faune.direction = "down";
//     isMoved = true;
//   }  // Send the new position to the server
//   if (isMoved) {
//     scene.room.send("move", {
//       x: scene.faune.x,
//       y: scene.faune.y,
//       direction: scene.faune.direction,
//     });
//   }
// };

const setUpPlayerListeners = (scene: Phaser.Scene) => {
  // Listen for new players, updates, removal, and leaving.
  scene.room.state.players.onAdd((player, sessionId) => {
    console.log("new player joined!", sessionId);
    var entity;
    var char_name = player.char_name;
    var username = player.username;
    var playerEXP = player.playerEXP;
    if (char_name === undefined) {
      console.log("char_name is undefined")
      char_name = "hero1";
    }

    if (playerEXP === undefined) {
      console.log("playerEXP is undefined")
      playerEXP = 0;
    }

    if (sessionId !== scene.room.sessionId) {
      entity = new ClientPlayer(scene, player.x, player.y, username, "hero", `${char_name}-walk-down-1`, char_name, playerEXP)

      scene.playerEntities[sessionId] = entity;
    } else {
      entity = scene.faune;
    }

    // listening for server updates
    player.onChange(() => {
      if (!entity) return;
      console.log(player);
      
      if (sessionId != scene.room.sessionId) {
        entity.updateAnimsWithServerInfo(player);
      }
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
  // updatePlayerAnimsAndSyncWithServer,
  setCamera,
  setUpPlayerListeners
};
