// @ts-nocheck
import Phaser from "phaser";

// this will always be correct 
// needs to be changed to be dynamic, client side shouldn't decide whether the question is correct
const correctAnswer = (scene: Phaser.Scene) => {

    const payload = {
        answer: 'correct',
    };
    scene.room.send("verify_answer", payload);
    console.log('Correct Answer verification requested');
}

// this will always be wrong 
// needs to be changed to be dynamic, client side shouldn't decide whether the question is wrong
const wrongAnswer = (scene: Phaser.Scene) => {
    const payload = {
        answer: 'wrong',
    };
    scene.room.send("verify_answer", payload);
    console.log('Wrong Answer verification requested');
}

export { correctAnswer, wrongAnswer }