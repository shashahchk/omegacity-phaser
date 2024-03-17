// @ts-nocheck
import Phaser from "phaser";
import ClientInBattlePlayer from "~/character/ClientInBattlePlayer";

const setCamera = (
  faune: Phaser.Physics.Arcade.Sprite,
  cameras: Phaser.Cameras.Scene2D.CameraManager,
) => {
  cameras.main.startFollow(faune, true);
  cameras.main.centerOn(0, 0);
};

const setUpInBattlePlayerListeners = (scene: Phaser.Scene) => {
  // Listen for new players, updates, removal, and leaving.
  scene.room.state.players.onAdd((player, sessionId) => {
    console.log("new player joined!", sessionId);
    var entity;

    if (sessionId !== scene.room.sessionId) {
      entity = new ClientInBattlePlayer(
        scene,
        player.x,
        player.y,
        player.username,
        "faune",
        "walk-down-3.png",
        "faune",
      );
      // keep a reference of it on `playerEntities`
      scene.playerEntities[sessionId] = entity;
    } else {
      entity = scene.faune;
    }

    // listening for server updates
    player.onChange(() => {
      if (!entity) return;

      entity.updateHealthWithServerInfo(player);
      entity.updateAnimsWithServerInfo(player);
    });
  });

  scene.room.state.players.onRemove((player, sessionId) => {
    console.log("onRemove event triggered", sessionId);
    // console.log('playerEntities', scene.playerEntities);

    const entity = scene.playerEntities[sessionId];
    console.log("entity", entity);
    if (entity) {
      // destroy entity
      entity.destroy();

      // clear local reference
      delete scene.playerEntities[sessionId];
    }
  });
};

export {
  // updateInBattlePlayerAnimsAndSyncWithServer,
  setCamera,
  setUpInBattlePlayerListeners,
};
