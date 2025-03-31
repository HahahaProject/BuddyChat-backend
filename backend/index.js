import express from "express";
import http from "node:http";
import { createServer } from "node:https";
import { readFileSync } from "node:fs";
import { Server } from "socket.io";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { socketController } from "./socket/controller.js";
import cors from "cors";
import "dotenv/config";
const app = express();
const server = http.createServer(app);
const __dirname = dirname(fileURLToPath(import.meta.url));

const options = {
  key: readFileSync("/etc/letsencrypt/live/api.buddychat.asia/privkey.pem"),
  cert: readFileSync("/etc/letsencrypt/live/api.buddychat.asia/fullchain.pem"),
};
const io = new Server(server, {
  cors: {
    origin: "*",
    credentials: true,
    methods: ["GET", "POST"],
  },
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
);
app.get("/", (req, res) => {
  res.sendFile(
    "/Users/jung-yiryung/Desktop/buddyChat_demo_v2/frontend/chatRoom.html"
  );
});

io.on("connection", (socket) => {
  console.log("개인소켓 연결됨.");
  console.log("server.socketId", socket.id);

  socketController(socket, io);
});

const currentTime = new Date().toString();
server.listen(process.env.PORT, () => {
  console.log(`${process.env.PORT}포트에서 ${currentTime}현재 웹서버 실행중`);
});

createServer(options, (req, res) => {
  console.log(`443포트에서 ${currentTime}현재 웹서버 실행중 `);
}).listen(process.env.SSLPORT);
