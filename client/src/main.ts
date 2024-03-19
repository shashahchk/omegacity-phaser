import Phaser from "phaser";
import RexUIPlugin from "phaser3-rex-plugins/templates/ui/ui-plugin";
import BBCodeTextPlugin from "phaser3-rex-plugins/plugins/bbcodetext-plugin.js";
import Preloader from "./scenes/Preloader";
import Game from "./scenes/Game";
import GameUi from "./scenes/GameUi";
import DialogBox from "./scenes/DialogBox";
import Battle from "./scenes/Battle";
import StartScene from "./scenes/StartScene";
import { BattleUi } from "./scenes/BattleUi";

const config: Phaser.Types.Core.GameConfig = {
  type: Phaser.AUTO,
  width: 1266,
  height: 800,

  physics: {
    default: "arcade",
    arcade: {
      gravity: { y: 0 },
      debug: true,
    },
  },
  parent: "phaser-container",
  dom: {
    createContainer: true,
  },
  plugins: {
    scene: [
      {
        key: "rexUI",
        plugin: RexUIPlugin,
        mapping: "rexUI",
      },
    ],
    global: [
      {
        key: "rexBBCodeTextPlugin",
        plugin: BBCodeTextPlugin,
        start: true,
      },
    ],
  },
  scene: [Preloader, StartScene, Game, Battle, GameUi, BattleUi],
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
  },
};

export default new Phaser.Game(config);
