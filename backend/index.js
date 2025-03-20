import express from "express";
import http from "node:http";
import { Server } from "socket.io";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { v4 as uuidv4 } from "uuid";
import { queueIn, matching, waiting20 } from "./matching.js";
import { matchCancel } from "./matching.js";
import { currentDate, time, messageTime, calLapseTime } from "./time.js";
import { queueEvent } from "./matching.js";
const app = express();
const server = http.createServer(app);
const __dirname = dirname(fileURLToPath(import.meta.url));
const io = new Server(server);
let socketRoomId;
let chatStartTime, chatEndTime, chatLapseTime;

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
  /**
   *
   * 1. 랜덤매칭을 하면
   *    - 한번 매칭되었던 사람은 매칭이 되면 안되구 (중복체크)
   *    - 뭘 기준으로 매칭을 하지? 기준이 없음. 그냥 그 때 들어와있는 사람들중에서 고르면 되는것. (대기열)
   *    - 대기열은 무슨 자료구조를 써야하지?
   *    - 동시성 문제는 뭘말하는거지? 일단 엄청나게 많이 공부를 해야하는것같은데..
   *    - 그리고 먼저 온 사람이 먼저 매칭이 되어야 한다. ? => 가중치반영
   *    -

   */

  socket.emit("match-result", {
    status: 200,
    message: "매치성공",
  });
  // 일단 랜덤과 그룹 모두 room으로 구현예정
  //

  socket.on("match-start", async (callback) => {
    console.log("random-match 실행중");
    let currentTime = Date.now();
    let socketInfo = {
      socketId: socket.id,
      enterTime: currentTime,
    };
    let result = queueIn(socketInfo);
    if (result == false) {
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
      // 20초 타임아웃시작
      const timer = setTimeout(() => {
        console.log("타임아웃끝");
        socket.emit("match-result", {
          status: 408,
          message: "매칭시간 초과",
        });
      }, 10000);
      const matchingResult = matching(socket.id);
      console.log("myId", socket.id);
      console.log("matchingResult", matchingResult);
      if (matchingResult) {
        // 결과가 있을 경우
        // 한사람에게는 안가는 문제
        // 근데 그게 어떻게 가능하지?
        // 여기 마무리해야함.
        console.log("여기 실행이 안되는겨?");
        clearTimeout(timer);
        socket.to(matching.partner, socket.id).emit("match-result", {
          status: 200,
          message: "매치 성공",
          date: {
            matchTime: "",
          },
        });
        io.in(matching.partner, socket.id).socketsJoin(matching.room);
      }
    }
  });

  // 중복소켓 => 이미 큐에 있다.
  // 그냥 이미 20초 카운트가 되고있는것.
  //

  // status-queue 대신 callback으로도 가능
  // let waitingResult;
  // console.log("user값", user);

  // 대화방내에서 다시찾기인경우
  // if (socketRoomId[1]) {
  //   socket.leave(socketRoomId[1]);
  // }
  // callback({status: 200, message: "test"})

  //   if (!user) {
  //     try {
  //       waitingResult = await waiting20();
  //       console.log("promise waiting 결과", waitingResult);
  //     } catch (err) {
  //       socket.emit("status-queue", { status: 408, message: "queueOut" });
  //     }

  //     if (waitingResult) {
  //       console.log("2", waitingResult[2]);
  //       socket.join(`${waitingResult[2]}`);
  //       chatStartTime = Date.now();
  //       socket.emit("match-success", time);
  //       socket.emit("status-queue", { status: 200, message: "queueOut" });
  //       console.log("socketId와 room", socket.rooms);
  //       socketRoomId = [...socket.rooms];
  //     }
  //   } else {
  //     console.log("두번째 user는 여기 실행");
  //     queueEvent.emit("20sStop");
  //     socket.join(`${user.roomName}`);
  //     chatStartTime = Date.now();
  //     socket.emit("match-success", time);
  //     socket.emit("status-queue", { status: 200, message: "queueOut" });
  //     console.log("socketId와 room", socket.rooms);
  //     socketRoomId = [...socket.rooms];
  //   }
  // });

  // 여기

  // socket.on("match-cancel", () => {
  //   matchCancel(socket.id);
  //   socket.emit("status-queue", { status: 204, message: "queueOut" });
  // });

  //-------------   여기서 부터 대화방

  // // 포스트맨
  // let messageOffset = 0;

  // socket.on("message", (message, callback) => {
  //   let currentTime = new Date().getTime();
  //   io.timeout(10000).emit(
  //     "message",
  //     {
  //       messageOffset: messageOffset,
  //       status: 200,
  //       message: message,
  //       sender: socket.id,
  //       time: currentTime,
  //     },
  //     (err, responses) => {
  //       if (err) {
  //         console.log("에러발생", err);
  //       } else {
  //         const responseArray = Object.entries(responses).map(
  //           ([socketId, data]) => ({
  //             socketId,
  //             ...data,
  //           })
  //         );
  //         console.log("서버에서 emit결과", responseArray);
  //       }
  //     }
  //   );
  //   callback({
  //     status: 200,
  //     message: "서버에서 받았어요",
  //   }); // 룸은 나중에
  // });

  // socket.on("typing", (inputState) => {
  //   io.emit("typing", {
  //     // 현재 룸배제하고 io로 함.
  //     //to(socketRoomId[1])
  //     isEmpty: inputState.isEmpty,
  //   });
  // });
  // io.emit("message");

  // 만약에 룸에 포함된 사람이 아무도 없으면 룸 삭제해야함.
  // 룸삭제 ?
  /**
   * * 대화방에서 다시찾기나 홈으로 돌아갈 시 남은 사람도 방을 leave해야헤
   * * 근데 다시찾기를 새로 이벤틀르 파면 같은 로직을 두번쓰자니 중복되고
   *
   */
  //포스트맨
  // socket.on("leaving-room", () => {
  //   chatEndTime = Date.now();
  //   console.log("chatEndtime", chatEndTime);
  //   console.log("chatStartTime", chatStartTime);
  //   chatLapseTime = calLapseTime(chatEndTime, chatStartTime);
  //   io.to(socketRoomId[1]).emit("user-exit-chat", time, chatLapseTime);
  //
  //   socket.leave(socketRoomId[1]);
  //   console.log("socket.rooms여부", socket.rooms);
  // });
});
server.listen(5000, () => {
  console.log("5000포트에서 서버 실행중");
});
