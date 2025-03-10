const createElement = (domString) => {
  const $temp = document.createElement("template");
  $temp.innerHTML = domString;
  return $temp.content;
};

const fetchData = async (url) => {
  const res = await fetch(url);
  const json = await res.json();
  return json;
};

export const Home = async () => {
  const result = await fetchData("/");
  console.log("result", result);
};
export const RandomChat = async () => {
  return createElement(`<button id="randomButton">랜덤매칭</button>
      <p id="stopWatch"></p>
      <button id="stopMatchButton">매칭취소</button>`);
};
export const GroupChat = async () => {};

export const NotFound = () => {
  createElement(`<h1>404 NotFound</h1>`);
};
