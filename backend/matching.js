import { v4 as uuidv4 } from "uuid";
import { PriorityQueue } from "./module/priorityQueue.js";

let priorityQueue = new PriorityQueue();
export let checkUsers = new Set(); // 중복버튼 클릭인지 확인용

export const queueIn = (socket) => {
  // 중복을 검사해서 줄복이면 우선순위큐에 넣지않음.
  // 짝지어진 적이 있는 경우 모음
  try {
    if (!checkUsers.has(socket.id)) {
      const insertInfo = {
        id: socket.id,
        enterTime: socket.enterTime,
      };
      socket.myPosInQueue = priorityQueue.insert(insertInfo);
      checkUsers.add(socket.id);
      return socket;
    } else {
      //중복등록함
      return false;
    }
  } catch (err) {
    throw new Error("");
    // 여기를 어떻게 쓰지? 써야하나?
    // customerror?
  }
};

export const matching = (socket) => {
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
      //나 힙에서 제거
      me = priorityQueue.shift(socket.myPosInQueue);
      //파트너 힙에서 제거
      let partnerPos;
      currentQueueStatus = priorityQueue.peekAll();
      currentQueueStatus.filter((elem, idx, arr) => {
        if (elem == partner) partnerPos = idx;
      });
      priorityQueue.shift(partnerPos);
      // 매치결과 반환
      const chatStartTime = Date.now();
      const randomRoom = uuidv4();

      checkUsers.delete(socket.id);
      socket.myPosInQueue = undefined;

      return {
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

export const matchCancel = (socket) => {
  console.log("삭제될 소켓 pos", socket.myPosInQueue);
  if (socket.myPosInQueue) {
    priorityQueue.removeAt(socket.myPosInQueue);
  }
};
