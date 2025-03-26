import { timeFormat, midnight, calLapseTime, timeout } from "./module/time.js";

export const joinRoom = (socket, partnerSocket, randomRoom) => {
  socket.join(randomRoom);
  partnerSocket.join(randomRoom);
};

export const leaveRoom = (socket, partnerSocket, randomRoom) => {
  socket.leave(randomRoom);
  partnerSocket.leave(randomRoom);
};

export const roomAlert = (io, socket, randomRoom, type) => {
  const currentTime = new Date();

  const handler = {
    join: () => {
      io.to(randomRoom).emit("room-alert", {
        status: 200,
        message: "매치 성공",
        date: {
          type: "join",
          joinTime: timeFormat(currentTime),
          nickName: socket.nickName || null,
          roomName: null,
          socket: socket.id,
        },
      });
    },
    out: () => {
      io.to(randomRoom).emit("room-alert", {
        status: 200,
        message: "채팅방 종료",
        data: {
          type: "out",
          roomOutTime: timeFormat(currentTime),
          chatTime: calLapseTime(socket.chatEndTime, socket.chatStartTime),
          nickName: socket.nickName || null,
          socket: socket.id,
        },
      });
    },
    midnight: () => {
      io.to(randomRoom).emit("room-alert", {
        status: 206,
        message: "자정알림",
        data: {
          midnight: midnight(currentTime),
        },
      });
    },
  };
  const resultFunction = handler[type];
  if (resultFunction) {
    resultFunction();
  } else {
    throw new Error("타입이 없어요");
  }
};

export const emitMessage = (io, socket, randomRoom, messageIdx, message) => {
  const currentTime = new Date();
  io.timeout(1000)
    .to(randomRoom)
    .emit(
      "chat-message",
      {
        status: 201,
        message: "수신",
        data: {
          chatMessageIdx: messageIdx,
          chatTime: timeFormat(currentTime),
          sender: socket.id,
          nickName: socket.nickname || null,
          chatMessage: message,
        },
      },
      (err, response) => {
        if (err) {
          throw new Error("chat-message에서 에러발생");
        } else {
        }
      }
    );
};
