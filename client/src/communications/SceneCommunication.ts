import AgoraRTC, { IAgoraRTCClient } from "agora-rtc-sdk-ng";
import { appid } from "~/communications/appID";

const token = null;
const rtcUID = Math.floor(Math.random() * 2032);

let roomID = "main";

let audioTrack = {
  localAudioTracks: null,
  remoteAudioTracks: {},
};

let rtcClient: IAgoraRTCClient;

export async function initRTC() {
  rtcClient = AgoraRTC.createClient({ mode: "rtc", codec: "vp8" });
  rtcClient.on("user-joined", handleUserJoined);
  rtcClient.on("user-published", handleUserPublished);

  await rtcClient.join(appid, roomID, token);
  audioTrack.localAudioTracks = await AgoraRTC.createMicrophoneAudioTrack();
  await rtcClient.publish(audioTrack.localAudioTracks);
}

async function handleUserJoined(user) {
  console.log("A new user has joined the voice channel room");
}

async function handleUserPublished(user, mediaType) {
  await rtcClient.subscribe(user, mediaType);
  if (mediaType === "audio") {
    audioTrack.remoteAudioTracks[user.uid] = [user.audioTrack];
    user.audioTrack.play();
  }
}
