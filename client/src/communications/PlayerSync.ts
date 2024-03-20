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
    // console.log("new player joined!", sessionId);
    var entity;
    var charName = player.charName;
    var username = player.username;
    var playerEXP = player.playerEXP;
    if (charName === undefined) {
      console.log("charName is undefined")
      charName = "hero1";
    }

    if (playerEXP === undefined) {
      console.log("playerEXP is undefined")
      playerEXP = 0;
    }

    if (sessionId !== scene.room.sessionId) {
      entity = new ClientPlayer(scene, player.x, player.y, username, "hero", `${charName}-walk-down-1`, charName, playerEXP)

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
