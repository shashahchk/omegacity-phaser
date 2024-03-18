import ClientInBattleMonster from "~/character/ClientInBattleMonster";

export class QuestionPopup {
  scene: any;
  popup: any;
  input: any;
  confirmButton: any;
  questions: string[];
  textLabel: any;
  scrollablePanel: any;
  options: string[][];
  optionBoxes: any[]; // Array to keep references to option graphics and text
  closeButton: any; // Reference to the close button
  container: Phaser.GameObjects.Container;
  monsterID: number;
  playerId: number;
  currentQuestionIndex: number;

  questionText: Phaser.GameObjects.Text;
  optionTexts: Phaser.GameObjects.Text[];

  selectedOption: Phaser.GameObjects.Text;


  constructor(scene, monster: ClientInBattleMonster, playerId: number) {
    this.playerId = playerId;
    this.scene = scene;
    this.popup = null;
    this.input = null;
    this.confirmButton = null;
    this.textLabel = null;
    this.scrollablePanel = null;
    this.options = monster.getOptions();
    this.optionBoxes = []; // Initialize the array
    this.closeButton = null;
    this.questions = monster.getQuestions();
    this.monsterID = monster.getId();
    this.currentQuestionIndex = playerId;

    this.questionText = null;
    this.optionTexts = [];
    // Create the container and position it in the center of the camera's viewport
  }

  createPopup(monsterIndex: number, questionIndex: number) {
    const popupOffset = { x: 190, y: 0 }; // Adjust as needed

    this.container = this.scene.add.container();
    // this.container.setScrollFactor(0);
    const popupWidth = 600; // Adjusted for larger content
    const popupHeight = 500;
    const x = this.scene.cameras.main.centerX + popupOffset.x;
    const y = this.scene.cameras.main.centerY + popupOffset.y;
    this.container.setScrollFactor(0);

    // Popup Background
    this.popup = this.scene.add
      .graphics({
        x: x - popupWidth / 2,
        y: y - popupHeight / 2,
      })
      .fillStyle(0x000000, 0.8)
      .fillRoundedRect(0, 0, popupWidth, popupHeight, 20);

    const closeButton = this.scene.add
      .text(x + popupWidth / 2 - 20, y - popupHeight / 2 + 5, "X", {
        fontSize: "20px",
        color: "#ffffff",
        backgroundColor: "#ff0000",
        padding: {
          left: 5,
          right: 5,
          top: 5,
          bottom: 5,
        },
      })
      .setInteractive();

    // Close button functionality
    closeButton.on("pointerdown", () => {
      this.closePopup(); // Function to close/hide the popup
    });

    // Ensuring the close button does not move with the camera
    this.container.add(this.popup);
    this.container.add(closeButton);
    closeButton.setScrollFactor(0);

    // Creating a RexUI Scrollable Panel for the text area
    const scrollablePanel = this.scene.rexUI.add
      .scrollablePanel({
        x: x,
        y: y - 100, // Adjust for positioning
        width: popupWidth - 40, // Slightly less than popup width for padding
        height: 200, // Adjusted height for text area
        scrollMode: 0, // Vertical scroll

        background: this.scene.rexUI.add.roundRectangle(
          0,
          0,
          2,
          2,
          10,
          0x4e4e4e,
        ), // Optional: Adding a background to the scrollable area

        panel: {
          child: this.scene.add.text(0, 0, "", {
            fontSize: "20px",
            color: "#ffffff",
            wordWrap: { width: popupWidth - 100 }, // Ensure word wrap width is correct
          }),

          mask: { padding: 1 },
        },

        slider: {
          track: this.scene.rexUI.add.roundRectangle(
            0,
            0,
            20,
            10,
            10,
            0x797979,
          ),
          thumb: this.scene.rexUI.add.roundRectangle(0, 0, 0, 0, 13, 0xffffff),
        },

        space: {
          left: 20,
          right: 20,
          top: 20,
          bottom: 20,
          panel: 10,
        },
      })
      .layout();

    // Set the text for question
    this.questionText = scrollablePanel.getElement("panel").setText(this.questions[this.currentQuestionIndex]);

    // Set the scrollable panel to not move with the camera
    this.container.add(scrollablePanel);

    // Options setup remains the same as your original code

    const optionWidth = popupWidth - 80;
    const optionHeight = 40;
    const borderRadius = 10;
    let optionStartY = y + 50; // Adjust start Y position for options

    const nextButton = this.scene.add.text(x + 20 + popupWidth / 4, y + popupHeight / 2 - 30, "Next", {
      fontSize: "20px",
      color: "#ffffff",
      backgroundColor: "#008000",
      padding: { left: 5, right: 5, top: 5, bottom: 5 },
    }).setInteractive();
    nextButton.on("pointerdown", () => this.nextQuestion());

    const backButton = this.scene.add.text(x + popupWidth / 4, y + popupHeight / 2 - 30, "Back", {
      fontSize: "20px",
      color: "#ffffff",
      backgroundColor: "#800000",
      padding: { left: 5, right: 5, top: 5, bottom: 5 },
    }).setInteractive();
    backButton.on("pointerdown", () => this.previousQuestion());

    const submitButton = this.scene.add.text(x + popupWidth / 2, y + popupHeight / 2 - 30, "Back", {
      fontSize: "20px",
      color: "#ffffff",
      backgroundColor: "#800000",
      padding: { left: 5, right: 5, top: 5, bottom: 5 },
    }).setInteractive();
    backButton.on("pointerdown", () => this.submitAnswer());

    this.container.add([nextButton, backButton]);
    nextButton.setScrollFactor(0);
    backButton.setScrollFactor(0);


    this.options[this.currentQuestionIndex].forEach((option, index) => {
      let optionY = optionStartY + index * (optionHeight + 10);
      let optionBox = this.scene.add
        .graphics()
        .fillStyle(0xffffff, 0.5)
        .fillRoundedRect(
          x - optionWidth / 2,
          optionY - optionHeight / 2,
          optionWidth,
          optionHeight,
          borderRadius,
        )
        .lineStyle(2, 0xffffff)
        .strokeRoundedRect(
          x - optionWidth / 2,
          optionY - optionHeight / 2,
          optionWidth,
          optionHeight,
          borderRadius,
        );
      let optionText = this.scene.add
        .text(x, optionY, option, {
          fontSize: "16px",
          color: "#000000",
        })
        .setOrigin(0.5);
      this.optionTexts.push(optionText);

      let hitArea = new Phaser.Geom.Rectangle(0, 0, optionWidth, optionHeight);
      let interactiveZone = this.scene.add
        .zone(x, optionY, optionWidth, optionHeight)
        .setOrigin(0.5)
        .setInteractive({
          hitArea: hitArea,
          hitAreaCallback: Phaser.Geom.Rectangle.Contains,
          useHandCursor: true,
        })
        .on("pointerdown", () =>
          this.onOptionSelected(option, monsterIndex, questionIndex),
        );

      // Set elements to not move with the camera
      // optionBox.setScrollFactor(0);
      // optionText.setScrollFactor(0);
      // interactiveZone.setScrollFactor(0);
      this.container.add([optionBox, optionText, interactiveZone]);
      interactiveZone.setScrollFactor(0);
    });

    // inform server that this player is tackling this question

    // Set the popup background to not move with the camera
    // this.popup.setScrollFactor(0);

    this.scene.room.onMessage("monsterAbandoned" + this.monsterID, () => {
      if (this.popup) {
        if (this.popup) this.popup.destroy();
        // Destroy the scrollable panel
        if (this.scrollablePanel) this.scrollablePanel.destroy();
        // Destroy each option box and text
        this.container.destroy();
      }
    });
  }

