import express from "express";
import http from "node:http";
import https from "node:https";
import { readFileSync } from "node:fs";
import { Server } from "socket.io";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { socketController } from "./socket/controller.js";
import cors from "cors";
const app = express();
const options = {
  key: readFileSync("/etc/letsencrypt/live/api.buddychat.asia/privkey.pem"),
  cert: readFileSync("/etc/letsencrypt/live/api.buddychat.asia/fullchain.pem"),
};

const httpServer = http.createServer(app);
const httpsServer = https.createServer(options, app);

const __dirname = dirname(fileURLToPath(import.meta.url));

app.use(
  cors({
    origin: "*",
    methods: "GET,HEAD,PUT,PATCH,POST,DELETE",
    credentials: true,
  })
);

app.use(express.static("/root/BuddyChat-backend/frontend"));
app.get("/", (req, res) => {
  res.sendFile("/root/BuddyChat-backend/frontend/chatRoom.html");
});

// express.static("/Users/jung-yiryung/Desktop/buddyChat_demo_v2/frontend")
// "/Users/jung-yiryung/Desktop/buddyChat_demo_v2/frontend/chatRoom.html"
app.use((req, res, next) => {
  if (!req.secure) {
    return res.redirect("https://" + req.headers.host + req.url);
  }
  next();
});

const io = new Server(httpServer, {
  cors: {
    origin: "*",
    credentials: true,
    methods: ["GET", "POST"],
  },
});

const ioSecure = new Server(httpsServer, {
  cors: {
    origin: "*",
    credentials: true,
    methods: ["GET", "POST"],
  },
});

const socketHandler = (socket, ioInstance) => {
  console.log("개인소켓 연결됨.", socket.id);
  socketController(socket, ioInstance);
};

io.on("connection", (socket) => {
  socketController(socket, io);
});
ioSecure.on("connection", (socket) => socketHandler(socket, ioSecure));

const currentTime = new Date().toString();
// server.listen(process.env.PORT, () => {
//   console.log(`${process.env.PORT}포트에서 ${currentTime}현재 웹서버 실행중`);
// });

httpServer.listen(80, () => {
  console.log(`80포트에서 ${currentTime}현재 웹서버 실행중 `);
});
httpsServer.listen(443, () => {
  console.log(`443포트에서 ${currentTime}현재 웹서버 실행중 `);
});
