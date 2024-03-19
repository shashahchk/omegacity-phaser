import Phaser from "phaser";
import { createCharacterAnims } from "~/anims/CharacterAnims";
import { createPropsAnims } from "~/anims/PropsAnims";

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
    this.load.image("slates", "tiles/Slates [32x32px orthogonal tileset by Ivan Voirol].png");
    this.load.image("Overworld", "tiles/Overworld.png");
    this.load.image("cave","tiles/cave.png");

    this.load.tilemapTiledJSON("user_room", "tiles/modern_tilemap.json");
    this.load.tilemapTiledJSON("battle_room", "tiles/battle_tilemap.json");

    //load props
    this.load.atlas(
      "blue-flag",
      "props/blue-flag/blue-flag.png",
      "props/blue-flag/blue-flag.json",
    );
    this.load.atlas(
      "red-flag",
      "props/red-flag/red-flag.png",
      "props/red-flag/red-flag.json",
    );

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
    this.load.atlas(
      "golem2",
      "enemies/golem2/golem2.png",
      "enemies/golem2/golem2.json",
    );

    this.load.atlas(
      "golem1-die",
      "enemies/golem1/golem1-die.png",
      "enemies/golem1/golem1-die.json",
    );

    this.load.image("ui-heart-empty", "ui/ui_heart_empty.png");
    this.load.image("ui-heart-full", "ui/ui_heart_full.png");
    // Preload assets
    this.load.image("background", "ui/start-background.png");
    this.load.image("startButton", "ui/start-button.png");
    this.load.image("arrow", "ui/arrow.png");

    this.load.audio("playerMove", ["audio/gravel.ogg"]);
    this.load.audio("playerMove2", ["audio/steps-wood.ogg"]);

    // this.load.audio('dafunk', [
    //   'audio/Dafunk - Hardcore Power (We Believe In Goa - Remix).ogg',
    //   'audio/Dafunk - Hardcore Power (We Believe In Goa - Remix).mp3',
    //   'audio/Dafunk - Hardcore Power (We Believe In Goa - Remix).m4a'
    // ]);

    this.load.audio("monster-scream", ["audio/monster-scream.mp3"]);
    this.load.image('village-background', 'ui/village-background.png');

    // load plugins
  }

  create() {
    createPropsAnims(this.anims);
    createCharacterAnims(this.anims);
    this.scene.start("battle");
  }
}
