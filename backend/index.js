import express from "express";
import http from "node:http";
import { Server } from "socket.io";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { queueIn, matching } from "./matching.js";
import { matchCancel } from "./matching.js";
import {
  currentDate,
  time,
  midnight,
  messageTime,
  calLapseTime,
} from "./time.js";
import cron from "node-cron";

const app = express();
const server = http.createServer(app);
const __dirname = dirname(fileURLToPath(import.meta.url));
const io = new Server(server);
let matchingResult;
let roomList = new Set();
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
        socket.randomRoom = matchingResult.randomRoom; // 이 줄이 필요할까
        roomList.add(matchingResult.randomRoom);
        socket.chatStartTime = Date.now();
        io.to(matchingResult.partner)
          .to(socket.id)
          .emit("match-result", {
            status: 200,
            message: "매치 성공",
            date: {
              matchTime: time,
            },
          });
      }
    }
  });

  socket.on("room-inside", (callback) => {
    console.log("타임아웃 멈춤");
    clearTimeout(socket.timer);
    socket.join(`${matchingResult.randomRoom}`);
    console.log("현재속한 룸", socket.rooms);
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
    //대화나누던 방을 나간다.
    //한사람이 나가면 다른사람도 방을 나가게 한다.
    socket.leave(socket.randomRoom);
    socket.chatEndTime = Date.now();
    socket.broadcast.to(socket.randomRoom).emit("chat-alert", {
      status: 200,
      message: "채팅방 종료",
      data: {
        roomOutTime: time,
        chatTime: calLapseTime(socket.chatEndTime, socket.chatStartTime),
      },
    });
    callback({
      status: 204,
      message: "나가기성공",
    });
  });

  /**
   * chat-alert가 필요한 상황:
   * 1. 채팅종료되었을때
   * 2. 그룹채팅방에서 나갈때
   *  - 1.2는 같은 결과 보내줘도 됨.  200
   * 3. 자정되었을때  206
   */

  socket.on("disconnect", () => {
    matchCancel(socket.id);
  });

  //-------------   여기서 부터 대화방

  // // 포스트맨
  let messageOffset = 0;

  socket.on("message", (message, callback) => {
    let currentTime = new Date().getTime();
    io.timeout(10000).emit(
      "message",
      {
        chatMessageIdx: messageOffset,
        chatTime: currentTime,
        sender: socket.id,
        nickName: socket.nickname || null,
        chatMessage: message,
        status: 201,
      },
      (err, responses) => {
        if (err) {
          // 이게 뭐지?
          console.log("에러발생", err);
        } else {
          const responseArray = Object.entries(responses).map(
            ([socketId, data]) => ({
              socketId,
              ...data,
            })
          );
          console.log("서버에서 emit결과", responseArray);
        }
      }
    );
    callback({
      status: 200,
      message: "서버에서 받았어요",
    }); // 룸은 나중에
  });

  socket.on("typing", (inputState) => {
    io.emit("typing", {
      // 현재 룸배제하고 io로 함.
      //to(socketRoomId[1])
      isEmpty: inputState.isEmpty,
    });
  });
  // io.emit("message");

  // 만약에 룸에 포함된 사람이 아무도 없으면 룸 삭제해야함.
  // 룸삭제 ?
  /**
   * * 대화방에서 다시찾기나 홈으로 돌아갈 시 남은 사람도 방을 leave해야헤
   * * 근데 다시찾기를 새로 이벤틀르 파면 같은 로직을 두번쓰자니 중복되고
   *
   */
});

// 하나만 오게 하려면 어떻게 해야하지?
cron.schedule("0 0 0 * * *", () => {
  for (let elem of roomList) {
    io.to(elem).emit("chat-alert", {
      status: 206,
      data: {
        midnight: midnight,
      },
    });
  }
});
server.listen(5000, () => {
  console.log("5000포트에서 서버 실행중");
});
