import Phaser from 'phaser'
import { debugDraw } from '../utils/debug'
import { createCharacterAnims } from '../anims/CharacterAnims'
import * as Colyseus from "colyseus.js";

export default class Battle extends Phaser.Scene {
    private client: Colyseus.Client
    private cursors!: Phaser.Types.Input.Keyboard.CursorKeys //trust that this will exist with the !
    private faune!: Phaser.Physics.Arcade.Sprite
    private monsters: Phaser.Physics.Arcade.Sprite[] = [];
    private playerEntities: { [sessionId: string]: any } = {};
    private room!: Colyseus.Room
    currentRound: number = 1;
    roundText!: Phaser.GameObjects.Text;
    private timerText!: Phaser.GameObjects.Text;
    private ROUND_DURATION_MINUTES = 1;
    MINUTE_TO_MILLISECONDS: number = 60 * 1000;
    private remainingTime: number = this.ROUND_DURATION_MINUTES * 60;

    inputPayload = {
        left: false,
        right: false,
        up: false,
        down: false,
    };


    constructor() {
        super('battle')
        this.client = new Colyseus.Client('ws://localhost:2567');
    }

    preload() {
        //create arrow and spacebar

    }

    //Method to spawn monsters at random positions.
    //Called when the scene is created and when a new round starts
    private spawnMonsters() {
        // Remove existing monsters
        this.monsters.forEach(monster => monster.destroy());
        this.monsters = [];

        // Spawn new monsters
        for (let i = 0; i < 5; i++) { // Change this number to spawn more or less monsters
            const x = Phaser.Math.Between(50, 750); // Change these numbers to the size of your game world
            const y = Phaser.Math.Between(50, 550); // Change these numbers to the size of your game world
            const monster = this.physics.add.sprite(x, y, 'dragon', 'free_4x_0');
            monster.setScale(0.5); // Scales the sprite to 50% of its original size
            this.monsters.push(monster);
        }
    }

    private setUpTimer() {
        this.timerText = this.add.text(0, 100, `Time: ${this.remainingTime}`, { fontSize: '15px', fill: '#fff' });

        // Create a Phaser Timer Event that updates the timer text every second
        this.time.addEvent({
            delay: 1000, // 1000 milliseconds = 1 second
            callback: this.updateTimer,
            callbackScope: this,
            loop: true
        });
    }

    async create() {
        this.cursors = this.input.keyboard.createCursorKeys()

        try {
            this.room = await this.client.joinOrCreate("battle", {/* options */ });
            console.log("Joined battle room successfully", this.room.sessionId, this.room.name);
        } catch (e) {
            console.error("join error", e);
        }

        createCharacterAnims(this.anims)

        this.scene.run('game-ui')
        const battleText = this.add.text(0, 0, 'Battle Room', { fontSize: '32px' });

        // listen for new players
        this.room.state.players.onAdd((player, sessionId) => {
            console.log("new player joined!", sessionId);
            var entity;

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

        this.room.state.players.onRemove((player, sessionId) => {
            const entity = this.playerEntities[sessionId];
            if (entity) {
                // destroy entity
                entity.destroy();

                // clear local reference
                delete this.playerEntities[sessionId];
            }
        });

        this.setUpMap(-100, -100);

        this.faune = this.physics.add.sprite(0, 120, 'faune', 'walk-down-3.png')

        //all animations are global once we add them
        //set the body size of the sprite for collision handling
        this.faune.body.setSize(this.faune.width * 0.5, this.faune.height * 0.8)

        this.faune.anims.play('faune-idle-down')

        this.cameras.main.startFollow(this.faune, true)

        // Create the timer
        this.battleTimer = this.time.addEvent({
            delay: this.ROUND_DURATION_MINUTES * this.MINUTE_TO_MILLISECONDS 
            callback: this.onBattleEnd,
            callbackScope: this,
            loop: false // Do not repeat
        });

        this.roundText = this.add.text(50, 50, `Round: ${this.currentRound}`, { fontSize: '32px', fill: '#fff' });

        this.spawnMonsters();

        this.setUpTimer();
    }

    private updateTimer() {
        this.remainingTime = Math.max(0, this.remainingTime - 1);
        this.timerText.setText(`Time: ${this.remainingTime}`);
    }


    private setUpMap(xOffset: number, yOffset: number) {
        const map = this.make.tilemap({ key: 'battle_room' })
        const tileSetTech = map.addTilesetImage('tech', 'tech') //tile set name and image key
        const tileSetDungeon = map.addTilesetImage('dungeon', 'dungeon')

        const floorLayer = map.createLayer('Floor', tileSetDungeon) //the tutorial uses staticlayer
        const wallLayer = map.createLayer('Walls', tileSetTech)
        const decoLayer = map.createLayer('Deco', tileSetTech)
        const propsLayer = map.createLayer('Props', tileSetDungeon)

        // Set the position of each layer
        floorLayer.setPosition(xOffset, yOffset);
        wallLayer.setPosition(xOffset, yOffset);
        decoLayer.setPosition(xOffset, yOffset);
        propsLayer.setPosition(xOffset, yOffset);

        wallLayer.setCollisionByProperty({ collides: true });
    }


    // Callback function to be executed when the timer ends
    private onBattleEnd() {
        console.log('Battle has ended!');
        // Check if the current round is less than 5
        if (this.currentRound < 5) {
            // Increment the round
            this.currentRound++;
            console.log(`Starting round ${this.currentRound}`);
            // Update the round text
            this.roundText.setText(`Round: ${this.currentRound}`);
            // Spawn monsters at random positions
            this.spawnMonsters();
            this.remainingTime = this.ROUND_DURATION_MINUTES * 60;
            // Restart the scene
            this.scene.restart();
        } else {
            console.log('Game over!');
            // Add your logic here for what should happen when the game ends
        }
    }

    update() {
        if (!this.cursors || !this.faune || !this.room) return;

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