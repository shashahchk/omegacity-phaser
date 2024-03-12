import Phaser from 'phaser';
import { HealthBar } from '../components/HealthBar';
import { Room } from 'colyseus.js'; // Import the 'Room' namespace from 'colyseus.js'
import ClientPlayer from './ClientPlayer';

export default class ClientInBattlePlayer extends ClientPlayer {
    healthBar: HealthBar;

    constructor(scene: Phaser.Scene, x: number, y: number, texture: string, frame: string) {
        super(scene, x, y, texture, frame);
        // Add health bar
        this.healthBar = new HealthBar(scene, x, y);
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

        this.healthBar.setPosition(newX, newY, this.body.width);
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

        this.healthBar.setPosition(this.x, this.y, this.body.width);
    }

    update() {
        // Update the position of the health bar to follow the player
        this.healthBar.setPosition(this.x, this.y, this.body.width);
    }
}