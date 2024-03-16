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

    setPosition(x:number, y:number) {
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

    update(cursors) {
    }

    destroy() {
        this.healthBar.destroy();
        super.destroy();
    }

    decreaseHealth(amount:number) {
        this.healthBar.decreaseHealth(amount);
    }
}