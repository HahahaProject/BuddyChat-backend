import { Home, RandomChat, GroupChat, NotFound } from "../static/componenet.js";
import { io } from "https://cdn.socket.io/4.8.1/socket.io.esm.min.js";
const $root = document.getElementById("root");
const $navigation = document.getElementById("navigation");

const routes = [
  { path: "/", component: Home },
  { path: "/chatRoom", component: RandomChat },
  { path: "/groupRoom", component: GroupChat },
];

const render = async (path) => {
  try {
    const component =
      routes.find((route) => route.path === path)?.component || NotFound;
    console.log("component", component); // 왜 이게 안나올까?
    $root.replaceChildren(await component());
  } catch (err) {
    console.error(err);
  }
};

$navigation.addEventListener("click", (e) => {
  if (!e.target.matches(`#navigation > li > a`)) {
    console.log("여기가?");
    return;
  }
  e.preventDefault();
  console.log("navigation 실행중");
  const path = e.target.getAttribute("href");
  window.history.pushState({}, null, path);
  render(path);
});

window.addEventListener("popstate", () => {
  render(window.location.pathname);
});

window.addEventListener("DOMContentLoaded", () => {
  render("/");
});

//------------------------------ socket.io 관련 코드
const socket = io("http://localhost:5000");
let roomName;
socket.on("connect", () => {
  console.log("웹소켓 연결");
});

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
