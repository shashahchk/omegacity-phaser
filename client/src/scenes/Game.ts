import Phaser from 'phaser'
import { debugDraw } from '../utils/debug'
import { createLizardAnims } from '../anims/EnemyAnims'
import { createCharacterAnims } from '../anims/CharacterAnims'
import Lizard from '~/enemies/Lizard'
import * as Colyseus from "colyseus.js";

export default class Game extends Phaser.Scene {
    private currentMessage;
    private client: Colyseus.Client
    private cursors!: Phaser.Types.Input.Keyboard.CursorKeys //trust that this will exist with the !
    private faune!: Phaser.Physics.Arcade.Sprite
    constructor() {
        super('game')
        this.client = new Colyseus.Client('ws://localhost:2567');
    }

    preload() {
        //create arrow and spacebar
        this.cursors = this.input.keyboard.createCursorKeys()
    }



    async create() {
        createCharacterAnims(this.anims)

        this.scene.run('game-ui')

        this.currentMessage = document.getElementById('currentMessage');
        const currentMessageDisplay = document.getElementById('current-message-display');

        try {
            const room = await this.client.joinOrCreate("my_room", {/* options */ });
            console.log("joined successfully", room.sessionId, room.name);
            room.onMessage('keydown', (message) => {
                displayMessageAsSpeechBubble(message)
            })

            this.input.keyboard.on('keydown', (evt: KeyboardEvent) => {
                if (evt.key === 'Enter') {
                    // Send and display the message when 'Enter' is pressed
                    room.send('keydown', this.currentMessage);
                    this.currentMessage = '';
                } else if (evt.key === 'Backspace') {
                    // Remove the last character when 'Backspace' is pressed
                    this.currentMessage = this.currentMessage.slice(0, -1);
                } else {
                    // Add the key to the currentMessage if it's not 'Enter' or 'Backspace'
                    this.currentMessage += evt.key;
                }

                if(currentMessageDisplay) {
                    currentMessageDisplay.textContent = this.currentMessage;
                }
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

function displayMessageAsSpeechBubble(message) {
    const messageArea = document.getElementById('message-area');
    const bubble = document.createElement('div');
    bubble.style.padding = '10px';
    bubble.style.margin = '5px';
    bubble.style.backgroundColor = '#f1f1f1';
    bubble.style.borderRadius = '5px';
    bubble.style.border = '1px solid #ccc';
    bubble.innerText = message;

    messageArea?.appendChild(bubble);

    // Optional: Automatically remove the speech bubble after a certain time
    setTimeout(() => messageArea?.removeChild(bubble), 10000); // Adjust time as needed
}