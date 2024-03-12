import Phaser from 'phaser';
import { Room } from 'colyseus.js'; // Import the 'Room' namespace from 'colyseus.js'
export default class ClientPlayer extends Phaser.Physics.Arcade.Sprite {
    direction: string;
    flipX: boolean;

    constructor(scene: Phaser.Scene, x: number, y: number, texture: string, frame: string) {
        super(scene, x, y, texture, frame);
        // Add this sprite to the scene
        scene.add.existing(this);

        // Enable physics for this sprite
        scene.physics.add.existing(this);
        this.body.setSize(this.width * 0.5, this.height * 0.8);

        // Set the animation
        this.anims.play("faune-idle-down");
    }
    syncPlayerWithServer(cursors, room: Room) { // Update the type of 'room' parameter to use 'Room' from 'colyseus.js'
        const velocity = 2;

        if (cursors.left.isDown) {
            this.x -= velocity;
            this.direction = "left";
        } else if (cursors.right.isDown) {
            this.x += velocity;
            this.direction = "right";
        } else if (cursors.up.isDown) {
            this.y -= velocity;
            this.direction = "up";
        } else if (cursors.down.isDown) {
            this.y += velocity;
            this.direction = "down";
        }  // Send the new position to the server
        room.send("move", { x: this.x, y: this.y, direction: this.direction });
    }

    updatePositionAndAnims(newX, newY, direction: string, isMoving: boolean) {
        this.x = newX
        this.y = newY
        var animsDir;
        var animsState;
        switch (direction) {
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

        if (isMoving) {
            animsState = "walk";
        } else {
            animsState = "idle";
        }
        this.anims.play("faune-" + animsState + "-" + animsDir, true);
    }

    updateLocalAnimsGivenCursors(cursors) {
        if (!cursors) return;

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
                this.anims.play(parts.join("-"), true);
                this.setVelocity(0, 0);
            }
        }
    }

    update() {
        // Update the position of the health bar to follow the player
    }
}