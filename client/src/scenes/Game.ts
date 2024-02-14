import Phaser from 'phaser'
import { debugDraw } from '../utils/debug'
import { createLizardAnims } from '../anims/EnemyAnims'
import { createCharacterAnims } from '../anims/CharacterAnims'
import UIPlugin from "phaser3-rex-plugins/templates/ui/ui-plugin.js";
import GameUi from "~/scenes/GameUi";
import Lizard from '~/enemies/Lizard'
import * as Colyseus from "colyseus.js";

export default class Game extends Phaser.Scene {
    rexUI: UIPlugin;
    private client: Colyseus.Client
    private cursors!: Phaser.Types.Input.Keyboard.CursorKeys //trust that this will exist with the !
    private faune!: Phaser.Physics.Arcade.Sprite;
    private recorder: MediaRecorder | undefined;
    private room: Colyseus.Room | undefined; //room is a property of the class
    private xKey!: Phaser.Input.Keyboard.Key;
    private ignoreNextClick: boolean = false;
    private currentLizard: Lizard | undefined;
    private dialog: any;


    private recorderLimitTimeout = 0;
    constructor() {
        super('game')
        this.client = new Colyseus.Client('ws://localhost:2567');

    }

    preload() {
        //create arrow and spacebar
        // @ts-ignore
        this.load.scenePlugin({
            key: 'rexuiplugin',
            url: 'https://raw.githubusercontent.com/rexrainbow/phaser3-rex-notes/master/dist/rexuiplugin.min.js',
            sceneKey: 'rexUI'
        });
        this.cursors = this.input.keyboard.createCursorKeys();
        this.xKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.X, false);
    }



    async create() {
        createCharacterAnims(this.anims)


        this.input.on('pointerdown', (pointer) => {
            // Check if we should ignore this click (the one that opens the dialog)
            if (this.ignoreNextClick) {
                this.ignoreNextClick = false;
                return;
            }
            console.log(this.dialog)

            // If there's a dialog and the click is outside, hide or destroy it
            if (this.dialog && !this.dialog.getBounds().contains(pointer.x, pointer.y)) {

                this.dialog.scaleDownDestroy(100);
                this.dialog = undefined; // Clear the reference if destroying the dialog
                this.currentLizard = undefined; // Clear the reference to the current lizard
            }
        }, this);


        let gameUIScene = this.scene.get('game-ui');
        this.scene.get('game-ui').events.on('inputFocused', (isFocused) => {
            console.log("keyboard disabled")
            this.input.keyboard.enabled = false;

        });

        this.scene.get('game-ui').events.on('clickedOutside', (isFocused) => {
            console.log("keyboard enabled")
            this.input.keyboard.enabled = true;



        });




        getLocalStream();


        try {

            this.room = await this.client.joinOrCreate("my_room", {/* options */ });
            console.log("joined successfully", this.room.sessionId, this.room.name);
            if (gameUIScene instanceof GameUi) { // Ensure gameUIScene is an instance of GameUI
                gameUIScene.setRoom(this.room);
                gameUIScene.setClient(this.client)
                console.log("set room")
                this.scene.run('game-ui')
            } else {
                console.log("failed to set room")
                // Handle the case where the scene might not be ready or needs to be launched
            }







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

        this.faune = this.physics.add.sprite(130, 60, 'faune', 'walk-down-3.png')

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
                lizardGo.setInteractive(); // Make the lizard interactive
                lizardGo.on('pointerdown', () => {
                    if (!this.currentLizard) {
                        this.currentLizard = lizardGo;
                        this.showDialogBox(lizardGo);
                    }// Show dialog box when lizard is clicked
                });
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




    update(t: number, dt: number)
    {

        if (document.activeElement.tagName === 'INPUT' || document.activeElement.tagName === 'TEXTAREA') {

            return; // Skip game input handling if an input field is focused
        }
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

        if (this.currentLizard && this.dialog) {
            // Update the dialog's position to follow the lizard
            // You might want to adjust the offset to position the dialog box appropriately
            this.dialog.setPosition(
                this.currentLizard.x,
                this.currentLizard.y - 60
            );
            this.dialog.layout(); // Re-layout the dialog after changing its position
        }
    } //dt is the change since last frame

    enableXKey() {

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
    }

    showDialogBox(lizard: Lizard) {


        // Add this line to ignore the next click (the current one that opens the dialog)
        this.ignoreNextClick = true;
        // Check if a dialog already exists and destroy it or hide it as needed
        // Assuming `this.dialog` is a class property that might hold a reference to an existing dialog
        this.dialog = this.rexUI.add.dialog({
            x: lizard.x,
            y: lizard.y,

            background: this.rexUI.add.roundRectangle(0, 0, 100, 100, 20, 0x0E376F),

            title: this.rexUI.add.label({
                background: this.rexUI.add.roundRectangle(0, 0, 100, 40, 20, 0x182456),
                text: this.add.text(0, 0, 'Difficulty: Simple', {
                    fontSize: '20px'
                }),
                space: {
                    left: 15,
                    right: 15,
                    top: 10,
                    bottom: 10
                }
            }),

            actions: [

                this.rexUI.add.label({
                    width: 100,
                    height: 40,
                    background: this.rexUI.add.roundRectangle(0, 0, 0, 0, 20, 0x283593),
                    text: this.add.text(0, 0, "Fight", {
                        fontSize: 18,
                    }),
                    space: {
                        left: 10,
                        right: 10,
                    },
                    name: 'fightButton'
                })

            ],

            actionsAlign: "left",

            space: {
                title: 10,
                action: 5,

                left: 10,
                right: 10,
                top: 10,
                bottom: 10,
            }
        })
            .layout()
            .pushIntoBounds()
            //.drawBounds(this.add.graphics(), 0xff0000)
            .popUp(500);


        this.dialog.on('button.click', function (button, groupName, index) {
            if (button.name === 'fightButton') { // Check if the 'Fight' button was clicked
                console.log('Fight clicked');
                // onclick call back
            }
        });
    }
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