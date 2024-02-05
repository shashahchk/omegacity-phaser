import Phaser from 'phaser'
import { debugDraw } from '../utils/debug'
import * as Colyseus from "colyseus.js";

export default class Game extends Phaser.Scene {
    private client: Colyseus.Client
    private cursors!: Phaser.Types.Input.Keyboard.CursorKeys //trust that this will exist with the !
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
        this.load.image('ship_0001', 'https://cdn.glitch.global/3e033dcd-d5be-4db4-99e8-086ae90969ec/ship_0001.png');
        this.cursors = this.input.keyboard.createCursorKeys()
    }


    async create() {
        // this.scene.run('game-ui')

        try {
            this.room = await this.client.joinOrCreate("lobby", {/* options */ });
            console.log("joined successfully", this.room.sessionId, this.room.name);
            this.room.onMessage('keydown', (message) => {
                console.log(message)
            })
            // this.input.keyboard.on('keydown', (evt: KeyboardEvent) => {
            //     this.room.send('keydown', evt.key)
            // })
            this.add.text(200, 200, 'Join Queue', {})
                .setInteractive()
                .on('pointerdown', () => {
                    if (this.room) {
                        // console.log(this.room)
                        this.room.send('joinQueue');
                        console.log('Join queue request sent');
                    }
                });
            this.room.onMessage('startBattle', (message) => {
                console.log('startBattle', message);
                this.scene.start('battle');
            });

        } catch (e) {
            console.error("join error", e);
        }



        // this.room.state.players.onRemove((player, sessionId) => {
        //     const entity = this.playerEntities[sessionId];
        //     if (entity) {
        //         // destroy entity
        //         entity.destroy();

        //         // clear local reference
        //         delete this.playerEntities[sessionId];
        //     }
        // });
    }


    update(t: number, dt: number) {
        if (!this.cursors || !this.room) return
    }

} //dt is the change since last frame

