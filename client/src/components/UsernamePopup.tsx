export class UsernamePopup {
  scene: any;
  popup: any;
  input: any;
  confirmButton: any;
  onSubmit: any;
  textLabel: any;
  constructor(scene, onSubmit) {
    this.scene = scene;
    this.onSubmit = onSubmit;
    this.popup = null;
    this.input = null;
    this.confirmButton = null;
    this.textLabel = null;
    this.createPopup();
  }

  createPopup() {
    const popupWidth = 800;
    const popupHeight = 400;
    const xOffset = - 180;
    const x =
      this.scene.cameras.main.worldView.x + this.scene.cameras.main.width / 2;
    const y =
      this.scene.cameras.main.worldView.y + this.scene.cameras.main.height / 2;

    // Background
    this.popup = this.scene.add.graphics({
      x: x - popupWidth / 2,
      y: y - popupHeight / 2,
    });
    this.popup.fillStyle(0x000000, 0.8);
    this.popup.fillRect(0, 0, popupWidth, popupHeight).setScrollFactor(0);

    // Text prompt
    this.textLabel = this.scene.add
      .text(x + xOffset, y - 60, "Enter your username:", {
        fontSize: "20px",
        color: "#ffffff",
      })
      .setOrigin(0.5)
      .setScrollFactor(0);

    // Input field
    this.input = this.scene.add
      .dom(x + xOffset, y)
        .createFromHTML(
          '<input type="text" name="username" style="padding: 10px; width: 300px;" autocomplete="off">',
        );      
    this.input.setScrollFactor(0);


    // Confirm button
    this.confirmButton = this.scene.add
      .text(x + xOffset, y + 60, "Confirm", {
        fontSize: "20px",
        color: "#ffffff",
        backgroundColor: "#0000ff",
        padding: { x: 10, y: 5 },
      })
      .setOrigin(0.5)
      .setScrollFactor(0)
      .setInteractive({ useHandCursor: true })
      .on("pointerdown", () => this.submit());
  }

  submit() {
    const username = this.input.getChildByName("username").value;
    if (username) {
      this.onSubmit(username);
      this.destroy();
    }
  }

  destroy() {
    if (this.popup) this.popup.destroy();
    if (this.input) this.input.destroy();
    if (this.confirmButton) this.confirmButton.destroy();
    if (this.textLabel) this.textLabel.destroy();
  }
}
