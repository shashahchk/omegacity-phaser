// @ts-nocheck
import Phaser from "phaser";
import ClientPlayer from "~/character/ClientPlayer";

// This function is used to set up the player's animations based on the input from the keyboard.
const updatePlayerAnims = (
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

      if (parts.every((part) => part !== undefined)) {
        faune.anims.play(parts.join("-"), true);
      }
      faune.setVelocity(0, 0);
    }
  }
};

// Abstract all the steps needed to set up the player when the game starts.
const setUpPlayerOnCreate = (
  faune: Phaser.Physics.Arcade.Sprite,
  cameras: Phaser.Cameras.Scene2D.CameraManager,
) => {
  faune.body.setSize(faune.width * 0.5, faune.height * 0.8);

  faune.anims.play("faune-idle-down");

  cameras.main.startFollow(faune, true);
  cameras.main.centerOn(0, 0);
};

const syncPlayerWithServer = (scene: Phaser.Scene) => {
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

const setUpPlayerListeners = (scene: Phaser.Scene) => {
  // Listen for new players, updates, removal, and leaving.
  scene.room.state.players.onAdd((player, sessionId) => {
    console.log("new player joined!", sessionId, player.username);
    var entity;

    if (sessionId !== scene.room.sessionId) {
      entity = new ClientPlayer(scene, player.x, player.y, "faune", "idle-down")
      console.log(player.username + " in playery sync");
      entity.setUsername(player.username);
    } else {
      entity = this.faune;
    }

    console.log(player.username);
    let usernameLabel = scene.add.text(entity.x, entity.y - 20, player.username || '', {
      fontFamily: '"Press Start 2P", cursive',
      fontSize: "10px",
      color: "#ffffff",
    }).setOrigin(0.5);

    scene.playerEntities[sessionId] = { sprite: entity, usernameLabel: usernameLabel };
    // listening for server updates
    player.onChange(() => {

      if (!entity) return;
      console.log(player);
      // Update local position immediately
      // Assuming entity is a Phaser.Physics.Arcade.Sprite and player.pos is 'left', 'right', 'up', or 'down'

      entity.updateAnimsWithServerInfo(player);
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
  updatePlayerAnims,
  setUpPlayerOnCreate,
  syncPlayerWithServer,
  setUpPlayerListeners
};
