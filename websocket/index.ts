import express from "express";
import http from "http";
import WebSocket, { WebSocketServer } from "ws";

const app = express();

app.get("/health", (_, res) => {
  res.send("OK");
});

const server = http.createServer(app);

const wss = new WebSocketServer({
  server,
  path: "/ws",
});

wss.on("connection", (ws) => {
  console.log("WebSocket client connected");

  ws.on("message", (message) => {
    console.log("Received:", message.toString());
    const msg = JSON.parse(message.toString());

    ws.send(`message received from client :: ${msg}`);
  });

  ws.on("close", () => {
    console.log("Client disconnected");
  });
});

const PORT = 3003;
server.listen(PORT, () => {
  console.log(`HTTP + WebSocket server running on port ${PORT}`);
});
