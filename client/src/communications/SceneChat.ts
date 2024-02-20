// @ts-nocheck
import GameUi from "../scenes/GameUi";
import * as Colyseus from "colyseus.js";

// SetUp event listeners for chat related issue
// MUST HAVE in scene:
// private client: Colyseus.Client
// private room: Colyseus.Room | undefined;
// private ignoreNextClick: boolean = false;
// private dialog: any;
// TS check is disabled because the Game type scene is not defined in this file

function SetUpSceneChat(scene: Phaser.Scene) {
  // ignore next click when the dialog is opened so that you will not close the dialog immediately when you click on the dialog box again
  scene.input.on(
    "pointerdown",
    (pointer) => {
      // Check if we should ignore scene click (the one that opens the dialog)
      if (scene.ignoreNextClick) {
        scene.ignoreNextClick = false;
        return;
      }

      // If there's a dialog and the click is outside, hide or destroy it
      if (
        scene.dialog &&
        !scene.dialog.getBounds().contains(pointer.x, pointer.y)
      ) {
        scene.dialog.scaleDownDestroy(100);
        scene.dialog = undefined; // Clear the reference if destroying the dialog
        scene.currentLizard = undefined; // Clear the reference to the current lizard
      }
    },
    scene,
  );

  // when the chat box is focused (clicked on), disable the keyboard
  let gameUIScene = scene.scene.get("game-ui");
  scene.scene.get("game-ui").events.on("inputFocused", (isFocused) => {
    console.log("keyboard disabled");
    scene.input.keyboard.enabled = false;
  });

  // when you click outside of the chat box, enable the keyboard
  scene.scene.get("game-ui").events.on("clickedOutside", (isFocused) => {
    console.log("keyboard enabled");
    scene.input.keyboard.enabled = true;
  });

  if (gameUIScene instanceof GameUi) {
    // Ensure gameUIScene is an instance of GameUI
    gameUIScene.setRoom(scene.room);
    gameUIScene.setClient(scene.client);
    console.log("set room");
    scene.scene.run("game-ui");
  } else {
    console.log("failed to set room");
    // Handle the case where the scene might not be ready or needs to be launched
  }
}

// This function checks if the user is typing in an input or textarea
// put at the top of the update method to stop other game logic from running if the user is typing
// May need to be modified if you have other input types and textareas
function CheckIfTyping() {
  return (
    document.activeElement.tagName === "INPUT" ||
    document.activeElement.tagName === "TEXTAREA"
  );
}

export { SetUpSceneChat, CheckIfTyping };
