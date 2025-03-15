const createElement = (domString) => {
  const $temp = document.createElement("template");
  $temp.innerHTML = domString;
  return $temp.content;
};

const fetchData = async (url) => {
  const res = await fetch(url);
  console.log("res가 뭔데 ", res);
  const json = await res.json();
  return json;
};

export const Home = async () => {
  return createElement(`
    <h2>저희 Buddychat은요...</h2>`);
};
export const RandomMatch = async () => {
  return createElement(`<button id="randomButton">랜덤매칭</button>
      <p id="stopWatch"></p>
      <button id="stopMatchButton">매칭취소</button>
      `);
};
export const ChatRoom = async () => {
  return createElement(`
    <input id="keyboard" autocomplete="off" />
    <p id="status"></p>
    `);
};
export const GroupChat = async () => {};

export const NotFound = () => {
  createElement(`<h1>404 NotFound</h1>`);
};
