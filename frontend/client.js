console.log("왜 안될까용?");

const socket = io();
let roomName;
socket.on("connect", () => {
  console.log("웹소켓 연결");
});

document.getElementById("randomButton").addEventListener("click", () => {
  socket.emit("random-match");
  console.log("왜 안나와!!!");
});
//

socket.on("status-queue", (data) => {
  console.log("실행됨");
  // 왜 안보이지?
  console.log("status", data);
});
socket.on("match-success", (matchingTime) => {
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
  socket.emit("random-match", null, (response) => {
    console.log("룸이름", response.roomName);
    roomName = response.roomName;
  });
});
socket.emit("match-cancel", () => {
  console.log("매칭실패");
});
socket.on("match-fail", () => {
  console.log("매칭실패"); // 이게 왜 안나올가?
}); // 다시매칭 페이지 보여주든가 해야함
// 화면 바뀌고 매칭날짜알림출력
// 20초 지나면 다시 random-match
socket.on("midnight-alert");
// 나가기 버튼 누르면
document.getElementById("leaveButton").addEventListener("click", () => {
  console.log("client에서 roomName", roomName);
  socket.emit("leaving-room", roomName);
});
