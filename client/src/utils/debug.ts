export function debugDraw(
  layer: Phaser.Tilemaps.TilemapLayer,
  scene: Phaser.Scene
) {
  const graphics = scene.add.graphics().setAlpha(0.7);
  layer.renderDebug(graphics, {
    tileColor: null, // Color of non-colliding tiles
    collidingTileColor: new Phaser.Display.Color(243, 234, 48, 255), // Color of colliding tiles
    faceColor: new Phaser.Display.Color(40, 39, 37, 255), // Color of colliding face edges
  });
}
