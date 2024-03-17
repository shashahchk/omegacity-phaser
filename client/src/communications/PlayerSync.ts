// @ts-nocheck
import Phaser from "phaser";
import ClientPlayer from "~/character/ClientPlayer";

// Abstract all the steps needed to set up the player when the game starts.
const setCamera = (
  faune: Phaser.Physics.Arcade.Sprite,
  cameras: Phaser.Cameras.Scene2D.CameraManager,
) => {

    cameras.main.startFollow(faune, true);
    cameras.main.centerOn(0, 0);
  };

const setUpPlayerListeners = (scene: Phaser.Scene) => {
  // Listen for new players, updates, removal, and leaving.
  scene.room.state.players.onAdd((player, sessionId) => {
    console.log("new player joined!", sessionId);
    var entity;
    var char_name = player.char_name;
    var username = player.username;

    if (char_name === undefined) {
      console.log("char_name is undefined")
      char_name = "hero1";
    }

    if (sessionId !== scene.room.sessionId) {
      entity = new ClientPlayer(scene, player.x, player.y, username, "hero", `${char_name}-walk-down-1`, char_name)
      
      scene.playerEntities[sessionId] = entity;
    } else {
      entity = scene.faune;
    }

    // listening for server updates
    player.onChange(() => {
      if (!entity) return;
      
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
  setCamera,
  setUpPlayerListeners
};
