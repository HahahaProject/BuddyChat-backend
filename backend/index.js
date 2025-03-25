import express from "express";
import http from "node:http";
import { Server } from "socket.io";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { queueIn, matching } from "./matching.js";
import { matchCancel, checkUsers } from "./matching.js";
import { timeFormat, midnight, calLapseTime } from "./module/time.js";
import { wrapper } from "./wrapper.js";
import { addSocketProperties } from "./module/addProperties.js";
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

  // socket.on(
  //   "hello",
  //   errorHandler((callback) => {
  //     // throw new Error("시헙에러");
  //     callback({
  //       status: 600,
  //       message: "죽겠다",
  //     });
  //   })
  // );
  // errorHandler((...args) => {
  //   console.log("지금 내부함수 실행중이야");
  //   console.log("바깥에서 args", ...args);
  //   throw new Error("let's panic");
  // })

  // 콜백으로 500처리가 가능한가?
  // - 왜 500을 보내야하는지?
  // 그리고 이건 on인데 emit은 가능한가?
  // 오류 처리는 언제해야해?
  //

  //match-start 리팩토링
  socket.on(
    "match-start",
    wrapper((callback) => {
      console.log("random-match 실행중");
      // 매칭시작시간 기록
      socket.enterTime = Date.now();
      // 매칭된적있는 user가 기록되어있는지 확인
      if (!socket.checkUserPair) {
        socket.checkUserPair = new Set();
      }
      // 1. 대기열에 등록
      let returnSocket = queueIn(socket);
      console.log("socket.myposInqueue 값이 없는경우?", socket.myPosInQueue);

      // 2. 중복인지 매칭인지 확인한다.
      if (returnSocket == false) {
        // 중복인 경우
        callback({
          status: 202,
          message: "중복등록",
        });
      } else {
        // 중복이 아닌경우
        callback({
          status: 201,
          message: "매칭등록",
        });
        // 타임아웃을 시작한다.
        socket.timer = setTimeout(() => {
          socket.emit("match-result", {
            status: 408,
            message: "매치 시간초과",
          });
        }, 10000);
        // 매칭함수 실행
        matchingResult = matching(socket);
        let partnerSocket;
        // 4. 매칭이 성공하면
        if (matchingResult) {
          console.log("매칭성공");
          roomList.set(count, matchingResult);

          partnerSocket = io.sockets.sockets.get(matchingResult.partner.id);
        }
        // 5. 파트너소켓이 있으면
        if (partnerSocket) {
          addSocketProperties({
            socket: socket,
            partnerSocket: partnerSocket,
            roomListCount: count,
          });
          // 다음 roomList를 위한 count 증가
          count++;

          // 5. 타입아웃 멈춤
          clearTimeout(socket.timer);
          clearTimeout(partnerSocket.timer);

          // 6. 룸에 조인
          socket.join(matchingResult.randomRoom);
          partnerSocket.join(matchingResult.randomRoom);

          // messageIdx값 저장
          roomLatestMessageIdx.set(socket.rooms[1], 0);

          // 7. room-alert 호출한다.
          const currentTime = new Date();
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
    })
  );

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
      roomLatestMessageIdx.delete(socket.rooms[1]);

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
      socket.roomListIdx = undefined;
      partnerSocket.roomListIdx = undefined;
    } else if (!roomInfo) {
      socket.leave(room[1]);
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
        socket.broadcast.to(socket.rooms[1]).emit("room-alert", {
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
        roomLatestMessageIdx.delete(socket.rooms[1]);
        // 중복누름 확인용 set에서 제거
        checkUsers.delete(socket.id);
        // 소켓룸아이디 제거
        socket.roomListIdx = undefined;
        // 현 소켓과 연결되었었던 소켓들의 checkUserPair에서 현소켓 삭제
        const pairArray = [...socket.checkUserPair];
        console.log("pairArray", socket.id, pairArray);
        for (let elem of pairArray) {
          const partnerSocket = io.sockets.sockets.get(elem);
          partnerSocket.checkUserPair.delete(socket.id);
        }
      }
    }
    // }
  );

  //-------------   여기서 부터 대화방
  socket.on("chat-message", (message, callback) => {
    const currentTime = new Date();
    const room = [...socket.rooms];
    let messageIdx = roomLatestMessageIdx.get(socket.rooms[1]);
    roomLatestMessageIdx.set(socket.rooms[1], ++messageIdx);
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
      message: "자정알림",
      data: {
        midnight: midnight(currentTime),
      },
    });
  }
});
server.listen(5000, () => {
  console.log("5000포트에서 서버 실행중");
});
