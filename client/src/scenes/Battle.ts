import Phaser from 'phaser'
import { debugDraw } from '../utils/debug'
import { createLizardAnims } from '../anims/EnemyAnims'
import { createCharacterAnims } from '../anims/CharacterAnims'
import UIPlugin from "phaser3-rex-plugins/templates/ui/ui-plugin.js";
import GameUi from "~/scenes/GameUi";
import Lizard from '~/enemies/Lizard'
import * as Colyseus from "colyseus.js";
import { SetupPlayerAnimsUpdate, SetupPlayerOnCreate } from "~/anims/PlayerSync";
import { SetUpVoiceComm } from "~/communications/SceneCommunication";
import { SetUpSceneChat, CheckIfTyping} from "~/communications/SceneChat";

export default class Battle extends Phaser.Scene {
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
    private popUp: any;
    private mediaStream: MediaStream | undefined;
    private recorderLimitTimeout = 0;
    // a map that stores the layers of the tilemap
    private layerMap: Map<string, Phaser.Tilemaps.TilemapLayer> = new Map();
    private monsters!: Phaser.Physics.Arcade.Group;




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
        this.room = await this.client.joinOrCreate("my_room", {/* options */ });


        try {
            createCharacterAnims(this.anims)

            SetUpSceneChat(this)

            SetUpVoiceComm(this)

            this.mapTileSetUp()


            this.faune = this.physics.add.sprite(130, 60, 'faune', 'walk-down-3.png')

            SetupPlayerOnCreate(this.faune, this.cameras)

            createLizardAnims(this.anims)

            this.createEnemies()

            this.collisionSetUp()



        } catch (e) {
            console.error("join error", e);
        }



    }

    private handlePlayerLizardCollision(obj1: Phaser.GameObjects.GameObject, obj2: Phaser.GameObjects.GameObject) {
        const lizard = obj2 as Lizard
        const dx = this.faune.x - lizard.x
        const dy = this.faune.y - lizard.y

        const dir = new Phaser.Math.Vector2(dx, dy).normalize().scale(200)

        this.faune.setVelocity(dir.x, dir.y)
    }


    // set up the map and the different layers to be added in the map for reference in collisionSetUp
    private mapTileSetUp() {

        const map = this.make.tilemap({ key: 'user_room' })
        const tileSetInterior = map.addTilesetImage('Interior', 'Interior') //tile set name and image key
        const tileSetModern = map.addTilesetImage('modern', 'modern') //tile set name and image key

        map.createLayer('Floor', tileSetModern) //the tutorial uses staticlayer
        const wall_layer = map.createLayer('Walls', tileSetModern)
        this.layerMap.set('wall_layer', wall_layer)
        wall_layer.setCollisionByProperty({ collides: true })


        const interior_layer = map.createLayer('Interior', tileSetInterior)
        interior_layer.setCollisionByProperty({ collides: true })
        this.layerMap.set('interior_layer', interior_layer)

        debugDraw(wall_layer, this)

    }


    // set up the collision between different objects in the game
    private collisionSetUp() {
        this.physics.add.collider(this.faune, this.layerMap.get('wall_layer'))
        this.physics.add.collider(this.monsters, this.layerMap.get('wall_layer'))
        this.physics.add.collider(this.monsters, this.layerMap.get('interior_layer'))
        this.physics.add.collider(this.faune, this.layerMap.get('interior_layer'))
        this.physics.add.collider(this.faune, this.monsters, this.handlePlayerLizardCollision, undefined, this)
    }

    // create the enemies in the game, and design their behaviors
    private createEnemies() {
        this.monsters = this.physics.add.group({
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
        this.monsters.get(200, 123, 'lizard')
    }


    update(t: number, dt: number)
    {
        //return if the user is typing
        if (CheckIfTyping()) return;

        SetupPlayerAnimsUpdate(this.faune, this.cursors);

        // Can add more custom behaviors here
        // custom behavior of dialog box following Lizard in this scene
        if (this.currentLizard && this.dialog) {
            // Update the dialog's position to follow the lizard
            // You might want to adjust the offset to position the dialog box appropriately
            this.dialog.setPosition(
                this.currentLizard.x,
                this.currentLizard.y - 60
            );
            this.dialog.layout(); // Re-layout the dialog after changing its position
        }
    }



    // custom UI behavior of dialog box following Lizard in this scene
    // This method creates a dialog box and sets up its behavior
    // can disregard for now
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

