import { io } from "https://cdn.socket.io/4.8.1/socket.io.esm.min.js";

const socket = io("http://localhost:5000");
let roomName;
socket.on("connect", () => {
  console.log("웹소켓 연결");
});

// console.log("뭐가 Null", document.getElementById("randomButton"));

//
document.getElementById("keyboard").addEventListener("keydown", () => {
  console.log("실행중?");
  socket.emit("typing");
});
document.getElementById("randomButton").addEventListener("click", () => {
  console.log("힘들다");
  socket.emit("random-match");
});
socket.on("status-queue", (data) => {
  console.log("status", data);
});
socket.on("match-success", (matchingTime) => {
  // 이때 채팅룸으로 페이지 이동하면 안됨
  console.log("matchingTime", matchingTime);
});
socket.on("matchingtime-start", () => {
  // 이 시간과 현재시간간의 차이 계산해서
  // 그 시간부터 20초까지 세기
  let stopWatch = document.getElementById("stopWatch");
  const clientTime = Date.now();
  let interval = setInterval(() => {
    stopWatch.innerHTML = new Date().toString();
  }, 1000);
});

document.getElementById("stopMatchButton").addEventListener("click", () => {
  socket.emit("match-cancel", () => {
    console.log("매칭취소");
  });
});

socket.on("match-fail", () => {
  console.log("매칭실패");
}); // 다시매칭 페이지 보여주든가 해야함
// 화면 바뀌고 매칭날짜알림출력
// 20초 지나면 다시 random-match

//----------------------- 대화방

// --- 포스트맨으로 테스트 한 부분
// socket.emit("message", message);
// socket.on("message", (message, time) => {
//   console.log("message", message);
//   console.log("time", time);
// });

socket.emit("leaving-room");
socket.on("user-exit-chat");

// --- 포스트맨 테스트 여기까지

socket.on("typing", () => {});
// 이건 직접 해봐야할 것 같은데
/**
 * 포스트맨으로 어떻게 ?
 *
 */
