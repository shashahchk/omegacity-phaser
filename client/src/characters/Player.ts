import Phaser from 'phaser';
import { HealthBar } from '../components/HealthBar';
import { Player } from '../../../server/src/rooms/schema/Character';
import { Room } from 'colyseus.js'; // Import the 'Room' namespace from 'colyseus.js'
export default class ClientPlayer extends Phaser.Physics.Arcade.Sprite {
    healthBar: HealthBar;
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

        // Add health bar
        this.healthBar = new HealthBar(scene, x, y - 20);

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

    updateAnims(cursors) {
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
        this.healthBar.setPosition(this.x, this.y - 20);
    }
}