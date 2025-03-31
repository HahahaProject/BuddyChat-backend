import express from "express";
import http from "node:http";
import https from "node:https";
import { readFileSync } from "node:fs";
import { Server } from "socket.io";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { socketController } from "./socket/controller.js";
import cors from "cors";
import "dotenv/config";
const app = express();
const options = {
  key: readFileSync("/etc/letsencrypt/live/api.buddychat.asia/privkey.pem"),
  cert: readFileSync("/etc/letsencrypt/live/api.buddychat.asia/fullchain.pem"),
};
const server = https.createServer(options, app);
const __dirname = dirname(fileURLToPath(import.meta.url));

app.use((req, res) => {
  if (!req.secure) res.redirect("https://api.buddychat.asia");
});

app.use(
  cors({
    origin: "*",
    methods: "GET,HEAD,PUT,PATCH,POST,DELETE",
    credentials: true,
  })
);

app.use(
  express.static("/Users/jung-yiryung/Desktop/buddyChat_demo_v2/frontend")
  // express.static("/root/BuddyChat-backend/frontend")
);
app.get("/", (req, res) => {
  res.sendFile(
    "/Users/jung-yiryung/Desktop/buddyChat_demo_v2/frontend/chatRoom.html"
    // "/root/BuddyChat-backend/frontend/chatRoom.html"
  );
});

const io = new Server(server, {
  cors: {
    origin: "*",
    credentials: true,
    methods: ["GET", "POST"],
  },
});

io.on("connection", (socket) => {
  console.log("개인소켓 연결됨.");
  console.log("server.socketId", socket.id);

  socketController(socket, io);
});

const currentTime = new Date().toString();
// server.listen(process.env.PORT, () => {
//   console.log(`${process.env.PORT}포트에서 ${currentTime}현재 웹서버 실행중`);
// });

server.listen(443, () => {
  console.log(`443포트에서 ${currentTime}현재 웹서버 실행중 `);
});
