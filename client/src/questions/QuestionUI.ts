import Phaser from "phaser";
import { correctAnswer, wrongAnswer } from "./QuestionLogic";

const SetUpQuestions = (scene: Phaser.Scene) => {
  let correctAnswerButton = scene.add
    .text(0, 150, "Correct Answer", {
      fontSize: "20px",
      backgroundColor: "#0f0",
      fixedWidth: 200,
    })
    .setInteractive()
    .on("pointerdown", () => {
      scene.sound.play("correct-answer");
      correctAnswer(scene);
    });

  let wrongAnswerButton = scene.add
    .text(0, 190, "Wrong Answer", {
      fontSize: "20px",
      backgroundColor: "#f00",
      fixedWidth: 200,
    })
    .setInteractive()
    .on("pointerdown", () => {
      // Play the wrong answer sound
      scene.sound.play("wrong-answer");

      wrongAnswer(scene);
    });
};

export { SetUpQuestions };
