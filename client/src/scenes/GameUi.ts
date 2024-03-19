import Phaser from "phaser";
import UIPlugin from "phaser3-rex-plugins/templates/ui/ui-plugin.js";
import BBCodeText from "phaser3-rex-plugins/plugins/bbcodetext.js";
import * as Colyseus from "colyseus.js";

export default class GameUi extends Phaser.Scene {
  rexUI: UIPlugin;
  private room: Colyseus.Room | undefined; //room is a property of the class
  private messageBox: any; // Assuming rexUI types are not strongly typed in your setup
  private userListBox: any;
  private chatPanel: any; // rex ui sizer
  private inputPanel: any; // rex ui sizer
  private mainPanel: any; // rex ui sizer
  private upperPanel: any; // rex ui sizer
  private client: Colyseus.Client | undefined;
  private spaceKey: Phaser.Input.Keyboard.Key;
  private isFocused = false;
  private inputBox: any;
  private channelText: any;
  private enterKey: Phaser.Input.Keyboard.Key;
  private usernameBox: any;
  private username: string;
  private lobbyChannelList = ["all"];
  private battleChannelList = ["all", "team"];
  private currentChannel = "all";
  private currentChannelIndex = 0;
  private currentChannelType = "all";
  private currentScene: string; // lobby/game or battle

  constructor() {
    super({ key: "game-ui" }); //can handle both object and string
  }

  setUpPressEvents() {
    this.input.on("pointerdown", (pointer) => {
      // Check if the click is outside the mainPanel
      const isOutside = !this.mainPanel
        .getBounds()
        .contains(pointer.x, pointer.y);

      if (isOutside) {
        // Emit an event or handle the outside click directly
        this.events.emit("clickedOutside");
        this.isFocused = false;
      }
    });

    // Listen for the event when space key is pressed to create a space in the input box
    // for some reason space key cannot be registered by the input box
    this.spaceKey.on("down", () => {
      if (this.isFocused) {
        // Append a space to the inputBox text
        // This assumes inputBox.text is accessible and modifiable.
        // You might need to adapt this depending on how rexUI handles text updates.
        // for some reason this work? any random invalid method will work
        // temporary fix
        this.inputBox.text.appendText(" ");
      }
    });

    this.enterKey.on("down", async () => {
      if (this.isFocused) {
        // Append a space to the inputBox text
        // This assumes inputBox.text is accessible and modifiable.
        // You might need to adapt this depending on how rexUI handles text updates.
        // for some reason this work? any random invalud method will work

        if (this.inputBox.text !== "" && this.username !== undefined) {
          this.events.emit(
            "send-message",
            this.inputBox.text,
            this.usernameBox.text
          );


          this.room.send("sent_message", {
            message: this.inputBox.text,
            channel: this.currentChannel,
            channelType: this.currentChannelType,
          });
          this.inputBox.text = "";
        }
      }
    });
  }

  setUpSceneChat(width: number, height:number) {
    const config = {
      x: width,
      y: this.cameras.main.height - height,
      width: width,
      height: height,
      color: {
        background: 0x0e376f,
        track: 0x3a6ba5,
        thumb: 0xbfcdbb,
        inputBackground: 0x685784,
        inputBox: 0x182456,
      },
      username: this.username,
    }

    this.createChatPanel(config);
    this.createToggleChatButton();
    if (this.mainPanel) {
      this.mainPanel.layout();
    }

    this.setUpPressEvents();
  }

  preload() {
    this.load.scenePlugin({
      key: "rexuiplugin",
      url: "https://raw.githubusercontent.com/rexrainbow/phaser3-rex-notes/master/dist/rexuiplugin.min.js",
      sceneKey: "rexUI",
    });
    this.spaceKey = this.input.keyboard.addKey(
      Phaser.Input.Keyboard.KeyCodes.SPACE,
    );
    this.enterKey = this.input.keyboard.addKey(
      Phaser.Input.Keyboard.KeyCodes.ENTER,
    );
    this.load.image("speech-bubble", "ui/speech-bubble.png")
  }

  create(data) {
    this.currentScene = data.currentScene;
    this.username = data.username;

    this.room.onMessage("newPlayer", ([users]) => {
      users = users.filter((user) => user !== "");
      this.setUserListTextBox(users);
    });

    this.room.onMessage("player_left", ([users]) => {
      this.setUserListTextBox(users);
    });

    this.setUpSceneChat(200, 140);

    // after setting up finished, send a message to the server to update the userlist (mainly for battleroom)
    this.room.send("updatePlayerList");
  }

  setRoom(room: Colyseus.Room) {
    this.room = room;
    // You can now use this.room to listen for messages or send messages

    this.room.onMessage("new_message", (message) => {
      console.log(message);
      this.appendMessage(message);
    });

    if (this.room) {
      console.log("room set");
    }
  }

  setClient(client: Colyseus.Client) {
    this.client = client;
  }

