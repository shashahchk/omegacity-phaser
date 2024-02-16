import Phaser from 'phaser'
import { debugDraw } from '../utils/debug'
import { createLizardAnims } from '../anims/EnemyAnims'
import { createCharacterAnims } from '../anims/CharacterAnims'
import Lizard from '~/enemies/Lizard'
import * as Colyseus from "colyseus.js";

export default class Game extends Phaser.Scene {
    //community scene where everybody is spawned at
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
            console.log("new player joined game room!", sessionId);
            var entity;
            // Only create a player sprite for other players, not the local player
            if (sessionId !== this.room.sessionId) {
                entity = this.physics.add.sprite(player.x, player.y, 'faune', 'faune-idle-down')
            }
            else {
                entity = this.faune;
            };

            // keep a reference of it on `playerEntities`
            this.playerEntities[sessionId] = entity;

            // listening for server updates
            player.onChange(() => {
                console.log(player);
                // Update local position immediately
                entity.x = player.x;
                entity.y = player.y;

                // Assuming entity is a Phaser.Physics.Arcade.Sprite and player.pos is 'left', 'right', 'up', or 'down'
                const direction = player.pos; // This would come from your server update
                var animsDir;
                var animsState;

                switch (direction) {
                    case 'left':
                        animsDir = 'side';
                        entity.flipX = true; // Assuming the side animation faces right by default
                        break;
                    case 'right':
                        animsDir = 'side';
                        entity.flipX = false;
                        break;
                    case 'up':
                        animsDir = 'up';
                        break;
                    case 'down':
                        animsDir = 'down';
                        break;
                }

                if (player.isMoving) {
                    animsState = "walk";
                } else {
                    animsState = "idle";
                }
                entity.anims.play('faune-' + animsState + '-' + animsDir, true);
            });
        }
        );

        try {
            this.add.text(0, 0, 'Join Queue', {})
                .setInteractive()
                .on('pointerdown', () => {
                    if (this.room) {
                        this.room.send('joinQueue');
                        console.log('Join queue request sent');
                    }
                });
                this.room.onMessage('startBattle', (message) => {
                    console.log('startBattle', message);
                
                    // Leave the current room
                    this.room.leave()
                
                    // Start the new scene and pass the sessionId of the current player
                    this.scene.start('battle', { sessionId: message.sessionId });
                });
            this.room.onMessage("player_leave", (message) => {  // Listen to "player_leave" message 
                let entity = this.playerEntities[message.sessionId];
                if (entity) {
                    entity.destroy();
                    delete this.playerEntities[message.sessionId];
                }
                console.log("player_leave", message);
            });
        } catch (e) {
            console.error("join queue error", e);
        }

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

    update() {
        if (!this.cursors || !this.faune || !this.room || this.scene.isActive('battle')) return;

        const speed = 100;

        // send input to the server
        this.inputPayload.left = this.cursors.left.isDown;
        this.inputPayload.right = this.cursors.right.isDown;
        this.inputPayload.up = this.cursors.up.isDown;
        this.inputPayload.down = this.cursors.down.isDown;
        //if no move, then cupdate animations of current
        this.room.send("move", this.inputPayload);
    }
}

