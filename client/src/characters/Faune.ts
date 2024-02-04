import Phaser from 'phaser'

export default class Faune extends Phaser.Physics.Arcade.Sprite {
    constructor(scene: Phaser.Scene, x: number, y: number, texture: string, frame?: string | number) {
        super(scene, x, y, texture, frame)

        this.anims.play('faune-idle-down')
    }

    // The preUpdate method is called before the update method. It's often used for logic that needs to run before the main game update, such as preparing data or updating the state of game objects.
    protected preUpdate(time: number, delta: number): void {
        super.preUpdate(time, delta)

        // Update the faune's velocity or other properties here
    }

    update(cursors, t: number, dt: number): boolean {
        const speed = 100;
        let moved = false;
        console.log('update ion faune called')

        if (cursors.left?.isDown) {
            this.anims.play('faune-walk-side', true);
            this.setVelocity(-speed, 0);
            this.scaleX = -1;
            this.body.offset.x = 24;
            moved = true;
        }
        else if (cursors.right?.isDown) {
            this.anims.play('faune-walk-side', true)
            this.setVelocity(speed, 0)
            this.scaleX = 1
            this.body.offset.x = 8
            moved = true
        } else if (cursors.up?.isDown) {
            this.anims.play('faune-walk-up', true)
            this.setVelocity(0, -speed)
            moved = true
        } else if (cursors.down?.isDown) {
            this.anims.play('faune-walk-down', true)
            this.setVelocity(0, speed)
            moved = true
        } else {
            const parts = this.anims.currentAnim.key.split("-")
            parts[1] = 'idle' //keep the direction
            this.anims.play((parts).join("-"), true)
            this.setVelocity(0, 0)
            moved = true
        }

        return moved;
    }
}