  messageToString(message) {
    return `[${message.senderName}] ${message.message}\n`;
  }

  setMessage(message) {
    var s = this.messageToString(message);
    this.messageBox.appendText(s).scrollToBottom();
  }

  setUserListTextBox(users) {
    console.log(users)
    if (users == undefined) {
      return;
    }
    //remove private chat option for now
    // if (this.currentScene === "battle") {
    //   console.log("battle hence set team");
    //   // this.channelList = ["all", "team", ...users];
      
    // } else {
    //   // this.channelList = ["all", ...users];
    // }
    console.log('reached here')
    if (this.userListBox) {
      // console.log(this.userListBox) ;
      this.userListBox.setText(users.join(", "));
    }
  }

  appendMessage(message) {
    var s = this.messageToString(message);
    this.messageBox.appendText(s).scrollToBottom();
  }

  createMainPanel(config) {
    this.mainPanel = this.rexUI.add.sizer({
      x: config.x,
      y: config.y,
      width: config.width,
      height: config.height,
      orientation: "y",
    });
  }

  createUpperPanel() {
    this.upperPanel = this.rexUI.add.sizer({
      orientation: "x",
    });
  }

  addBackground(config) {
    return this.rexUI.add.roundRectangle(
      0,
      0,
      2,
      2,
      20,
      config.color.background
    );
  }

  createChatPanel(config) {
    //create main panel
    this.createMainPanel(config);

    //create upper panel
    this.createUpperPanel();

    var background = this.addBackground(config);
    
    this.createUserListBox(config);
    this.createMessageBox(config);
    this.createInputPanel(config);

    if (this.mainPanel) {
      console.log("mainPanel created");
    }
    if (this.inputPanel) {
      console.log("inputPanel created");
    }

    this.upperPanel
      .add(
        this.userListBox, //child
        0, // proportion
        "center", // align
        { right: 5 }, // paddingConfig
        true // expand
      )
      .add(
        this.messageBox, //child
        1, // proportion
        "center", // align
        0, // paddingConfig
        true // expand
      );

    if (this.upperPanel) {
      console.log("upperPanel created");
    }

    this.mainPanel
      .addBackground(background)
      .add(
        this.upperPanel, //child
        1, // proportion
        "center", // align
        { top: 10, bottom: 10, left: 5, right: 5 }, // paddingConfig
        true // expand
      )
      .add(
        this.inputPanel, //child
        0.75, // proportion
        "center", // align
        0, // paddingConfig
        true // expand
      );
  }

  createUserListBox(config) {
    var userListBox = this.rexUI.add.textArea({
      width: 150,
      background: this.mainPanel.scene.rexUI.add.roundRectangle(
        0,
        0,
        0,
        0,
        0,
        config.color.inputBox,
        0.5
      ),
      text: this.mainPanel.scene.add.text(0, 0, "Users online", {}),

      slider: false,

      name: "userListBox",
    });
    this.userListBox =  userListBox
  }

  createMessageBox(config) {
    var messageBox = this.mainPanel.scene.rexUI.add.textArea({
      text: this.mainPanel.scene.add.text(0, 0, "", {
        wordWrap: { width: config.wrapWidth, useAdvancedWrap: true },
        fontFamily: '"Press Start 2P", cursive',
        fontSize: "8px",
      }),

      slider: {
        track: this.mainPanel.scene.rexUI.add.roundRectangle(
          0,
          0,
          20,
          10,
          10,
          config.color.track
        ),
        thumb: this.mainPanel.scene.rexUI.add.roundRectangle(
          0,
          0,
          0,
          0,
          10,
          config.color.thumb
        ),
      },

      name: "messageBox",
    });

    this.messageBox = messageBox;
  }

