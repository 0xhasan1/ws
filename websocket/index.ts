import express from "express";
import http from "http";
import WebSocket, { WebSocketServer } from "ws";

const app = express();

app.get("/health", (_, res) => {
  res.send("OK");
});

const server = http.createServer(app);

const users: Map<string, WebSocket> = new Map();

const wss = new WebSocketServer({
  server,
  path: "/ws",
});

wss.on("connection", (ws) => {
  console.log("WebSocket client connected");

  ws.on("message", (message, isBinary) => {
    console.log("Received:", message.toString());
    const msg = JSON.parse(message.toString());
    const userId = msg.userId;

    if (!users.has(userId)) {
      users.set(userId, ws);
      console.log(`User is connected with ID ${userId}`);
      ws.send(JSON.stringify({ status: "connected", userId }));
    }

    users.forEach((value, key) => {
      const currUser = parseInt(key, 10);
      // broadcast evenId users only
      if (currUser % 2 == 0) {
        if (value.readyState === WebSocket.OPEN) {
          value.send(message, { binary: isBinary });
        }
      }
    });
  });

  ws.on("close", () => {
    console.log("Client disconnected");
  });
});

const PORT = 3003;
server.listen(PORT, () => {
  console.log(`HTTP + WebSocket server running on port ${PORT}`);
});
