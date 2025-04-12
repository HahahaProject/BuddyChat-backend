import { v4 as uuidv4 } from "uuid";
import { PriorityQueue } from "#utility/priorityQueue.js";

let priorityQueue = new PriorityQueue();

export let userClickTracker = new Set(); // 중복버튼 클릭인지 확인용

export const queueIn = (socket) => {
  console.log("queueIn실행중");
  console.log("현재 본인 socket.id", socket.id);
  console.log("queueIn에서 userClickTracker", userClickTracker);
  // 중복을 검사해서 줄복이면 우선순위큐에 넣지않음.
  // 짝지어진 적이 있는 경우 모음
  try {
    if (!userClickTracker.has(socket.id)) {
      const insertInfo = {
        id: socket.id,
        enterTime: socket.enterTime,
      };
      // 왜 중복등록이 발생함이 안나오지?

      // priorityQueue안에 중복되어 들어가지 않도록

      console.log("return 했는데 실행됨?");
      priorityQueue.insert(insertInfo);
      userClickTracker.add(socket.id);
      console.log("userClickTracker add", userClickTracker);
      console.log("현재 priorityqueue상태", priorityQueue.peekAll());
      return socket;
    } else {
      //중복등록함
      console.log("중복등록이 발생함", userClickTracker);
      return false;
    }
  } catch (err) {
    console.log("에러가 발생함");
    throw new Error("");
    // 여기를 어떻게 쓰지? 써야하나?
    // customerror?
  }
};

export const matching = (socket) => {
  console.log("matching 실행중");
  // socketid가 했었던 pairList를 반환받음.
  // checkUserPair는 pair를 했던 사람들의 기록
  let currentQueueStatus = priorityQueue.peekAll();
  let partner, randomRoom, me, chatStartTime;

  if (currentQueueStatus.length == 2) {
    console.log("1. 매칭된적 있든없든, 대기열에 본인밖에 없어요");
    return;
  } else {
    console.log("2. 대기열속에 사람들이 많아요.");
    // 대기열속에 매칭할 사람이 있던가 없던가.
    // 대기열속 본인이나 chatUserPair에 has로 했던 사람 다 제외

    // 파트너 결정
    for (let elem of currentQueueStatus) {
      if (!elem || elem.id == socket.id || socket.checkUserPair.has(elem.id)) {
        continue;
      } else {
        partner = elem;
        break;
      }
    }

    if (partner) {
      console.log("2-1. 매칭할 사람이 있어요.");
      let myPos;
      //나 힙에서 제거
      currentQueueStatus = priorityQueue.peekAll();
      currentQueueStatus.filter((elem, idx, arr) => {
        if (elem.id == socket.id) myPos = idx;
      });
      me = priorityQueue.shift(myPos);
      //파트너 힙에서 제거
      let partnerPos;

      currentQueueStatus.filter((elem, idx, arr) => {
        if (elem == partner) partnerPos = idx;
      });
      priorityQueue.shift(partnerPos);
      // 매치결과 반환
      const chatStartTime = Date.now();
      const randomRoom = uuidv4();

      return {
        type: "random",
        me: me,
        partner: partner,
        randomRoom: randomRoom,
        chatStartTime: chatStartTime,
      };
    } else {
      console.log("2-2. 매칭할 사람이 없어요.");
      return;
    }
  }
};

export const customTimeoutQueueOut = (socket) => {
  try {
    const currentQueueStatus = priorityQueue.peekAll();
    let myPos;
    console.log("currentQueueStatus", currentQueueStatus);
    myPos = currentQueueStatus.findIndex((elem) => elem.id === socket.id);
    console.log("CustomTimeout mypos", myPos);
    priorityQueue.removeAt(myPos);
    // 여기를 어떻게 짜야 효율적으로 짤까?
    console.log("customTimeout에서 queue현재상태", priorityQueue.peekAll());
  } catch (err) {
    console.log("CustomTimeoutQueueOut 에서 에러", err);
  }
};

export const matchCancel = (socket) => {
  try {
    const currentQueueStatus = priorityQueue.peekAll();
    currentQueueStatus.filter((elem, idx, arr) => {
      if (elem.id == socket.id) myPos = idx;
    });
    priorityQueue.removeAt(myPos);
    console.log("matchCancel에서 MyPosInfo", myPos);
    console.log("matchCancle에서 queue현재상태", priorityQueue.peekAll());
  } catch (err) {
    console.log("matchCancel에서 에러", err);
  }
};

export const userClickTrackerDelete = (socketId, partnerId) => {
  userClickTracker.delete(socketId);
  userClickTracker.delete(partnerId);
};

export const leftQueue = (socket) => {
  const currentQueueStatus = priorityQueue.peekAll();
  currentQueueStatus.filter((elem, idx, arr) => {
    if (elem.id === socket.id) {
      console.log("막기위해 실횅됨");
      priorityQueue.removeAt(idx);
      return;
    }
  });
};
