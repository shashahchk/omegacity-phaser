// @ts-nocheck
import { HealthBar } from "~/components/HealthBar";

export default class ClientInBattleMonster extends Phaser.Physics.Arcade.Sprite {
    //cannot make other classes extend directly from this, must extend from sprite to use physics(?)
    private healthBar: HealthBar;
    public scene: Phaser.Scene;
    constructor(scene, x, y, texture, frame) {
        super(scene, x, y, texture, frame);

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
            this.healthBar.setPositionRelativeToMonster(x, y);
        }
    }

    update(cursors) {
    }

    destroy() {
        this.healthBar.destroy();
        this.anims.play("golem1-die", true);
        // super.destroy();
    }

    decreaseHealth(amount:number) {
        this.healthBar.decreaseHealth(amount);
    }
}