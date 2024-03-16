// @ts-nocheck
import { HealthBar } from "~/components/HealthBar";

export default class ClientInBattlePlayer extends Phaser.Physics.Arcade.Sprite {
  //cannot make other classes extend directly from this, must extend from sprite to use physics(?)
  private healthBar: HealthBar;
  public scene: Phaser.Scene;
  private username: Phaser.GameObjects.Text;

  constructor(scene, x, y, username: string, texture, frame, char_name, playerEXP) {
    super(scene, x, y, texture, frame);
    scene.playerEntities[scene.room.sessionId] = this;

    this.char_name = char_name;
    this.scene = scene;
    this.healthBar = new HealthBar(scene, x, y);
    this.setUsername(username);

    scene.add.existing(this);
    scene.physics.add.existing(this);

    this.body.setSize(this.width * 0.5, this.height * 0.8);
  }

  setPosition(x: number, y: number) {
    this.x = x;
    this.y = y;

    if (this.healthBar) {
      this.healthBar.setPositionRelativeToPlayer(x, y);
    }
  }

  setUsername(username: string) {
    if (username == undefined) {
      this.username = this.scene.add.text(this.x, this.y, "undefined", { fontSize: '12px' });
    } else {
      this.username = this.scene.add.text(this.x, this.y, username, { fontSize: '12px' });
    }
  }

  updateAnimsWithServerInfo(player) {
    console.log("updateAnimsWithServerInfo");
    console.log("player", player);
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

    if (
      animsState != undefined &&
      animsDir != undefined &&
      this.char_name != undefined
    ) {
      this.anims.play(`${this.char_name}-` + animsState + "-" + animsDir, true);
    }
    console.log("reached here");
    this.healthBar.setPositionRelativeToPlayer(this.x, this.y);
    this.username = this.x;
    this.username = this.y - 30;
  }

  update(cursors) {
    // if (cursors.left.isDown) {
    //     this.setVelocityX(-80);
    // } else if (cursors.right.isDown) {
    //     this.setVelocityX(80);
    // } else {
    //     this.setVelocityX(0);
    // }
    // if (cursors.up.isDown) {
    //     this.setVelocityY(-80);
    // } else if (cursors.down.isDown) {
    //     this.setVelocityY(80);
    // } else {
    //     this.setVelocityY(0);
    // }
  }

  destroy() {
    this.healthBar.destroy();
    super.destroy();
  }

  updateHealthWithServerInfo(player) {
    if (!player || !player.health) {
      return;
    }
    this.healthBar.updateHealth(player.health);
  }

  updateHealth(newHealth: number) {
    this.healthBar.updateHealth(newHealth);
  }
}
