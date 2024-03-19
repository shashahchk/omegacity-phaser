export class ButtonCreator {
  static createButton(
    scene,
    { x, y, width, height, text, onClick, onHoverBoxColor, onOutBoxColor}
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
      .fillStyle(onOutBoxColor, 0.5) // Updated background color
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
        fontSize: "16px", // Increased font size
        fontStyle: "bold",
        fontFamily: "Arial", // Added font family
        padding: { left: 5, right: 5, top: 5, bottom: 5 }, // Added padding
      })
      .setDepth(1)
      .setScrollFactor(0)
      .setOrigin(0.5);

    button.on("pointerover", () => {
      button
        .clear()
        .fillStyle(onHoverBoxColor, 0.5) // Use the provided color
        .fillRoundedRect(buttonX, buttonY, buttonWidth, buttonHeight, 5)
        .lineStyle(2, 0xffffff, 1) // Outline
        .strokeRoundedRect(buttonX, buttonY, buttonWidth, buttonHeight, 5);
    });

    button.on("pointerout", () => {
      button
        .clear()
        .fillStyle(onOutBoxColor, 0.5) // Use the provided color
        .fillRoundedRect(buttonX, buttonY, buttonWidth, buttonHeight, 5)
        .lineStyle(2, 0xffffff, 1) // Outline
        .strokeRoundedRect(buttonX, buttonY, buttonWidth, buttonHeight, 5);
    });

    button.on("pointerdown", onClick);

    return { button, buttonText };
  }
}