// // @ts-nocheck
// import Phaser from "phaser";
// import { Room } from "colyseus.js";
// import * as Colyseus from "colyseus.js";
// import Lizard from "~/enemies/Lizard";

// // SetUp event listeners for voice related issue, key is the key that you want to use to start and stop recording
// // for any scene that requires voice communication, call this function in the create method of the scene
// // MUST HAVE in scene:
// // private recorder: MediaRecorder | undefined;
// // private room: Colyseus.Room | undefined; //room is a property of the class
// // private xKey!: Phaser.Input.Keyboard.Key;
// // private mediaStream: MediaStream | undefined;
// // private recorderLimitTimeout = 0;
// // For reference to the scene
// // TS check is disabled because the Game type scene is not defined in this file

// function setUpVoiceComm(scene: Phaser.Scene) {
//   getLocalStream();

//   scene.xKey.on("down", () => {
//     if (scene.isFocused) {
//       console.log("focused");
//       return;
//     }
//     if (!scene.recorder && mediaStream) {
//       if (scene.room) console.log("record button pushing");

//       startRecording(scene);
//     }
//   });
//   scene.xKey.on("up", () => {
//     if (scene.isFocused) {
//       return;
//     }
//     stopRecording(scene);
//   });

//   scene.room.onMessage("player-voice", ([sessionId, payload]) => {
//     // create audio element and play it
//     // when finished playing, remove audio object and remove "talking" class
//     const audio = new Audio();
//     console.log("voice message received");
//     const onAudioEnded = () => {
//       audio.remove();
//     };

//     audio.autoplay = true;
//     audio.src = URL.createObjectURL(
//       new Blob([payload], { type: "audio/webm" }),
//     );
//     audio.onended = () => onAudioEnded();
//     audio.play().catch((e) => {
//       console.error(e);
//       onAudioEnded();
//     });
//   });
//   console.log("voice comm set up");
// }

// function startRecording(scene: Phaser.Scene) {
//   scene.recorder = new MediaRecorder(mediaStream);
//   scene.recorder.ondataavailable = (event) => {
//     console.log("recording available, sending...");

//     event.data.arrayBuffer().then((buffer) => {
//       if (scene.room) {
//         scene.room.sendBytes("player-talking", new Uint8Array(buffer));
//       }
//     });
//   };

//   console.log("start recording");
//   scene.recorder.start();

//   scene.recorderLimitTimeout = setTimeout(
//     () => scene.recorder?.stop(),
//     10 * 1000,
//   );
// }

// function stopRecording(scene: Phaser.Scene) {
//   if (scene.recorder) {
//     console.log("stop recording");
//     scene.recorder.stop();
//     scene.recorder = undefined;
//     clearTimeout(scene.recorderLimitTimeout);
//   }
// }

// let mediaStream: MediaStream;
// function getLocalStream() {
//   navigator.mediaDevices
//     .getUserMedia({ video: false, audio: true })
//     .then((stream) => {
//       mediaStream = stream;
//     })
//     .catch((err) => {
//       console.error(`you got an error: ${err}`);
//     });
// }

// export { setUpVoiceComm };
