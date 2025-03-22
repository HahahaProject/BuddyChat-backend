const TIME_ZONE = 9 * 60 * 60 * 1000;

export const time = (currentDate) => {
  return `${currentDate.getFullYear()}-${
    currentDate.getMonth() + 1
  }-${currentDate.getDate()} ${currentDate.getHours()}:${currentDate.getMinutes()}:${currentDate.getSeconds()}`;
};

export const midnight = (currentDate) => {
  return `${currentDate.getFullYear()}-${
    currentDate.getMonth() + 1
  }-${currentDate.getDate()} 00:00:00`;
};

export const messageTime = (currentDate) => {
  return `${new Date(currentDate.getTime() + TIME_ZONE)
    .toISOString()
    .replace("T", " ")
    .slice(11, -8)}
`;
};

export const calLapseTime = (chatEndTime, chatStartTime) => {
  const lapseTime = chatEndTime - chatStartTime;
  const hour = String(Math.floor((lapseTime / (1000 * 60 * 60)) % 24)).padStart(
    2,
    "0"
  ); // 시
  const minutes = String(Math.floor((lapseTime / (1000 * 60)) % 60)).padStart(
    2,
    "0"
  ); // 분
  const second = String(Math.floor((lapseTime / 1000) % 60)).padStart(2, "0"); // 초
  const result = `${hour} : ${minutes} : ${second}`;

  return result;
};
