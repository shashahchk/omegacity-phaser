export default class ClientPlayer extends Phaser.Physics.Arcade.Sprite {
    private char_name: string;
    public scene: Phaser.Scene;
    private username: Phaser.GameObjects.Text;
    
    constructor(scene, x, y, username:string, texture, frame, char_name) {
        //texture refers to what is loaded in preloader with json and png files 
        //frame refers to a specific frame in the json file 
        //char_name is an identifier for the anims, corresponds to the keys in anims creation (e.g. CharacterAnims)
        //anims doesnt worry about what texture it is, only sprite constructor does
        super(scene, x, y, texture, frame);

        this.char_name = char_name;
        this.scene = scene;

        // Add this sprite to the scene
        scene.add.existing(this);
        scene.physics.add.existing(this);

        this.body.setSize(this.width * 0.5, this.height * 0.8);
        this.setUsername(username);
    }

    // updateAnims(cursors: Phaser.Types.Input.Keyboard.CursorKeys) {
    //     //for local player update
    //     //right now is not called at all 
    //     console.log("updateAnims")
    //     if (!cursors) return;

    //     const speed = 100;

    //     if (cursors.left?.isDown) {
    //         this.anims.play(`${this.char_name}-walk-side`, true);
    //         this.setVelocity(-speed, 0);
    //         this.flipX = true;
    //     } else if (cursors.right?.isDown) {
    //         this.anims.play(`${this.char_name}-walk-side`, true);
    //         this.setVelocity(speed, 0);
    //         this.flipX = false;
    //     } else if (cursors.up?.isDown) {
    //         this.anims.play(`${this.char_name}-walk-up`, true);
    //         this.setVelocity(0, -speed);
    //     } else if (cursors.down?.isDown) {
    //         this.anims.play(`${this.char_name}-walk-down`, true);
    //         this.setVelocity(0, speed);
    //     } else {
    //         if (this.anims && this.anims.currentAnim != null) {
    //             const parts = this.anims.currentAnim.key.split("-");
    //             parts[1] = "idle"; //keep the direction
    //             //if all the parts are not undefined
    //             if (parts.every((part) => part !== undefined)) {
    //                 this.anims.play(parts.join("-"), true);
    //             }
    //             this.setVelocity(0, 0);
    //         }
    //     }
    // }

    updateAnimsWithServerInfo(player) {
        console.log("updateAnimsWithServerInfo");
        if (!this || !player) return;

        this.x = player.x;
        this.y = player.y;

        var animsDir;
        var animsState;

        switch (player.direction) {
            case "left":
                animsDir = "side";
                this.flipX = true; // Assuming the side animation faces right by default
                break;
            case "right":
                animsDir = "side";
                this.flipX = false;
                break;
            case "up":
                animsDir = "up";
                break;
            case "down":
                animsDir = "down";
                break;
        }

        if (player.isMoving) {
            animsState = "walk";
        } else {
            animsState = "idle";
        }

        if (animsState != undefined && animsDir != undefined && this.char_name != undefined) {
            this.anims.play(`${this.char_name}-` + animsState + "-" + animsDir, true);
        }

        this.username.x = this.x;
        this.username.y = this.y - 20;
    }

    setUsername(username:string) {
        if (username == undefined) {
            this.username = this.scene.add.text(this.x, this.y, "undefined", { fontSize: '12px' });
        } else {
            this.username = this.scene.add.text(this.x, this.y, username, { fontSize: '12px' });
        }
    }

    destroy() {
        super.destroy();
    }

    update() {

    }
}