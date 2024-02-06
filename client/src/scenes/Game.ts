import Phaser from 'phaser'
import { debugDraw } from '../utils/debug'
import { createLizardAnims } from '../anims/EnemyAnims'
import { createCharacterAnims } from '../anims/CharacterAnims'
import Lizard from '~/enemies/Lizard'
import * as Colyseus from "colyseus.js";

export default class Game extends Phaser.Scene {
    private client: Colyseus.Client
    private cursors!: Phaser.Types.Input.Keyboard.CursorKeys //trust that this will exist with the !
    private faune!: Phaser.Physics.Arcade.Sprite
    private playerEntities: { [sessionId: string]: any } = {};
    private room!: Colyseus.Room
    inputPayload = {
        left: false,
        right: false,
        up: false,
        down: false,
    };

    constructor() {
        super('game')
        this.client = new Colyseus.Client('ws://localhost:2567');
    }

    preload() {
        //create arrow and spacebar
        this.load.image('curr_player', 'https://cdn.glitch.global/3e033dcd-d5be-4db4-99e8-086ae90969ec/ship_0001.png');
        this.cursors = this.input.keyboard.createCursorKeys()
    }


    async create() {
        createCharacterAnims(this.anims)

        this.scene.run('game-ui')

        try {
            this.room = await this.client.joinOrCreate("my_room", {/* options */ });
            console.log("joined successfully", this.room.sessionId, this.room.name);
            this.room.onMessage('keydown', (message) => {
                console.log(message)
            })
            this.input.keyboard.on('keydown', (evt: KeyboardEvent) => {
                this.room.send('keydown', evt.key)
            })

        } catch (e) {
            console.error("join error", e);
        }

        // listen for new players
        this.room.state.players.onAdd((player, sessionId) => {
            console.log("new player joined!", sessionId);

            const entity = this.physics.add.sprite(player.x, player.y, 'faune', 'frame_id');

            // keep a reference of it on `playerEntities`
            this.playerEntities[sessionId] = entity;

            // listening for server updates
            player.onChange(() => {
                // Update local position immediately
                entity.x = player.x;
                entity.y = player.y;
                
                // Assuming entity is a Phaser.Physics.Arcade.Sprite and player.pos is 'left', 'right', 'up', or 'down'
                const direction = player.pos; // This would come from your server update
                switch (direction) {
                    case 'left':
                        entity.anims.play('faune-walk-side', true);
                        entity.flipX = true; // Assuming the side animation faces right by default
                        break;
                    case 'right':
                        entity.anims.play('faune-walk-side', true);
                        entity.flipX = false;
                        break;
                    case 'up':
                        entity.anims.play('faune-walk-up', true);
                        break;
                    case 'down':
                        entity.anims.play('faune-walk-down', true);
                        break;
                }
            });
            

            // Alternative, listening to individual properties:
            // player.listen("x", (newX, prevX) => console.log(newX, prevX));
            // player.listen("y", (newY, prevY) => console.log(newY, prevY));
        });

        this.room.state.players.onRemove((player, sessionId) => {
            const entity = this.playerEntities[sessionId];
            if (entity) {
                // destroy entity
                entity.destroy();

                // clear local reference
                delete this.playerEntities[sessionId];
            }
        });

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
        if (!this.cursors || !this.faune || !this.room) return

        const speed = 100


        // send input to the server
        this.inputPayload.left = this.cursors.left.isDown;
        this.inputPayload.right = this.cursors.right.isDown;
        this.inputPayload.up = this.cursors.up.isDown;
        this.inputPayload.down = this.cursors.down.isDown;
        this.room.send("move", this.inputPayload);
    }

    // if (this.cursors.left?.isDown) {
    //     this.faune.anims.play('faune-walk-side', true)
    //     this.faune.setVelocity(-speed, 0)
    //     this.faune.scaleX = -1
    //     this.faune.body.offset.x = 24
    // }
    // else if (this.cursors.right?.isDown) {
    //     this.faune.anims.play('faune-walk-side', true)
    //     this.faune.setVelocity(speed, 0)
    //     this.faune.scaleX = 1
    //     this.faune.body.offset.x = 8
    // } else if (this.cursors.up?.isDown) {
    //     this.faune.anims.play('faune-walk-up', true)
    //     this.faune.setVelocity(0, -speed)
    // } else if (this.cursors.down?.isDown) {
    //     this.faune.anims.play('faune-walk-down', true)
    //     this.faune.setVelocity(0, speed)
    // } else {
    //     const parts = this.faune.anims.currentAnim.key.split("-")
    //     parts[1] = 'idle' //keep the direction
    //     this.faune.anims.play((parts).join("-"), true)
    //     this.faune.setVelocity(0, 0)
    // }
} //dt is the change since last frame

