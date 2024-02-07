import Phaser from 'phaser'
import { debugDraw } from '../utils/debug'
import { createLizardAnims } from '../anims/EnemyAnims'
import { createCharacterAnims } from '../anims/CharacterAnims'
import Lizard from '~/enemies/Lizard'
import * as Colyseus from "colyseus.js";

export default class Game extends Phaser.Scene {
    private client: Colyseus.Client
    private cursors!: Phaser.Types.Input.Keyboard.CursorKeys //trust that this will exist with the !
    private faune!: Phaser.Physics.Arcade.Sprite;
    private recorder: MediaRecorder | undefined;
    private room: Colyseus.Room | undefined; //room is a property of the class
    private xKey!: Phaser.Input.Keyboard.Key;
    private recorderLimitTimeout = 0;
    constructor() {
        super('game')
        this.client = new Colyseus.Client('ws://localhost:2567');
    }

    preload() {
        //create arrow and spacebar
        // @ts-ignore
        this.cursors = this.input.keyboard.createCursorKeys();
        this.xKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.X);
    }



    async create() {
        createCharacterAnims(this.anims)


        this.scene.run('game-ui')
        getLocalStream();


        try {

            this.room = await this.client.joinOrCreate("my_room", {/* options */ });
            console.log("joined successfully", this.room.sessionId, this.room.name);
            this.room.onMessage('keydown', (message) => {
                console.log(message)
            })
            this.input.keyboard.on('keydown', (evt: KeyboardEvent) => {
                this.room.send('keydown', evt.key)
            })


            this.xKey.on('down', () => {
                if (!this.recorder && mediaStream) {
                    if (this.room)
                        this.room.send('push')
                    this.startRecording();
                }
            });
            this.xKey.on('up', () => {
                this.stopRecording();
            });

            this.room.onMessage("talk", ([sessionId, payload]) => {
                // create audio element and play it
                // when finished playing, remove audio object and remove "talking" class
                const audio = new Audio();
                console.log("voice message received")
                const onAudioEnded = () => {
                    audio.remove();
                };

                audio.autoplay = true;
                audio.src = URL.createObjectURL(new Blob([payload], { type: "audio/webm" }));
                audio.onended = () => onAudioEnded();
                audio.play().catch((e) => {
                    console.error(e);
                    onAudioEnded();
                });
            });

        } catch (e) {
            console.error("join error", e);
        }

        const map = this.make.tilemap({ key: 'user_room' })
        const tileSetInterior = map.addTilesetImage('Interior', 'Interior') //tile set name and image key
        const tileSetModern = map.addTilesetImage('modern', 'modern') //tile set name and image key

        map.createLayer('Floor', tileSetModern) //the tutorial uses staticlayer
        const wall_layer = map.createLayer('Walls', tileSetModern)
        wall_layer.setCollisionByProperty({ collides: true })


        const interior_layer = map.createLayer('Interior', tileSetInterior)
        interior_layer.setCollisionByProperty({ collides: true })

        debugDraw(wall_layer, this)

        this.faune = this.physics.add.sprite(120, 120, 'faune', 'walk-down-3.png')
        //all animations are global once we add them
        //set the body size of the sprite for collision handling
        this.faune.body.setSize(this.faune.width * 0.5, this.faune.height * 0.8)

        this.faune.anims.play('faune-idle-down')

        this.cameras.main.startFollow(this.faune, true)
        this.cameras.main.centerOn(0, 0);

        createLizardAnims(this.anims)

        const lizards = this.physics.add.group({
            classType: Lizard,
            createCallback: (go) => {
                const lizardGo = go as Lizard
                lizardGo.body.onCollide = true
            }
        })
        lizards.get(200, 123, 'lizard')

        this.physics.add.collider(this.faune, wall_layer)
        this.physics.add.collider(lizards, wall_layer)
        this.physics.add.collider(lizards, interior_layer)
        this.physics.add.collider(this.faune, interior_layer)
        this.physics.add.collider(this.faune, lizards, this.handlePlayerLizardCollision, undefined, this)

    }

    private handlePlayerLizardCollision(obj1: Phaser.GameObjects.GameObject, obj2: Phaser.GameObjects.GameObject) {
        const lizard = obj2 as Lizard
        const dx = this.faune.x - lizard.x
        const dy = this.faune.y - lizard.y

        const dir = new Phaser.Math.Vector2(dx, dy).normalize().scale(200)

        this.faune.setVelocity(dir.x, dir.y)
    }

    private startRecording() {
        this.recorder = new MediaRecorder(mediaStream);
        this.recorder.ondataavailable = (event) => {
            console.log("recording available, sending...");

            event.data.arrayBuffer().then((buffer) => {
                if (this.room) {

                    this.room.sendBytes("talk", new Uint8Array(buffer));
                }
            });
        };



        console.log("start recording");
        this.recorder.start();

        this.recorderLimitTimeout = setTimeout(() => this.recorder?.stop(), 10 * 1000);
    }//dt is the change since last frame


    private stopRecording() {
        if (this.recorder) {
            console.log("stop recording");
            this.recorder.stop();
            this.recorder = undefined;
            clearTimeout(this.recorderLimitTimeout);
        }
    }




    update(t: number, dt: number) {
        if (!this.cursors || !this.faune) return

        const speed = 100

        if (this.cursors.left?.isDown) {
            this.faune.anims.play('faune-walk-side', true)
            this.faune.setVelocity(-speed, 0)
            this.faune.scaleX = -1
            this.faune.body.offset.x = 24
        }
        else if (this.cursors.right?.isDown) {
            this.faune.anims.play('faune-walk-side', true)
            this.faune.setVelocity(speed, 0)
            this.faune.scaleX = 1
            this.faune.body.offset.x = 8
        } else if (this.cursors.up?.isDown) {
            this.faune.anims.play('faune-walk-up', true)
            this.faune.setVelocity(0, -speed)
        } else if (this.cursors.down?.isDown) {
            this.faune.anims.play('faune-walk-down', true)
            this.faune.setVelocity(0, speed)
        } else {
            const parts = this.faune.anims.currentAnim.key.split("-")
            parts[1] = 'idle' //keep the direction
            this.faune.anims.play((parts).join("-"), true)
            this.faune.setVelocity(0, 0)
        }
    } //dt is the change since last frame
}


let mediaStream: MediaStream;
function getLocalStream() {
    navigator.mediaDevices
        .getUserMedia({ video: false, audio: true })
        .then((stream) => {
            mediaStream = stream;
        })
        .catch((err) => {
            console.error(`you got an error: ${err}`);
        });
}
