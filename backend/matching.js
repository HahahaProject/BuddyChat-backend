import { v4 as uuidv4 } from "uuid";
import EventEmitter from "events";
import { PriorityQueue } from "./priorityQueue.js";
class QueueEventListener extends EventEmitter {}
export const queueEvent = new QueueEventListener();

let priorityQueue = new PriorityQueue();
let checkUsers = new Set(); // 중복버튼 클릭인지 확인용
// disconnect될때 checkUsers에셔 해당 id 없애줘야함.
let myPosInQueue;

export const queueIn = (socket) => {
  // 중복을 검사해서 줄복이면 우선순위큐에 넣지않음.
  // 짝지어진 적이 있는 경우 모음
  if (!checkUsers.has(socket.id)) {
    socket.myPosInQueue = priorityQueue.insert(socket.id);
    checkUsers.add(socket.id);
    return socket;
  } else {
    //중복등록함
    return false;
  }
};

export const matching = (socket) => {
  // socketid가 했었던 pairList를 반환받음.
  let pairList = [...socket.checkUserPair] || [];
  let currentQueueStatus = priorityQueue.peekAll();
  let partner, index, randomRoom, me, chatStartTime;
  if (pairList.length == 0 && currentQueueStatus.length == 2) {
    // 매칭된적이 없고, 대기열속에 본인밖에 없는경우
    console.log("매칭된적 없고, 본인밖에 없어요");
    return;
  } else if (pairList.length == 0 && currentQueueStatus.length > 2) {
    // 매칭된적이 없고, 대기열속에 사람들이 있을때
    console.log("매칭된적 없고 대기열에 또 다른 누군가가 있어요");
    for (index = 1; index < currentQueueStatus.length; index++) {
      if (socket.id !== priorityQueue.peek(index).socketId) {
        me = priorityQueue.shift(socket.myPosInQueue);
        partner = priorityQueue.shift(index);
        break;
      }
    }
    chatStartTime = Date.now();
    randomRoom = uuidv4();
    socket.myPosInQueue = undefined;
    return {
      me: me,
      partner: partner,
      randomRoom: randomRoom,
      chatStartTime: chatStartTime,
    };
  } else if (currentQueueStatus.length == 2) {
    console.log("매칭된적 있고 대기열에 나만 있어요");
    return;
  } else {
    console.log("매칭된적 있고, 대기열에 매치되었던 사람뿐이에요");
    socket.checkUserPair;
    console.log("매칭된적 있고, 대기열에 매치된적 없는 새로운사람이 있어요 ");
  }
};

export const matchCancel = (socket) => {
  console.log("삭제될 소켓 pos", socket.myPosInQueue);
  if (socket.myPosInQueue) {
    priorityQueue.removeAt(socket.myPosInQueue);
  }
};
