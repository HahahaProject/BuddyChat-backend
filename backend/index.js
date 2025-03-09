import express from "express";
import http from "node:http";
import { Server } from "socket.io";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { v4 as uuidv4 } from "uuid";
import { queueIn, waiting20 } from "./matching.js";
import { matchCancel } from "./matching.js";
import { currentDate, matchingTime } from "./time.js";
const app = express();
const server = http.createServer(app);
const __dirname = dirname(fileURLToPath(import.meta.url));
const io = new Server(server);

app.get("/", (req, res) => {
  res.sendFile(
    "/Users/jung-yiryung/Desktop/buddyChat_demo/frontend/index.html"
  );
});

io.on("connection", (socket) => {
  console.log("유저 연결됨");
  console.log("server.socketId", socket.id);
  let roomName;
  // 같은 룸이름 가능?
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

  // 랜덤매칭
  /**
   * 1. 매칭 큐 안에 넣는다.
   * 2. 큐에 있다 -> 대기중이다. 그럼 큐에 있는동안
   * 매칭상대를 찾는다.
   * 3. 큐에 없다. -> 대기중이 아니다.
   */
  socket.on("random-match", async (_, callback) => {
    //대기열 큐에 넣는다.
    console.log("random-match 실행중");
    let user = queueIn(socket.id);
    console.log("user값", user);
    if (!user) {
      // 20초동안 다른 사용자가 오는지 기다려야함.
      // 클라이언트시간이랑 서버시간이 같아야하는데
      // 20초동안 코드가 다음으로 넘어가지 않고 기다려야함.
      /**
       * promise로 기다림.
       */
      try {
        socket.emit("matchingtime-start");
        let waitingResult = await waiting20();
        console.log("promise waiting 결과", waitingResult);
      } catch (err) {
        socket.emit("match-fail", () => {
          console.log("매칭실패 emit");
        });
      }

      if (user) {
        socket.emit("match-success", matchingTime);
      }
    } else {
      socket.emit("match-success", matchingTime);
    }
    //이걸 어덯게 만들어야할지 모르겟네..
    const serverTime = new Date();
    console.log("현재시간", serverTime);
  });

  // 두 사용자를 room에 넣는다.
  socket.on("join-room", () => {
    socket.join(`${roomName}`);
  });

  socket.on("join", (roomName) => {
    socket.join(`${roomName}`);
    console.log("다른소켓의 socket.rooms", socket.rooms);
  });
  // 만약에 룸에 포함된 사람이 아무도 없으면 룸 삭제해야함.
  socket.on("match-cancel", () => {
    // matching cancel
    matchCancel(socket.id);
  });

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
