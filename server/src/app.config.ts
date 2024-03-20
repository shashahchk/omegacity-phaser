import config from "@colyseus/tools";
import { monitor } from "@colyseus/monitor";
import { playground } from "@colyseus/playground";

/**
 * Import your Room files
 */
import { GameRoom } from "./rooms/GameRoom";
import { BattleRoom } from "./rooms/BattleRoom";

const express = require('express');
const cors = require('cors');
const http = require('http');
const { Server } = require('colyseus');

// Allow CORS for all origins (not recommended for production)


export default config({
  initializeGameServer: (gameServer) => {
    gameServer.define("battle", BattleRoom);
    gameServer.define("game", GameRoom);
  },

  initializeExpress: (app) => {
    app.use(cors({
      origin: '*'
    }));
    /**
     * Bind your custom express routes here:
     * Read more: https://expressjs.com/en/starter/basic-routing.html
     */
    app.get("/hello_world", (req, res) => {
      res.send("It's time to kick ass and chew bubblegum!");
    });

    /**
     * Use @colyseus/playground
     * (It is not recommended to expose this route in a production environment)
     */
    if (process.env.NODE_ENV !== "production") {
      app.use("/", playground);
    }

    /**
     * Use @colyseus/monitor
     * It is recommended to protect this route with a password
     * Read more: https://docs.colyseus.io/tools/monitor/#restrict-access-to-the-panel-using-a-password
     */
    app.use("/colyseus", monitor());
  },

  beforeListen: () => {
    /**
     * Before before gameServer.listen() is called.
     */
  },
});