  createInputPanel(config) {
    //create background
    var background = this.mainPanel.scene.rexUI.add.roundRectangle(
      0,
      0,
      2,
      2,
      { bl: 20, br: 20 },
      config.color.inputBackground,
    ); 
    this.usernameBox = this.mainPanel.scene.add.text(0, 0, "", {
      halign: "right",
      valign: "center",
      Width: 50,
      fixedHeight: 20,
    });

    //create channel text, support different channels
    //commented out private chats
    let channelText = this.add
      .text(90, this.cameras.main.height - 30, "all", { color: "#555555" })
      .setDepth(1000)
      .setInteractive({ useHandCursor: true })
      .on("pointerover", () => {
        channelText.setStyle({ fill: "#f00" });
      })
      .on("pointerout", () => {
        channelText.setStyle({ fill: "#ffffff" });
      })
      .on("pointerdown", () => {
        var channelList;
        if (this.currentScene == "battle") {
          channelList = this.battleChannelList;
        } else {
          channelList = this.lobbyChannelList;
        }
        var index = (1 + this.currentChannelIndex) % channelList.length;
        this.currentChannelType = channelList[index];
        channelText.setText(channelList[index]);
        this.currentChannelIndex = index;
        this.currentChannel = channelList[index];
      })
      .setDepth(1000);
      

    this.usernameBox = this.mainPanel.scene.add.text(
      0,
      0,
      this.username,
      {
        halign: "right",
        valign: "center",
        fixedWidth: 50,
        fixedHeight: 20,
      }
    );

    this.inputBox = this.mainPanel.scene.add
      .text(0, 40, "Type your message...", {
        halign: "left",
        valign: "center",
        color: "#888888",
        backgroundColor: `#${config.color.inputBox.toString(16)}`,
        fontFamily: '"Press Start 2P", cursive',
        fontSize: "8px",
        fixedWidth: 250,
        fixedHeight: 40,
      })
      .setInteractive();

    this.inputBox.on("pointerover", () => {
      this.input.setDefaultCursor("text");
    });

    this.inputBox.on("pointerout", () => {
      this.input.setDefaultCursor("default");
    });

    this.inputBox.on("pointerdown", () => {
      if (this.inputBox.text === "Type your message...") {
        this.inputBox.text = "";
        this.inputBox.setStyle({ color: "#ffffff" });
      }
    });

    this.mainPanel.scene.input.on("pointerdown", (pointer) => {
      if (
        !this.inputBox.getBounds().contains(pointer.x, pointer.y) &&
        this.inputBox.text === ""
      ) {
        this.inputBox.text = "Type your message...";
        this.inputBox.setStyle({ color: "#888888" });
      }
    });

    var SendBtn = this.mainPanel.scene.rexUI.add
      .label({
        text: this.mainPanel.scene.add.text(0, 0, "Send", {
          fontFamily: '"Press Start 2P", cursive',
          fontSize: '12px',
          color: "#ffffff",
        }),
        space: { left: 10, right: 10, top: 10, bottom: 10 },
      })
      .setInteractive({ cursor: "pointer" });

    SendBtn.on("pointerover", () => {
      this.mainPanel.scene.input.setDefaultCursor("pointer");
    });

    SendBtn.on("pointerout", () => {
      this.mainPanel.scene.input.setDefaultCursor("default");
    });

    var inputPanel = this.mainPanel.scene.rexUI.add.label({
      height: 40,

      background: background,
      icon: this.usernameBox,
      text: this.inputBox,
      expandTextWidth: true,
      action: SendBtn,

      space: {
        left: 15,
        right: 15,
        top: 0,
        bottom: 0,

        icon: 10,
        text: 10,
      },
    });

    // Control
    SendBtn.setInteractive().on(
      "pointerdown",
      async function () {
        if (this.inputBox.text !== "" && this.username !== undefined) {
          this.events.emit(this.inputBox.text, this.usernameBox.text);
          await this.room.send("sent_message", {
            message: this.inputBox.text,
            channel: this.currentChannel,
            channelType: this.currentChannelType,
          });
          this.inputBox.text = "";
        }
      }.bind(this)
    );

    this.usernameBox.setInteractive().on(
      "pointerdown",
      function () {
        var prevUserName = this.usernameBox.text;
        this.mainPanel.scene.rexUI.edit(
          this.usernameBox, // text game object
          undefined, // Config
          function (textObject) {
            // onClose
            var currUserName = textObject.text;
            if (currUserName !== prevUserName) {
              this.emit("change-name", currUserName, prevUserName);
            }
          }
        );
      }.bind(this)
    );

    this.inputBox.setInteractive().on(
      "pointerdown",
      function () {
        this.isFocused = true;
        this.events.emit("inputFocused");

        this.mainPanel.scene.rexUI.edit(this.inputBox);
      }.bind(this)
    );

    this.inputPanel =  inputPanel
  }

  updateAllPanelsVisibility(isVisible:boolean) {
    this.mainPanel.setVisible(isVisible);
    this.upperPanel.setVisible(isVisible);
    this.inputPanel.setVisible(isVisible);
  }

  createToggleChatButton() {
    const scale = 0.2;
    const image = this.textures.get('speech-bubble');
    const width = image.getSourceImage().width * scale;
    const height = image.getSourceImage().height * scale;

    const toggleButton = this.add
      .image(width / 2, this.cameras.main.height - height / 2, "speech-bubble")
      .setScale(scale)
      .setInteractive();

    let isMinimized = true;

    toggleButton.on("pointerover", () => {
      toggleButton.setScale(0.2);
      this.input.setDefaultCursor("pointer");
    });

    toggleButton.on("pointerout", () => {
      toggleButton.setScale(0.1);
      this.input.setDefaultCursor("default");
    });

    toggleButton.on("pointerdown", () => {
      isMinimized = !isMinimized; // Toggle the state
      this.updateAllPanelsVisibility(!isMinimized);
    });

    // Ensure the toggle button does not move with the camera
    toggleButton.setScrollFactor(0);
  }
  async sendUserJoinMessage() {
    if (this.room) {
      await this.room.send("playerJoined");
    }
  }
}
