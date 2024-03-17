// @ts-nocheck
import Phaser from "phaser";

// this will always be correct
// needs to be changed to be dynamic, client side shouldn't decide whether the question is correct
const answers = (
  scene: Phaser.Scene,
  monsterId: number,
  questionId: number,
  answer: string,
) => {
  const payload = {
    monsterID: monsterId,
    questionID: questionId,
    answer: answer,
  };

  scene.room.send("answerQuestion", payload);
  console.log("Correct Answer verification requested");
};

export { answers };
