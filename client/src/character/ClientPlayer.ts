import * as Colyseus from "colyseus.js";
import { Physics } from "phaser";

export default class ClientPlayer extends Phaser.Physics.Arcade.Sprite {
    private charName: string;
    public scene: Phaser.Scene;
    private username: Phaser.GameObjects.Text;
    private playerEXP: Phaser.GameObjects.Text;

    private Y_OFFSET_FROM_HEAD = 20;

    constructor(scene, x, y, username: string, texture, frame, charName, playerEXP) {
        //texture refers to what is loaded in preloader with json and png files 
        //frame refers to a specific frame in the json file 
        //charName is an identifier for the anims, corresponds to the keys in anims creation (e.g. CharacterAnims)
        //anims doesnt worry about what texture it is, only sprite constructor does
        super(scene, x, y, texture, frame);
<<<<<<< HEAD
        this.char_name = char_name;
=======

        this.charName = charName;
>>>>>>> master
        this.playerEXP = playerEXP;
        this.scene = scene;
        this.setUsername(username);
        this.setPlayerEXP(playerEXP);

        // Add this sprite to the scene
        scene.add.existing(this);
        scene.physics.add.existing(this);

        this.body.setSize(this.width * 0.5, this.height * 0.8);
    }

    updateAnimsAndSyncWithServer(room: Colyseus.Room, cursors: Phaser.Types.Input.Keyboard.CursorKeys) {
        console.log("updateAnims")
        if (!cursors) return;

        const speed = 100;

        if (cursors.left?.isDown) {
            this.anims.play(`${this.charName}-walk-side`, true);
            this.setVelocity(-speed, 0);
            this.flipX = true;
        } else if (cursors.right?.isDown) {
            this.anims.play(`${this.charName}-walk-side`, true);
            this.setVelocity(speed, 0);
            this.flipX = false;
        } else if (cursors.up?.isDown) {
            this.anims.play(`${this.charName}-walk-up`, true);
            this.setVelocity(0, -speed);
        } else if (cursors.down?.isDown) {
            this.anims.play(`${this.charName}-walk-down`, true);
            this.setVelocity(0, speed);
        } else {
            if (this.anims && this.anims.currentAnim != null) {
                const parts = this.anims.currentAnim.key.split("-");
                parts[1] = "idle"; //keep the direction
                //if all the parts are not undefined
                if (parts.every((part) => part !== undefined)) {
                    this.anims.play(parts.join("-"), true);
                }
                this.setVelocity(0, 0);
            }
        }

        this.setPlayerEXPPosition(this.playerEXP)
        this.setUsernamePosition(this.username)

        if (cursors.left?.isDown || cursors.right?.isDown || cursors.up?.isDown || cursors.down?.isDown) {
            room.send("move", { x: this.x, y: this.y, direction: this.flipX ? "left" : "right" })
        }
    }

    updateAnimsWithServerInfo(player) {
        console.log("updateAnimsWithServerInfo");
        if (!this || !player) return;

        if (player.x == undefined || player.y == undefined) return;
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

        if (animsState != undefined && animsDir != undefined && this.charName != undefined) {
            this.anims.play(`${this.charName}-` + animsState + "-" + animsDir, true);
        }
        this.setUsernamePosition(this.username)
        this.setPlayerEXPPosition(this.playerEXP)
    }

    setUsername(username: string) {
        if (username == undefined) {
            this.username = this.scene.add.text(this.x, this.y, "undefined", { fontSize: '12px' });
        } else {
            this.username = this.scene.add.text(this.x, this.y, username, { fontSize: '12px' });
        }
    }

    setPlayerEXP(playerEXP: number) {
        if (playerEXP == undefined) {
            this.playerEXP = this.scene.add.text(this.x, this.y, "undefined", { fontSize: '12px' });
        } else {
            this.playerEXP = this.scene.add.text(this.x, this.y, playerEXP.toString() + " EXP", { fontSize: '12px' });
        }
    }

    setUsernamePosition(username: Phaser.GameObjects.Text) {
        username.x = this.x - username.width / 2;
        username.y = this.y - this.Y_OFFSET_FROM_HEAD;
    }

    setPlayerEXPPosition(playerEXP: Phaser.GameObjects.Text) {
        playerEXP.x = this.x - playerEXP.width / 2;
        playerEXP.y = this.y - 40;

    }

    destroy() {
        super.destroy();
        this.username.destroy();
        this.playerEXP.destroy();
    }

    update() {

    }
}