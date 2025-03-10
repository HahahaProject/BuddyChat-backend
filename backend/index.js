import express from "express";
import http from "node:http";
import { Server } from "socket.io";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { v4 as uuidv4 } from "uuid";
import { queueIn, waiting20 } from "./matching.js";
import { matchCancel } from "./matching.js";
import { currentDate, matchingTime } from "./time.js";
import { queueEvent } from "./matching.js";
const app = express();
const server = http.createServer(app);
const __dirname = dirname(fileURLToPath(import.meta.url));
const io = new Server(server);

app.get("/", (req, res) => {
  res.sendFile(
    "/Users/jung-yiryung/Desktop/buddyChat_demo_v2/frontend/index.html"
  );
});

io.on("connection", (socket) => {
  console.log("유저 연결됨");
  console.log("server.socketId", socket.id);
  /**
   * 1. 랜덤매칭을 하면
   *    - 한번 매칭되었던 사람은 매칭이 되면 안되구 (중복체크)
   *    - 뭘 기준으로 매칭을 하지? 기준이 없음. 그냥 그 때 들어와있는 사람들중에서 고르면 되는것. (대기열)
   *    - 대기열은 무슨 자료구조를 써야하지?
   *    - 동시성 문제는 뭘말하는거지? 일단 엄청나게 많이 공부를 해야하는것같은데..
   *    - 그리고 먼저 온 사람이 먼저 매칭이 되어야 한다. ? => 가중치반영
   *    -
   *
   */
  socket.on("random-match", async () => {
    //대기열 큐에 넣는다.
    console.log("random-match 실행중");
    let user = queueIn(socket.id);
    socket.emit("status-queue", { status: 201, message: "queueIn" });
    let waitingResult;
    console.log("user값", user);
    if (!user) {
      try {
        socket.emit("matchingtime-start");
        waitingResult = await waiting20();
        console.log("promise waiting 결과", waitingResult);
      } catch (err) {
        socket.emit("status-queue", { status: 408, message: "queueOut" });
        socket.emit("match-fail", () => {
          console.log("매칭실패 emit");
        });
      }

      if (waitingResult) {
        console.log("2", waitingResult[2]);
        socket.join(`${waitingResult[2]}`);
        socket.emit("match-success", matchingTime);
        socket.emit("status-queue", { status: 200, message: "queueOut" });
        console.log("socketId와 room", socket.rooms);
      }
    } else {
      console.log("두번째 user는 여기 실행");
      queueEvent.emit("20sStop");
      socket.join(`${user.roomName}`);
      socket.emit("match-success", matchingTime);
      socket.emit("status-queue", { status: 200, message: "queueOut" });
      console.log("socketId와 room", socket.rooms);
    }
  });

  socket.on("match-cancel", () => {
    matchCancel(socket.id);
    socket.emit("status-queue", { status: 204, message: "queueOut" });
  });

  //-----------------------------
  // 만약에 룸에 포함된 사람이 아무도 없으면 룸 삭제해야함.

  socket.on("leaving-room", (roomName) => {
    // 룸이름을 어덯게 가지고오지?
    console.log("roomNAme", roomName);
    socket.leave(`${roomName}`);
    console.log("socket.rooms여부", socket.rooms);
  });

  const messageTime = `
    ${currentDate.getHours()}:${currentDate.getMinutes()}}`;

  socket.on("message", (messageTime) => {});
  io.emit("message");
});

server.listen(5000, () => {
  console.log("5000포트에서 서버 실행중");
});
