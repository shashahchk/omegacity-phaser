import Phaser from 'phaser'

export default class Preloader extends Phaser.Scene {
    constructor() {
        super('preloader')
    }

    preload() {
        this.load.image('Interior', 'tiles/interior.png')
        this.load.image('modern', 'tiles/modern.png')
        
        this.load.tilemapTiledJSON('user_room', 'tiles/modern_tilemap.json')

        //load character
        this.load.atlas('faune', 'character/faune.png', 'character/faune.json')
        this.load.atlas('lizard', 'enemies/lizard.png', 'enemies/lizard.json')
        
        this.load.image('ui-heart-empty', 'ui/ui_heart_empty.png')
        this.load.image('ui-heart-full', 'ui/ui_heart_full.png')
    }

    create() {
        this.scene.start('game')
    }
}

