export default class ClientPlayer extends Phaser.Physics.Arcade.Sprite {
    private username: string | undefined;
    private usernameText: Phaser.GameObjects.Text;

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

    setUsername(username: string) {
        if (!this || !username) return
        console.log('setting usernmae', username);
        //set both the field and the text object
        this.username = username;
        this.usernameText = this.scene.add.text(this.x, this.y - 20, username, {
            fontSize: "10px",
            color: "#ffffff",
            fontStyle: "bold",
        });
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
                //if all the parts are not undefined
                if (parts.every((part) => part !== undefined)) {
                    this.anims.play(parts.join("-"), true);
                }
                this.setVelocity(0, 0);
            }
        }  

        this.usernameText.x = this.x;
        this.usernameText.y = this.y - 20;
    }


    updateAnimsWithServerInfo(player) {
        console.log("update anims wiht server info")
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

        if (!this.usernameText) return;
        console.log('setting usernameText posiiotn')
        this.usernameText.x= this.x;
        this.usernameText.y = this.y - 20;
    }

    update() {

    }
}