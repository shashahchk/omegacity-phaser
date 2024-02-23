import Phaser from "phaser";
import UIPlugin from "phaser3-rex-plugins/templates/ui/ui-plugin.js";
export default class DialogBox extends Phaser.Scene {
  private print: Phaser.GameObjects.Text; // Declare the 'print' property
  constructor() {
    super({
      key: "examples",
    });
  }

  preload() {}

  create() {
    this.print = this.add.text(0, 580, "Click to pop-up dialog");

    var scene = this,
      dialog = undefined;
    this.input.on(
      "pointerdown",
      function (pointer) {
        var x = pointer.x,
          y = pointer.y;

        if (dialog === undefined) {
          dialog = createDialog(this, x, y, function (color) {
            scene.add.circle(x, y, 20, color);
            dialog.scaleDownDestroy(100);
            dialog = undefined;
          });
          scene.print.text = "Click (" + x + "," + y + ")";
        } else if (!dialog.isInTouching(pointer)) {
          dialog.scaleDownDestroy(100);
          dialog = undefined;
        }
      },
      this,
    );
  }

  update() {}
}

var createDialog = function (scene, x, y, onClick) {
  // var options = {};
  // var currentOptions = [1, 2, 3, 4];
  // for (var i = 0; i < currentOptions.length; i++) {
  //   options[i] = createOption(currentOptions[i]);
  // }
  var dialog = scene.rexUI.add
    .dialog({
      x: x,
      y: y,

      background: scene.rexUI.add.roundRectangle(0, 0, 100, 100, 20, 0x0e376f),

      title: scene.rexUI.add.label({
        background: scene.rexUI.add.roundRectangle(0, 0, 100, 40, 20, 0x182456),
        text: scene.add.text(0, 0, "Difficulty: Simple", {
          fontSize: "20px",
        }),
        space: {
          left: 15,
          right: 15,
          top: 10,
          bottom: 10,
        },
      }),

      actions: [
        scene.rexUI.add.label({
          width: 100,
          height: 40,
          background: scene.rexUI.add.roundRectangle(0, 0, 0, 0, 20, 0x283593),
          text: scene.add.text(0, 0, "Fight", {
            fontSize: 18,
          }),
          space: {
            left: 10,
            right: 10,
          },
          name: "fightButton",
        }),
      ],

      actionsAlign: "left",

      space: {
        title: 10,
        action: 5,

        left: 10,
        right: 10,
        top: 10,
        bottom: 10,
      },
    })
    .layout()
    .pushIntoBounds()
    .popUp(500);

  dialog.on("button.click", function (button, groupName, index) {
    if (button.name === "fightButton") {
      console.log("Fight clicked");
      // dummy call back
    }
  });

  return dialog;
};

var config = {
  type: Phaser.AUTO,
  parent: "phaser-example",
  width: 800,
  height: 600,
  scene: DialogBox,
};

var createButton = function (scene, text) {
  return scene.rexUI.add.label({
    background: scene.rexUI.add
      .roundRectangle(0, 0, 0, 0, 10)
      .setStrokeStyle(2, 0x283593),
    text: scene.add.text(0, 0, text, {
      fontSize: 24,
    }),
    align: "center",
  });
};

var game = new Phaser.Game(config);
