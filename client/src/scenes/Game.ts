import Phaser from 'phaser'
import { debugDraw } from '../utils/debug'
import { createLizardAnims } from '../anims/EnemyAnims'
import { createCharacterAnims } from '../anims/CharacterAnims'
import Lizard from '~/enemies/Lizard'
import * as Colyseus from "colyseus.js";
import Faune from '~/characters/Faune'

export default class Game extends Phaser.Scene {
    private client: Colyseus.Client
    private cursors!: Phaser.Types.Input.Keyboard.CursorKeys //trust that this will exist with the !
    private faune!: Phaser.Physics.Arcade.Sprite
    private room!: Colyseus.Room
    private playerEntities: { [sessionId: string]: any } = {};
    
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
            // this.room.onMessage('keydown', (message) => {
            //     console.log(message)
            // })
            this.input.keyboard.on('keydown', (evt: KeyboardEvent) => {
                this.room.send('keydown', evt.key)
            })

            this.room.state.players.onAdd((player, sessionId) => {
                const entity = this.createSpriteForPlayer(sessionId, player.x, player.y);
                console.log("player added", entity)
                // keep a reference of it on `playerEntities`
                this.playerEntities[sessionId] = entity;

                // listening for server updates
                player.onChange(() => {
                    //if not the current palyer
                    if (sessionId !== this.room.sessionId) {
                    // update local position immediately
                        entity.x = player.x;
                        entity.y = player.y;
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


        } catch (e) {
            console.error("join error", e);
        }

        const [wall_layer, interior_layer] = this.createMapLayers()

        this.faune = this.createSpriteForPlayer(this.room.sessionId, 128, 128)

        this.cameras.main.startFollow(this.faune, true)
        this.cameras.main.centerOn(0, 0);

        const lizards = this.createLizard()
        createLizardAnims(this.anims)

        this.physics.add.collider(this.faune, wall_layer)
        this.physics.add.collider(lizards, wall_layer)
        this.physics.add.collider(lizards, interior_layer)
        this.physics.add.collider(this.faune, interior_layer)
        this.physics.add.collider(this.faune, lizards, this.handlePlayerLizardCollision, undefined, this)

    }

    private createLizard() {
        const lizards = this.physics.add.group({
            classType: Lizard,
            createCallback: (go) => {
                const lizardGo = go as Lizard
                lizardGo.body.onCollide = true
            }
        })
        lizards.get(200, 123, 'lizard')
        return lizards
    }

    private createMapLayers() {
        const map = this.make.tilemap({ key: 'user_room' })
        const tileSetInterior = map.addTilesetImage('Interior', 'Interior') //tile set name and image key
        const tileSetModern = map.addTilesetImage('modern', 'modern') //tile set name and image key

        map.createLayer('Floor', tileSetModern) //the tutorial uses staticlayer
        const wall_layer = map.createLayer('Walls', tileSetModern)
        wall_layer.setCollisionByProperty({ collides: true })


        const interior_layer = map.createLayer('Interior', tileSetInterior)
        interior_layer.setCollisionByProperty({ collides: true })

        // debugDraw(wall_layer, this)
        return [wall_layer, interior_layer]
    }

    private createSpriteForPlayer(id: string, x: number, y: number): Faune {
        const sprite = new Faune(this, x, y, 'faune-idle-down');
        sprite.setData('sessionId', id);
        this.physics.world.enable(sprite); // Add this line
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
        console.log('called main update')
        const moved = this.faune.update(this.cursors, t, dt)

        if (moved !== undefined && moved)
            this.room.send('move', { x: this.faune.x, y: this.faune.y });
    } //dt is the change since last frame
}
