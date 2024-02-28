export class ButtonCreator {
  static createButton(
    scene,
    { x, y, width, height, text, onClick, onHover, onOut }
  ) {
    // Define button dimensions and position
    const buttonX = x;
    const buttonY = y;
    const buttonWidth = width;
    const buttonHeight = height;

    // Create a Graphics object for the button
    let button = scene.add
      .graphics()
      .setDepth(1)
      .fillStyle(0x000000, 0.5) // Default background color
      .fillRoundedRect(buttonX, buttonY, buttonWidth, buttonHeight, 5)
      .lineStyle(2, 0xffffff, 1) // Outline
      .strokeRoundedRect(buttonX, buttonY, buttonWidth, buttonHeight, 5);

    button
      .setInteractive(
        new Phaser.Geom.Rectangle(buttonX, buttonY, buttonWidth, buttonHeight),
        Phaser.Geom.Rectangle.Contains
      )
      .setScrollFactor(0);

    let buttonText = scene.add
      .text(buttonX + buttonWidth / 2, buttonY + buttonHeight / 2, text, {
        color: "#ffffff",
        fontSize: "11px",
        fontStyle: "bold",
      })
      .setDepth(1)
      .setScrollFactor(0)
      .setOrigin(0.5);

    button.on("pointerover", () => {
      if (onHover) {
        onHover(button, buttonText);
      } else {
        button
          .clear()
          .fillStyle(0x00ff00, 0.5)
          .fillRoundedRect(buttonX, buttonY, buttonWidth, buttonHeight, 5)
          .lineStyle(2, 0xffffff, 1)
          .strokeRoundedRect(buttonX, buttonY, buttonWidth, buttonHeight, 5);
        buttonText.setStyle({ fill: "#000000" });
      }
    });

    button.on("pointerout", () => {
      if (onOut) {
        onOut(button, buttonText);
      } else {
        button
          .clear()
          .fillStyle(0x000000, 0.5) // Revert background color
          .fillRoundedRect(buttonX, buttonY, buttonWidth, buttonHeight, 5)
          .lineStyle(2, 0xffffff, 1)
          .strokeRoundedRect(buttonX, buttonY, buttonWidth, buttonHeight, 5);
        buttonText.setStyle({ fill: "#ffffff" }); // Revert text color
      }
    });

    button.on("pointerdown", onClick);

    return { button, buttonText };
  }
}
