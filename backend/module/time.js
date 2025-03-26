const TIME_ZONE = 9 * 60 * 60 * 1000;

export const timeFormat = (currentDate) => {
  let month = String(currentDate.getMonth() + 1).padStart(2, "0");
  let day = String(currentDate.getDate()).padStart(2, "0");
  let hour = String(currentDate.getHours()).padStart(2, "0");
  let minute = String(currentDate.getMinutes()).padStart(2, "0");
  return (
    currentDate.getFullYear() +
    "-" +
    month +
    "-" +
    day +
    " " +
    hour +
    ":" +
    minute
  );
};

export const midnight = (currentDate) => {
  let month = String(currentDate.getMonth() + 1).padStart(2, "0");
  let day = String(currentDate.getDate()).padStart(2, "0");

  return currentDate.getFullYear() + "-" + month + "-" + day + " 00:00";
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
  const seconds = String(Math.floor((lapseTime / 1000) % 60)).padStart(2, "0");

  return `${hour}:${minutes}:${seconds}`;
};

export const timeout = (socket, partnerSocket) => {
  clearTimeout(socket.timer);
  clearTimeout(partnerSocket.timer);
};
