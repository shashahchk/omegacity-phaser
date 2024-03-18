// @ts-nocheck
import Phaser from "phaser";

// this will always be correct
// needs to be changed to be dynamic, client side shouldn't decide whether the question is correct
const answers = (scene: Phaser.Scene, id: number, answer: string) => {
  const payload = {
    id: id,
    answer: answer,
  };
  scene.room.send("answerQuestion", payload);
  console.log("Correct Answer verification requested");
};

export { answers };
