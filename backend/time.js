export const currentDate = new Date();

export const time = `${currentDate.getFullYear()}-${
  currentDate.getMonth() + 1
}-${currentDate.getDate()} ${currentDate.getHours()}:${currentDate.getMinutes()}:${currentDate.getSeconds()}`;

export const messageTime = `
    ${currentDate.getHours()} : ${currentDate.getMinutes()}`;
// 더 이쁘게 00:00 으로 오게 고치기

export const calLapseTime = (chatEndTime, chatStartTime) => {
  const lapseTime = chatEndTime - chatStartTime;
  console.log("lapseTime", lapseTime);
  // const hour = String(Math.floor((lapseTime / (1000 * 60 * 60)) % 24)).padStart(
  //   2,
  //   "0"
  // ); // 시
  const minutes = String(Math.floor((lapseTime / (1000 * 60)) % 60)).padStart(
    2,
    "0"
  ); // 분
  const second = String(Math.floor((lapseTime / 1000) % 60)).padStart(2, "0"); // 초
  const result = `${minutes} : ${second}`;

  return result;
};
