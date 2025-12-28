import express from "express";
import http from "http";
import WebSocket, { WebSocketServer } from "ws";
import { createClient } from "redis";

async function main() {
  const app = express();
  app.use(express.json());

  app.get("/health", (_, res) => {
    res.send("OK");
  });

  const server = http.createServer(app);

  const users: Map<string, WebSocket> = new Map();

  // Separate clients: one for subscribing, one for publishing
  const redisSubscriber = createClient();
  const redisPublisher = createClient();

  await redisSubscriber.connect();
  await redisPublisher.connect();

  const wss = new WebSocketServer({
    server,
    path: "/ws",
  });

  wss.on("connection", (ws) => {
    console.log("WebSocket client connected");

    ws.on("message", async (message, isBinary) => {
      console.log("Received:", message.toString());
      const msg = JSON.parse(message.toString());
      const userId = msg.userId;
      // const { userId } = msg;

      if (!users.has(userId)) {
        users.set(userId, ws);
        console.log(`User is connected with ID ${userId}`);
        ws.send(JSON.stringify({ status: "connected", userId }));

        // subscribe to redis channel
        const userChannel = "users";
        await redisSubscriber.subscribe(userChannel, (event: string) => {
          if (ws?.readyState === WebSocket.OPEN) {
            ws.send(event);
          }
        });
      }
    });

    ws.on("close", () => {
      console.log("Client disconnected");
    });
  });

  app.post("/publish-event", async (req, res) => {
    const { userId, message } = req.body;
    if (!userId || !message) {
      return res.status(400).json({ error: "userId and message are required" });
    }
    await redisPublisher.publish(`users`, message);
    res.send("OK");
  });

  const PORT = 3003;
  server.listen(PORT, () => {
    console.log(`HTTP + WebSocket server running on port ${PORT}`);
  });
}

main();
