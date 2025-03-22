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
let count = 1;
/**
 * roomListr가 필요한 경우:
 * 1. 전체 자정알림 emit할때
 * 이외에는 모르겟음.
 */

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
      } else if (elem[1].partner == socket.id) {
        socket.join(elem[1].randomRoom);
      }
    }
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
    callback({
      status: 204,
      message: "나가기성공",
    });
  });

  socket.on("chat-alert", (arg) => {
    console.log("현재상태", socket.rooms);
    const currentRoomStatus = [...socket.rooms];
    if (currentRoomStatus[1]) {
      for (let elem of roomList) {
        if (elem[1].randomRoom == currentRoomStatus[1]) {
          roomList.delete(elem[0]);
          count--;
        }
      }
      socket.leave(currentRoomStatus[1]);
    }
  });

  socket.on("disconnect", () => {
    matchCancel(socket.id);
  });

  //-------------   여기서 부터 대화방
  let messageIdx = 0;
  // messageIdx 해야함.
  socket.on("message", (message, callback) => {
    const currentTime = new Date();
    const room = [...socket.rooms];
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

  socket.on("typing", (inputState) => {
    const room = [...socket.rooms];
    socket.broadcast.to(room[1]).emit("typing", {
      isEmpty: inputState.isEmpty,
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
