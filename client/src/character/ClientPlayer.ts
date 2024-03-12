export default class ClientPlayer extends Phaser.Physics.Arcade.Sprite {
    constructor(scene, x, y, texture, frame) {
        super(scene, x, y, texture, frame);
        // Add this sprite to the scene
        scene.add.existing(this);

        // Enable physics for this sprite
        scene.physics.add.existing(this);
        this.body.setSize(this.width * 0.5, this.height * 0.8);

        // Set the animation
        this.anims.play("faune-idle-down");

    }

    updateAnims(cursors: Phaser.Types.Input.Keyboard.CursorKeys) {
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