  sendServerdMonsterAttackRequest() {
    console.log("Sending monster attack request to server");
    this.scene.room.send("playerStartMonsterAttack", {
      monsterID: this.monsterID,
    });
  }

  abandon() {
    console.log("Sending request to stop monster attack to server");
    this.scene.room.send("abandon" + this.monsterID, {});
  }

  nextQuestion() {
    if (this.currentQuestionIndex < this.questions.length - 1) {
      this.currentQuestionIndex++;
      this.updatePopup();
    }
  }

  previousQuestion() {
    if (this.currentQuestionIndex > 0) {
      this.currentQuestionIndex--;
      this.updatePopup();
    }
  }

  // Modify the submitAnswer method
  submitAnswer() {
    if (this.playerId !== this.currentQuestionIndex) {
      console.log("This is not your question to answer");
      return;
    }

    if (!this.selectedOption) {
      console.log("No option selected");
      return;
    }

    this.answers(this.scene, this.monsterID, this.currentQuestionIndex, this.selectedOption.text);
  }

  closePopup() {
    // Destroy the popup background
    if (this.popup) this.popup.destroy();
    // Destroy the scrollable panel
    if (this.scrollablePanel) this.scrollablePanel.destroy();
    // Destroy each option box and text
    this.container.destroy();
    console.log("question popup closed");
    this.abandon();
  }

  // should only be able to select if playerId == questionIndex
  // the particular option should look different from the rest if successful selected 
  onOptionSelected(selected: string, monsterIndex: number, questionIndex: number) {
    if (this.playerId !== questionIndex) {
      console.log("This is not your question to answer");
      return;
    }

    console.log(`Option ${selected} selected`);

    // Change the color of the selected option to differentiate it
    this.optionTexts.forEach((optionText) => {
      if (optionText.text === selected) {
        optionText.setColor("#ff0000"); // Change the color to red
        this.selectedOption = optionText;
      } else {
        optionText.setColor("#000000"); // Change other options back to black
      }
    });
  }

  updatePopup() {
    // Update the question text
    this.questionText.setText(this.questions[this.currentQuestionIndex]);

    // Update the option texts
    this.options[this.currentQuestionIndex].forEach((option, index) => {
      if (index < this.optionTexts.length) {
        this.optionTexts[index].setText(option);
      }
    });
  }

  answers = (
    scene: Phaser.Scene,
    monsterId: number,
    questionId: number,
    answer: string,
  ) => {
    const payload = {
      monsterID: monsterId,
      questionID: questionId,
      answer: answer,
    };
    scene.room.send("answerQuestion", payload);
    console.log("Correct Answer verification requested");
  };
}
