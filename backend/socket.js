import { timeFormat, midnight, calLapseTime } from "./module/time.js";

export const bothJoinRoom = (socket, partnerSocket, randomRoom) => {
  socket.join(randomRoom);
  partnerSocket.join(randomRoom);
};

export const bothLeaveRoom = (socket, partnerSocket, randomRoom) => {
  socket.leave(randomRoom);
  partnerSocket.leave(randomRoom);
};

export const broadcastRoomAlert = (io, socket, randomRoom, type) => {
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
          socketId: socket.id,
        },
      });
    },
    out: () => {
      io.to(randomRoom).emit("room-alert", {
        status: 204,
        message: "채팅방 종료",
        data: {
          type: "out",
          roomOutTime: timeFormat(currentTime),
          chatTime: calLapseTime(socket.chatEndTime, socket.chatStartTime),
          nickName: socket.nickName || null,
          socketId: socket.id,
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

export const broadcastEmitMessage = (
  io,
  socket,
  randomRoom,
  messageIdx,
  message
) => {
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
          senderId: socket.id,
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
