// @ts-nocheck
import { HealthBar } from "~/components/HealthBar";

export default class ClientPlayer extends Phaser.Physics.Arcade.Sprite {
    //cannot make other classes extend directly from this, must extend from sprite to use physics(?)
    private healthBar: HealthBar;
    constructor(scene, x, y, texture, frame) {
        super(scene, x, y, texture, frame);
        // Add this sprite to the scene
        scene.add.existing(this);
        this.healthBar = new HealthBar(scene, x, y);

        // Enable physics for this sprite
        scene.physics.add.existing(this);
        this.body.setSize(this.width * 0.5, this.height * 0.8);

        // Set the animation
        this.anims.play("faune-idle-down");

    }

    updateAnimsWithServerInfo(player) {
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

        if (animsState != undefined && animsDir != undefined) {
            this.anims.play("faune-" + animsState + "-" + animsDir, true);
        }
        this.healthBar.setPosition(this.x, this.y, this.body.width);
    }

    updateAnims(cursors: Phaser.Types.Input.Keyboard.CursorKeys) {
        if (!cursors || !this) return;

        const speed = 100;

        if (cursors.left?.isDown) {
            this.anims.play("faune-walk-side", true);
            this.setVelocity(-speed, 0);
            this.flipX = true;
        } else if (cursors.right?.isDown) {
            this.anims.play("faune-walk-side", true);
            this.setVelocity(speed, 0);
            this.flipX = false;
        } else if (cursors.up?.isDown) {
            this.anims.play("faune-walk-up", true);
            this.setVelocity(0, -speed);
        } else if (cursors.down?.isDown) {
            this.anims.play("faune-walk-down", true);
            this.setVelocity(0, speed);
        } else {
            if (this.anims && this.anims.currentAnim != null) {
                const parts = this.anims.currentAnim.key.split("-");
                parts[1] = "idle"; //keep the direction
                
                if (parts.every((part) => part !== undefined)) {
                    this.anims.play(parts.join("-"), true);
                }
                this.setVelocity(0, 0);
            }
        }

        this.healthBar.setPosition(this.x, this.y, this.body.width);
    }

    update(cursors) {
        if (cursors.left.isDown) {
            this.setVelocityX(-80);
        } else if (cursors.right.isDown) {
            this.setVelocityX(80);
        } else {
            this.setVelocityX(0);
        }
        if (cursors.up.isDown) {
            this.setVelocityY(-80);
        } else if (cursors.down.isDown) {
            this.setVelocityY(80);
        } else {
            this.setVelocityY(0);
        }
    }
}