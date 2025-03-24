import express from "express";
import http from "node:http";
import { Server } from "socket.io";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { queueIn, matching } from "./matching.js";
import { matchCancel, checkUsers } from "./matching.js";
import { timeFormat, midnight, calLapseTime } from "./module/time.js";
import cron from "node-cron";

const app = express();
const server = http.createServer(app);
const __dirname = dirname(fileURLToPath(import.meta.url));
const io = new Server(server);
let matchingResult;
let roomList = new Map();
let roomLatestMessageIdx = new Map();
let count = 1; // roomList용 카운트

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
    if (!socket.checkUserPair) {
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
          status: 201,
          message: "매칭등록",
        });
        socket = returnSocket;
        // console.log("socket", socket);
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
          roomList.set(count, matchingResult);

          const currentTime = new Date();
          console.log("matchingresult", matchingResult);
          const partnerSocket = io.sockets.sockets.get(
            matchingResult.partner.id
          );
          if (partnerSocket) {
            // roomList Idx 추가
            socket.roomListIdx = count;
            partnerSocket.roomListIdx = count;
            count++;

            // 타입아웃 멈춤
            clearTimeout(socket.timer);
            clearTimeout(partnerSocket.timer);

            // 룸에 조인
            socket.join(matchingResult.randomRoom);
            partnerSocket.join(matchingResult.randomRoom);
            socket.roomId = matchingResult.randomRoom;
            partnerSocket.roomId = matchingResult.randomRoom;

            // messageIdx값 저장
            roomLatestMessageIdx.set(socket.roomId, 0);

            // queue내에서의 정보 초기화
            socket.myPosInQueue = undefined;
            partnerSocket.myPosInQueue = undefined;

            // 채팅시작시간 저장
            socket.chatStartTime = Date.now();
            partnerSocket.chatStartTime = Date.now();

            //매칭되었던 유저 저장
            socket.checkUserPair.add(partnerSocket.id);
            console.log("socket.checkUserPair update", socket.checkUserPair);
            partnerSocket.checkUserPair.add(socket.id);
            console.log(
              "PartmerSocket.checkUserPair update",
              partnerSocket.checkUserPair
            );
            // console.log("io.adaptert", io.sockets.adapter.rooms);
            io.to(matchingResult.randomRoom).emit("room-alert", {
              status: 200,
              message: "매치 성공",
              date: {
                type: "join",
                joinTime: timeFormat(currentTime),
                nickName: socket.nickName || null,
                roomName: null,
                socket: socket.id,
              },
            });
          }
        }
      }
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
    const roomListIdx = socket.roomListIdx;
    const roomInfo = roomList.get(roomListIdx);
    if (roomInfo) {
      let partnerSocket;
      if (roomInfo.me.id == socket.id) {
        partnerSocket = io.sockets.sockets.get(roomInfo.partner.id);
      } else if (roomInfo.partner.id == socket.id) {
        partnerSocket = io.sockets.sockets.get(roomInfo.me.id);
      }

      socket.chatEndTime = Date.now();
      partnerSocket.chatEndTime = Date.now();

      // 룸리스트에서 제거
      roomList.delete(roomListIdx);
      count--;
      console.log("roomList", roomList);

      // 중복누름 확인용 set에서 제거
      checkUsers.delete(socket.id);
      checkUsers.delete(partnerSocket.id);

      // room별 messageIdx 지움
      roomLatestMessageIdx.delete(socket.roomId);

      const currentTime = new Date();
      console.log("실행중");
      io.timeout(10000)
        .to(room[1])
        .emit(
          "room-alert",
          {
            status: 200,
            message: "채팅방 종료",
            data: {
              type: "out",
              roomOutTime: timeFormat(currentTime),
              chatTime: calLapseTime(socket.chatEndTime, socket.chatStartTime),
              nickName: socket.nickName || null,
              socket: socket.id,
            },
          },
          (err, response) => {
            if (err) {
            } else {
            }
          }
        );

      //룸에서 나감.
      socket.leave(room[1]);
      partnerSocket.leave(room[1]);

      //roomId 제거
      socket.roomId = undefined;
      partnerSocket.roomId = undefined;
      socket.roomListIdx = undefined;
      partnerSocket.roomListIdx = undefined;
    } else if (!roomInfo) {
      socket.leave(room[1]);
      socket.roomId = undefined;
      socket.roomListIdx = undefined;
    }
    callback({
      status: 204,
      message: "나가기성공",
    });
  });

  socket.on(
    "disconnect",
    () => {
      let chatEndTime = Date.now();
      const currentTime = new Date();
      console.log("roomListIdx", socket.roomListIdx);
      if (socket.roomListIdx && roomList.get(socket.roomListIdx)) {
        console.log("roomList.get", roomList.get(socket.roomListIdx));
        socket.broadcast.to(socket.roomId).emit("room-alert", {
          status: 200,
          message: "채팅방 종료",
          data: {
            roomOutTime: timeFormat(currentTime),
            chatTime: calLapseTime(
              chatEndTime,
              roomList.get(socket.roomListIdx).chatStartTime
            ),
            nickName: socket.nickName || null,
            socket: socket.id,
          },
        });

        // 룸리스트에서 삭제
        roomList.delete(socket.roomListIdx);
        count--;
        // 최신 messageIdx 삭제
        roomLatestMessageIdx.delete(socket.roomId);
        // 중복누름 확인용 set에서 제거
        checkUsers.delete(socket.id);
        // 소켓룸아이디 제거
        socket.roomId = undefined;
        socket.roomListIdx = undefined;
        // 현 소켓과 연결되었었던 소켓들의 checkUserPair에서 현소켓 삭제
        const pairArray = [...socket.checkUserPair];
        console.log("pairArray", socket.id, pairArray);
        for (let elem of pairArray) {
          const partnerSocket = io.sockets.sockets.get(elem);
          partner.checkUserPair.delete(socket.id);
        }
      }
    }
    // }
  );

  //-------------   여기서 부터 대화방
  socket.on("chat-message", (message, callback) => {
    const currentTime = new Date();
    const room = [...socket.rooms];
    let messageIdx = roomLatestMessageIdx.get(socket.roomId);
    roomLatestMessageIdx.set(socket.roomId, ++messageIdx);
    io.timeout(10000)
      .to(room[1])
      .emit(
        "chat-message",
        {
          status: 201,
          message: "수신",
          data: {
            chatMessageIdx: messageIdx,
            chatTime: timeFormat(currentTime),
            sender: socket.id,
            nickName: socket.nickname || null,
            chatMessage: message,
          },
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

  socket.on("chat-typing", (typingState) => {
    const room = [...socket.rooms];
    socket.broadcast.to(room[1]).emit("chat-typing", {
      typing: typingState.typing,
    });
  });
});

cron.schedule("0 0 0 * * *", () => {
  const currentTime = new Date();
  for (let elem of roomList) {
    io.to(elem.randomRoom).emit("room-alert", {
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
