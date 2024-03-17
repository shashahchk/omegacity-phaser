import Phaser from "phaser";

export default class Preloader extends Phaser.Scene {
  constructor() {
    super("preloader");
  }

  preload() {
    this.load.image("Interior", "tiles/interior.png");
    this.load.image("modern", "tiles/modern.png");
    this.load.image("tech", "tiles/tech.png");
    this.load.image("dungeon", "tiles/dungeon.png");
    this.load.image("props", "tiles/props.png");

    this.load.tilemapTiledJSON("user_room", "tiles/modern_tilemap.json");
    this.load.tilemapTiledJSON("battle_room", "tiles/battle_tilemap.json");

    //load props
    this.load.atlas("blue-flag", "props/blue-flag/blue-flag.png", "props/blue-flag/blue-flag.json");
    this.load.atlas("red-flag", "props/red-flag/red-flag.png", "props/red-flag/red-flag.json");
    
    //load character
    this.load.atlas(
      "faune",
      "character/faune/faune.png",
      "character/faune/faune.json",
    );
    this.load.atlas(
      "hero",
      "character/hero/hero.png",
      "character/hero/hero.json",
    );

    //load enemies
    this.load.atlas("lizard", "enemies/lizard.png", "enemies/lizard.json");
    this.load.atlas("dragon", "enemies/dragon.png", "enemies/dragon.json");
    this.load.atlas(
      "grimlock",
      "enemies/grimlock/grimlock.png",
      "enemies/grimlock/grimlock.json",
    );
    this.load.atlas(
      "golem1",
      "enemies/golem1/golem1.png",
      "enemies/golem1/golem1.json",
    );
    this.load.atlas("golem2",
      "enemies/golem2/golem2.png",
      "enemies/golem2/golem2.json",
    );

    this.load.atlas("golem1-die", "enemies/golem1/golem1-die.png", "enemies/golem1/golem1-die.json");

    this.load.image("ui-heart-empty", "ui/ui_heart_empty.png");
    this.load.image("ui-heart-full", "ui/ui_heart_full.png");
    this.load.image("arrow", "ui/arrow.png");

    // load plugins
  }

  create() {
    this.scene.start("start");
  }
}
