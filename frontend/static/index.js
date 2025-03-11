import {
  Home,
  RandomMatch,
  ChatRoom,
  GroupChat,
  NotFound,
} from "../static/componenet.js";
const $root = document.getElementById("root");
const $navigation = document.getElementById("navigation");
const $script = document.getElementById("addSrc");
const routes = [
  { path: "/", component: Home },
  { path: "/match", component: RandomMatch },
  { path: "/chatRoom", component: ChatRoom },
  { path: "/groupRoom", component: GroupChat },
];

const render = async (path) => {
  try {
    const component =
      routes.find((route) => route.path === path)?.component || NotFound;
    await $root.replaceChildren(await component());
    // 여기가 문제가 생길 수 있음.
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

/**
 * popstate 이벤트는 뒤로가기나 앞으로가기 눌렀을때 실행되는 이벤트
 */
window.addEventListener("popstate", () => {
  console.log("window.location.pathname", window.location.pathname);
  render(window.location.pathname);
});

// window.addEventListener("DOMContentLoaded", () => {
//   console.log("언제로드?");
// });
