import {
  Home,
  RandomMatch,
  ChatRoom,
  GroupChat,
  NotFound,
} from "../static/componenet.js";
import { io } from "https://cdn.socket.io/4.8.1/socket.io.esm.min.js";
const $root = document.getElementById("root");
const $navigation = document.getElementById("navigation");
const $script = document.getElementById("addSrc");
// const $input = document.getElementById("input");
const routes = [
  { path: "/", component: Home },
  { path: "/match", component: RandomMatch },
  { path: "/chatRoom", component: ChatRoom },
  { path: "/groupRoom", component: GroupChat },
];
const socket = io("http://localhost:5000");
const render = async (path) => {
  try {
    const component =
      routes.find((route) => route.path === path)?.component || NotFound;
    await $root.replaceChildren(await component());
    // 여기가 문제가 생길 수 있음.
    // 여전히 이상하고 이해가 안된다.
    // const button = document.getElementById("randomButton");
    // if (button) {
    //   button.addEventListener("click", () => {
    //     console.log("랜덤 매칭 클릭됨");
    //     socket.emit("random-match");
    //   });
    // } else {
    //   console.log("randomButton 없음");
    // }

    // const keyboard = document.getElementById("keyboard");
    // if (keyboard) {
    //   keyboard.addEventListener("keydown", () => {
    //     console.log("키 입력 감지");
    //     socket.emit("typing");
    //   });
    // } else {
    //   console.log("keyboard 없음");
    // }
    $script.setAttribute("type", "module");
    $script.setAttribute("src", "./static/socket.js");
  } catch (err) {
    console.log("에러", err);
  }
};

$navigation.addEventListener("click", (e) => {
  e.preventDefault();
  const path = e.target.getAttribute("href");
  window.history.pushState({}, null, path);
  /**
   * history.pushState는 페이지이동없이 페이지 주소만 변경할 때 사용.
   * 근데 이게 왜 필요한ㄱ데?
   */
  render(path);
});

const onKeyDown = () => {
  // typing 이벤트를 emit 하고
  // socket.emit을 해야하는데 여기서 socket.emit을 바로 쓸 수가 없나?
  // socket.on으로 받으면 <p>태그에 상대방이 타이핑중을 띄운다.
};

/**
 * popstate 이벤트는 뒤로가기나 앞으로가기 눌렀을때 실행되는 이벤트
 */
window.addEventListener("popstate", () => {
  console.log("window.location.pathname", window.location.pathname);
  render(window.location.pathname);
});
