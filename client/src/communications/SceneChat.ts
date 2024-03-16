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

function setUpSceneChat(scene: Phaser.Scene, currentScene: string) {
  // ignore next click when the dialog is opened so that you will not close the dialog immediately when you click on the dialog box again

  // when the chat box is focused (clicked on), disable the keyboard
  let gameUIScene = scene.scene.get("game-ui");
  scene.scene.get("game-ui").events.on("inputFocused", (isFocused) => {
    console.log("keyboard disabled");
    scene.input.keyboard.enabled = false;
  });

  // when you click outside of the chat box, enable the keyboard
  scene.scene.get("game-ui").events.on("clickedOutside", (isFocused) => {
    if (!scene.input.keyboard.enabled) {
      console.log("keyboard enabled");
      scene.input.keyboard.enabled = true;
    }
  });

  if (gameUIScene instanceof GameUi) {
    // Ensure gameUIScene is an instance of GameUI
    gameUIScene.setRoom(scene.room);
    gameUIScene.setClient(scene.client);
    console.log("set room");
    scene.scene.run("game-ui", {
      currentScene: currentScene,
      username: scene.currentUsername,
    });
  } else {
    console.log("failed to set room");
    // Handle the case where the scene might not be ready or needs to be launched
  }
}

// This function checks if the user is typing in an input or textarea
// put at the top of the update method to stop other game logic from running if the user is typing
// May need to be modified if you have other input types and textareas
function checkIfTyping() {
  return (
    document.activeElement.tagName === "INPUT" ||
    document.activeElement.tagName === "TEXTAREA"
  );
}

export { setUpSceneChat, checkIfTyping };
