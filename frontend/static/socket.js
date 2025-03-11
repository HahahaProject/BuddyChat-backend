import { io } from "https://cdn.socket.io/4.8.1/socket.io.esm.min.js";

const socket = io("http://localhost:5000");
let roomName;
socket.on("connect", () => {
  console.log("웹소켓 연결");
});

console.log("뭐가 Null", document.getElementById("randomButton"));
document.getElementById("randomButton").addEventListener("click", () => {
  socket.emit("random-match");
});
//

socket.on("status-queue", (data) => {
  console.log("status", data);
});
socket.on("match-success", (matchingTime) => {
  // 이때 채팅룸으로 페이지 이동하면 안됨

  location.href = "./chatRoom.html";
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
socket.on("midnight-alert");
// 나가기 버튼 누르면
