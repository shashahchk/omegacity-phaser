import Phaser from 'phaser';

export class HealthBar {
    constructor(private scene: Phaser.Scene, private x: number, private y: number) {
        this.healthBar = this.scene.add.graphics();

        //move to centralise relative to player
        this.updateHealthBar();
    }

    private health: number = 100;
    private healthBar: Phaser.GameObjects.Graphics;
    private maxHealth: number = 100; // Set max health value
    private healthBarLength: number = 40;
    private healthBarHeight: number = 5;
    private distFromHead: number = 20;

    updateHealthBar() {
        this.healthBar.clear();

        // Draw the background
        this.healthBar.fillStyle(0xffffff); // White
        this.healthBar.fillRect(this.x, this.y, this.healthBarLength, this.healthBarHeight);

        // Change color based on health
        if (this.health / this.maxHealth < 0.3) {
            this.healthBar.fillStyle(0xff0000); // Red
        } else if (this.health / this.maxHealth < 0.6) {
            this.healthBar.fillStyle(0xffa500); // Orange
        } else {
            this.healthBar.fillStyle(0x00ff00); // Green
        }

        // Calculate Length based on health
        let healthLength = (this.health / this.maxHealth) * this.healthBarLength;

        // Draw the health bar on top of the background
        this.healthBar.fillRect(this.x, this.y, healthLength, this.healthBarHeight);
    }

    decreaseHealth(amount: number) {
        this.health -= amount;
        this.updateHealthBar();
    }

    setPosition(x: number, y: number, playerLength) {
        this.x = x - this.healthBarLength / 2;
        this.y = y - this.distFromHead;
        this.updateHealthBar();
    }
}