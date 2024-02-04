import Phaser from 'phaser'
import { debugDraw } from '../utils/debug'
import { createLizardAnims } from '../anims/EnemyAnims'
import { createCharacterAnims } from '../anims/CharacterAnims'
import Lizard from '~/enemies/Lizard'
import * as Colyseus from "colyseus.js";
import Faune from '~/characters/faune'

export default class Game extends Phaser.Scene {
    private client: Colyseus.Client
    private cursors!: Phaser.Types.Input.Keyboard.CursorKeys //trust that this will exist with the !
    private faune!: Phaser.Physics.Arcade.Sprite
    private room!: Colyseus.Room
    private playerSprites: Map<string, Phaser.Physics.Arcade.Sprite> = new Map(); //map of id to sprite

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

        try {
            this.room = await this.client.joinOrCreate("my_room", {/* options */ });
            console.log("joined successfully", this.room.sessionId, this.room.name);
            this.room.onMessage('keydown', (message) => {
                console.log(message)
            })
            this.input.keyboard.on('keydown', (evt: KeyboardEvent) => {
                this.room.send('keydown', evt.key)
            })
            this.room.onStateChange((state) => {
                // This callback will be triggered whenever the state changes
                state.players.forEach((player, id) => {
                    let sprite = this.playerSprites.get(id);
                    if (!sprite) {
                        // If the sprite doesn't exist yet, create it
                        sprite = this.createSpriteForPlayer(id, player.x, player.y);
                        this.playerSprites.set(id, sprite);
                    } else {
                        // If the sprite already exists, update its position
                        sprite.x = player.x;
                        sprite.y = player.y;
                    }
                });
            });
            this.room.onMessage("move", (message) => {
                const sprite = this.playerSprites.get(message.id);
                if (sprite) {
                  sprite.x = message.x;
                  sprite.y = message.y;
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

    private createSpriteForPlayer(id: string, x: number, y: number): Faune {
        const sprite = new Faune(this, x, y, 'fauneTexture');
        sprite.setData('sessionId', id);
        this.add.existing(sprite);
        return sprite;
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
        let moved = false

        if (this.cursors.left?.isDown) {
            this.faune.anims.play('faune-walk-side', true)
            this.faune.setVelocity(-speed, 0)
            this.faune.scaleX = -1
            this.faune.body.offset.x = 24
            moved = true
        }
        else if (this.cursors.right?.isDown) {
            this.faune.anims.play('faune-walk-side', true)
            this.faune.setVelocity(speed, 0)
            this.faune.scaleX = 1
            this.faune.body.offset.x = 8
            moved = true
        } else if (this.cursors.up?.isDown) {
            this.faune.anims.play('faune-walk-up', true)
            this.faune.setVelocity(0, -speed)
            moved = true
        } else if (this.cursors.down?.isDown) {
            this.faune.anims.play('faune-walk-down', true)
            this.faune.setVelocity(0, speed)
            moved = true
        } else {
            const parts = this.faune.anims.currentAnim.key.split("-")
            parts[1] = 'idle' //keep the direction
            this.faune.anims.play((parts).join("-"), true)
            this.faune.setVelocity(0, 0)
            moved = true
        }
        if (moved) {
            this.room.send('move', { x: this.faune.x, y: this.faune.y });
        }
    } //dt is the change since last frame
}
