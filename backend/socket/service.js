import {
  bothJoinRoom,
  bothLeaveRoom,
  broadcastRoomAlert,
  broadcastEmitMessage,
} from "./module/socketFunc.js";
import {
  queueIn,
  matching,
  matchCancel,
  userClickTracker,
  userClickTrackerDelete,
  customTimeoutQueueOut,
  leftQueue,
} from "#module/matchingFunc.js";
import { bothTimeout } from "../utility/time.js";
import { wrapper } from "../utility/wrapper.js";
import { setSocketProperties } from "../utility/addProperties.js";

let pendingMatch = new Set();
let matchingResult;
let roomList = new Map();
let roomLatestMessageIdx = new Map();
let count = 1; // roomList용 카운트

export const matchStartService = (socket, io) => {
  return wrapper((callback) => {
    console.log("random-match 실행중");
    // 매칭시작시간 기록
    socket.enterTime = Date.now();
    // 매칭된적있는 user가 기록되어있는지 확인
    if (!socket.checkUserPair) {
      socket.checkUserPair = new Set();
    }
    // 1. 대기열에 등록
    // - 종료되엇는데 계속 채팅이 가는 이유
    // - 왜

    let returnSocket = queueIn(socket);

    // 2. 중복인지 매칭인지 확인한다.
    if (!returnSocket) {
      // 중복인 경우
      return callback({
        status: 202,
        message: "중복등록",
      });
    }

    // 중복이 아닌경우
    callback({
      status: 201,
      message: "매칭등록",
    });
    // 타임아웃을 시작한다.
    socket.timer = setTimeout(() => {
      console.log("현재 타입아웃 실행됨");
      console.log("현재 소켓 id", socket.id);
      if (pendingMatch.has(socket.id)) {
        return;
      }
      socket.emit("match-result", {
        data: {
          type: "timeout",
        },
      });
      customTimeoutQueueOut(socket);
      userClickTracker.delete(socket.id);
    }, 10000);

    // match 로직이 너무 길어서 pendingMatch로 lock여부 추가
    pendingMatch.add(socket.id);
    // 매칭함수 실행
    matchingResult = matching(socket);

    // 매칭실패시 종료
    if (!matchingResult) {
      pendingMatch.delete(socket.id);
      return;
    }

    roomList.set(count, matchingResult);

    let partnerSocket;
    partnerSocket = io.sockets.sockets.get(matchingResult.partner.id);

    // 파트너소켓이 없으면 종료
    if (!partnerSocket) {
      pendingMatch.delete(socket.id);
      return;
    }

    setSocketProperties(
      {
        socket,
        partnerSocket,
      },
      {
        roomListCount: count, // 몇번째 방인지
      },
      "matchStart"
    );
    // 다음 roomList를 위한 count 증가
    count++;
    // messageIdx값 저장
    roomLatestMessageIdx.set(matchingResult.randomRoom, 0);
    bothTimeout(socket, partnerSocket);
    bothJoinRoom(socket, partnerSocket, matchingResult.randomRoom);
    broadcastRoomAlert(io, socket, matchingResult.randomRoom, "join");
    userClickTrackerDelete(socket.id, partnerSocket.id);
    pendingMatch.delete(socket.id);
    console.log("매칭성공");
  });
};

export const matchCancelService = (socket, io) => {
  return wrapper((callback) => {
    matchCancel(socket);
    clearTimeout(socket.timer);
    // 중복누름 확인용 set에서 제거
    userClickTracker.delete(socket.id);
    callback({
      status: 204,
      message: "매치취소",
    });
  });
};

export const roomOutsideService = (socket, io) => {
  // test위한 주석추가
  return wrapper((callback) => {
    const room = [...socket.rooms];
    const roomListIdx = socket.roomListIdx;
    const roomInfo = roomList.get(roomListIdx);
    console.log("현재 roomInfo", roomInfo);

    if (!roomInfo) {
      // 홈버튼을 눌렀을때
      // 여기가 언제?

      console.log("홈버튼을 눌렀을시");
      userClickTracker.delete(socket.id);
      clearTimeout(socket.timer);
      leftQueue(socket);
      socket.leave(room[1]);
      socket.roomListIdx = undefined;
      return;
    }

    let partnerSocket;
    if (roomInfo.me.id == socket.id) {
      partnerSocket = io.sockets.sockets.get(roomInfo.partner.id);
    } else if (roomInfo.partner.id == socket.id) {
      partnerSocket = io.sockets.sockets.get(roomInfo.me.id);
    }

    // 룸리스트에서 제거
    roomList.delete(roomListIdx);
    count--;

    // 중복누름 확인용 set에서 제거
    userClickTrackerDelete(socket.id, partnerSocket.id);

    // room별 messageIdx 지움
    roomLatestMessageIdx.delete(room[1]);

    //roomId 제거
    setSocketProperties(
      {
        socket,
        partnerSocket,
      },
      {
        dateNow: Date.now(),
      },
      "roomOutside"
    );
    broadcastRoomAlert(io, socket, room[1], "out");
    bothLeaveRoom(socket, partnerSocket, room[1]);
    console.log("roomoutside채팅종료");
  });
};

export const disconnectService = (socket, io) => {
  return () => {
    try {
      let chatEndTime = Date.now();
      const room = [...socket.rooms];
      const currentTime = new Date();
      if (!socket.roomListIdx || !roomList.get(socket.roomListIdx)) return;

      broadcastRoomAlert(io, socket, room[1], "out");

      // 룸리스트에서 삭제
      roomList.delete(socket.roomListIdx);
      count--;
      // 최신 messageIdx 삭제
      roomLatestMessageIdx.delete(room[1]);
      // 중복누름 확인용 set에서 제거
      userClickTracker.delete(socket.id);
      console.log("disconnect 시  userClickTracker", userClickTracker);
      // 소켓룸아이디 제거
      socket.roomListIdx = undefined;
      // 현 소켓과 연결되었었던 소켓들의 checkUserPair에서 현소켓 삭제
      const pairArray = [...socket.checkUserPair];
      if (pairArray) {
        console.log("값이 있을때 ,", pairArray);
      } else if (!pairArray) {
        console.log("값이 없을때 ,", pairArray);
      }

      if (!pairArray) return;
      for (let elem of pairArray) {
        const partnerSocket = io.sockets.sockets.get(elem);
        if (!partnerSocket) continue;
        partnerSocket.checkUserPair.delete(socket.id);
      }
      console.log("disconnect채팅종료");
    } catch (err) {
      console.log("disconnect에서 서버에러", err);
    }
  };
};

export const chatMessageService = (socket, io) => {
  return (message, callback) => {
    try {
      const currentTime = new Date();
      const room = [...socket.rooms];
      let messageIdx = roomLatestMessageIdx.get(room[1]);
      roomLatestMessageIdx.set(room[1], ++messageIdx);
      broadcastEmitMessage(io, socket, room[1], messageIdx, message);
    } catch (err) {
      callback({
        status: 500,
        message: "서버에러",
      });
    }
  };
};

export const chatTypingService = (socket, io) => {
  return (typingState) => {
    const room = [...socket.rooms];
    socket.broadcast.to(room[1]).emit("chat-typing", {
      data: {
        typing: typingState,
      },
    });
  };
};

export const midnightAlertService = (socket, io) => {
  return () => {
    try {
      const currentTime = new Date();
      for (let elem of roomList) {
        broadcastRoomAlert(io, socket, elem.randomRoom, "midnight");
      }
    } catch (err) {
      console.log("자정에러발생", err);
    }
  };
};
