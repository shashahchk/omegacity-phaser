// @ts-nocheck
import { HealthBar } from "~/components/HealthBar";

export default class ClientInBattlePlayer extends Phaser.Physics.Arcade.Sprite {
    //cannot make other classes extend directly from this, must extend from sprite to use physics(?)
    private healthBar: HealthBar;
    public scene: Phaser.Scene;
    constructor(scene, x, y, texture, frame, char_name) {
        super(scene, x, y, texture, frame);

        this.char_name = char_name;
        this.scene = scene;
        this.healthBar = new HealthBar(scene, x, y);

        scene.add.existing(this);
        scene.physics.add.existing(this);

        this.body.setSize(this.width * 0.5, this.height * 0.8);
    }

    setPosition(x, y) {
        this.x = x
        this.y = y

        if (this.healthBar) {
            this.healthBar.setPositionRelativeToPlayer(x, y);
        }
    }

    updateAnimsWithServerInfo(player) {
        console.log("updateAnimsWithServerInfo");
        console.log("player", player)
        if (!this || !player) return;

        if (player.x == undefined || player.y == undefined) return;
        this.x = player.x;
        this.y = player.y;

        var animsDir;
        var animsState;

        if (player.direction == undefined) return;

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

        if (player.isMoving != undefined && player.isMoving) {
            animsState = "walk";
        } else {
            animsState = "idle";
        }

        if (animsState != undefined && animsDir != undefined && this.char_name != undefined) {
            this.anims.play(`${this.char_name}-` + animsState + "-" + animsDir, true);
        }
        console.log("reached here")
        this.healthBar.setPositionRelativeToPlayer(this.x, this.y);
    }

    // updateAnims(cursors: Phaser.Types.Input.Keyboard.CursorKeys) {
    //     //for local player update
    //     //right now is not called at all, since already handled by the update with server info
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

    //     this.healthBar.setPositionRelativeToPlayer(this.x, this.y);
    // }

    update(cursors) {
        // if (cursors.left.isDown) {
        //     this.setVelocityX(-80);
        // } else if (cursors.right.isDown) {
        //     this.setVelocityX(80);
        // } else {
        //     this.setVelocityX(0);
        // }
        // if (cursors.up.isDown) {
        //     this.setVelocityY(-80);
        // } else if (cursors.down.isDown) {
        //     this.setVelocityY(80);
        // } else {
        //     this.setVelocityY(0);
        // }
    }

    destroy() {
        this.healthBar.destroy();
        super.destroy();
    }

    updateHealthWithServerInfo(player) {
        if (!player || !player.health) {
            return;
        }
        this.healthBar.updateHealth(player.health);
    }

    updateHealth(newHealth:number) {
        this.healthBar.updateHealth(newHealth);
    }
}