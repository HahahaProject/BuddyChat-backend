import express from "express";
import http from "node:http";
import { Server } from "socket.io";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { queueIn, matching } from "./matching.js";
import { matchCancel } from "./matching.js";
import { time, midnight, messageTime, calLapseTime } from "./time.js";
import cron from "node-cron";

const app = express();
const server = http.createServer(app);
const __dirname = dirname(fileURLToPath(import.meta.url));
const io = new Server(server);
let matchingResult;
let roomList = new Map();
let roomLatestMessageIdx = new Map();
let count = 1;

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

  socket.on("match-start", (callback) => {
    console.log("random-match 실행중");
    socket.enterTime = Date.now();
    if (!socket.checkUsersPair) {
      socket.checkUserPair = new Set();
    }

    let returnSocket = queueIn(socket);
    if (socket.myPosInQueue)
      if (returnSocket == false) {
        //그냥 처음 누른것에대해서 20초 카운트되는걸로
        callback({
          status: 202,
          message: "중복등록",
        });
      } else {
        callback({
          status: 200,
          message: "매칭등록",
        });
        socket = returnSocket;
        matchingResult = matching(socket);
        console.log("매칭결과에요", matchingResult);
        socket.timer = setTimeout(() => {
          console.log("타임아웃끝");
          socket.emit("match-result", {
            status: 408,
            message: "매치 시간초과",
          });
        }, 10000);

        if (matchingResult) {
          console.log("매칭성공");
          roomList.set(count++, matchingResult);
          socket.chatStartTime = Date.now();
          const currentTime = new Date();
          io.to(matchingResult.partner)
            .to(socket.id)
            .emit("match-result", {
              status: 200,
              message: "매치 성공",
              date: {
                matchTime: time(currentTime),
              },
            });
        }
      }
  });

  socket.on("room-inside", (callback) => {
    console.log("타임아웃 멈춤");
    clearTimeout(socket.timer);
    for (let elem of roomList) {
      if (elem[1].me == socket.id) {
        socket.join(elem[1].randomRoom);
        socket.roomIdx = elem[1].randomRoom;
      } else if (elem[1].partner == socket.id) {
        socket.join(elem[1].randomRoom);
        socket.roomIdx = elem[1].randomRoom;
      }
    }
    roomLatestMessageIdx.set(socket.roomIdx, 0);
    callback({
      status: 200,
      message: "랜덤방 진입",
    });
  });

  socket.on("match-cancel", (callback) => {
    matchCancel(socket);
    clearTimeout(socket.timer);
    callback({
      status: 204,
      message: "매치취소",
    });
  });

  socket.on("room-outside", (callback) => {
    const room = [...socket.rooms];

    socket.chatEndTime = Date.now();
    const currentTime = new Date();
    io.timeout(10000)
      .to(room[1])
      .emit(
        "chat-alert",
        {
          status: 200,
          message: "채팅방 종료",
          data: {
            roomOutTime: time(currentTime),
            chatTime: calLapseTime(socket.chatEndTime, socket.chatStartTime),
          },
        },
        (err, response) => {
          if (err) {
          } else {
          }
        }
      );
    socket.leave(room[1]);
    console.log("단절된 socket의 room 목록", room);
    callback({
      status: 204,
      message: "나가기성공",
    });
  });

  socket.on("chat-alert", (arg) => {
    console.log("종료위한 chat-alert실행중");
    const currentRoomStatus = [...socket.rooms];
    if (currentRoomStatus[1]) {
      for (let elem of roomList) {
        if (elem[1].randomRoom == currentRoomStatus[1]) {
          roomList.delete(elem[0]);
          roomLatestMessageIdx.delete(elem[0]);
          count--;
        }
      }
      socket.leave(currentRoomStatus[1]);
      console.log("현재상태", socket.rooms);
    }
  });

  socket.on("disconnect", () => {
    // 여기 이상한데
    console.log("소켓 룸 목록", socket.rooms);
    let chatEndTime = Date.now();
    const currentTime = new Date();
    for (let elem of roomList) {
      if (elem[1].me == socket.id || elem[1].partner == socket.id) {
        socket.broadcast.to(elem[1].randomRoom).emit("chat-alert", {
          status: 200,
          message: "채팅방 종료",
          data: {
            roomOutTime: time(currentTime),
            chatTime: calLapseTime(chatEndTime, elem[1].chatStartTime),
          },
        });
        roomList.delete(elem[0]);
        roomLatestMessageIdx.delete(elem[0]);
        count--;
      }
    }
  });

  //
  // }
  // 여기도.. 해야되는데 아

  //-------------   여기서 부터 대화방
  socket.on("message", (message, callback) => {
    const currentTime = new Date();
    const room = [...socket.rooms];
    let messageIdx = roomLatestMessageIdx.get(socket.roomIdx);
    roomLatestMessageIdx.set(socket.roomIdx, ++messageIdx);
    io.timeout(10000)
      .to(room[1])
      .emit(
        "message",
        {
          chatMessageIdx: messageIdx,
          chatTime: messageTime(currentTime),
          sender: socket.id,
          nickName: socket.nickname || null,
          chatMessage: message,
          status: 201,
        },
        (err, response) => {
          if (err) {
          } else {
          }
        }
      );
    callback({
      status: 200,
      message: "송신",
    });
  });

  socket.on("typing", (typingState) => {
    const room = [...socket.rooms];
    socket.broadcast.to(room[1]).emit("typing", {
      typing: typingState.typing,
    });
  });
});

cron.schedule("0 0 0 * * *", () => {
  const currentTime = new Date();
  for (let elem of roomList) {
    io.to(elem).emit("chat-alert", {
      status: 206,
      data: {
        midnight: midnight(currentTime),
      },
    });
  }
});
server.listen(5000, () => {
  console.log("5000포트에서 서버 실행중");
});
