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
  let partner, index, roomName, me;
  if (pairList.length == 0 && currentQueueStatus.length == 2) {
    // 매칭된적이 없고, 대기열속에 본인밖에 없는경우
    console.log("본인밖에 없어요");
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
    roomName = uuidv4();
    socket.myPosInQueue = undefined;
    return {
      partner: partner,
      room: roomName,
    };
  } else {
    console.log("pairList.size ", pairList.size);
    console.log(" currentQueueStatus.length", currentQueueStatus.length);
    console.log("이상하게 여기로 와요..");
    // 여기 매칭취소하고 다시 구현
    // 매칭된적이 있고, 대기열속에 사람들이 있을거나 본인밖에 없을때?
    index = 1;
    for (let elem of pairList) {
      if (elem == priorityQueue.peek(i)) {
        continue;
      } else {
        break;
      }
      index++;
    }
  }

  /**
   * 한번도 매칭되지 않았던 사람이랑 매칭한다.
   * ->매칭기록은 checkUserPair에 저장되어있다.
   * ->checkUserPair에 저장된 사람들을 제외한다.
   *    그러려면 우선 저장된 사람들을 안다.
   *    저장된 사람들이 어느 인덱스인지 안다.
   *    그 인덱스를 제외하고 가장 최소값인덱스를 peek한다.
   * -> 매칭성공하면 checkUserPair에 등록한다.
   */
  // 한번도 매칭되지 않았던 사람이랑 매칭함.
  // 매칭기록을 남김.
};

// }
// 이걸 어떻게 하지???
/**
 * 총 세가지 경우가 잇음.
 * 1. queue에 1명밖에 없어서 그냥 아무값없이 return 하는 경우
 * 2. queue에 애초부터 2명이상이어서 그냥 queue.shift해도 아무 상관없는경우
 * 3. queue에 2명이라서 shitf되면 0인경우
 */
//이거를 트랜잭션으로 해야할것같음.중간에 방해받으면 안되니까

export const matchCancel = (socket) => {
  console.log("삭제될 소켓 pos", socket.myPosInQueue);
  if (socket.myPosInQueue) {
    priorityQueue.removeAt(socket.myPosInQueue);
  }
};

// 아
// 어 문제 발생 이 경우에는 어떻게 해야하지?
/**
 * 매칭취소를 하거나 소킷이 끊기면 큐에서 나가야함.
 * 왜 랜덤매칭버튼을 누른적이 없는데 왜 왜 Myposinqueue가 존재하지?
 */

export const waiting20 = () => {
  return new Promise((resolve, reject) => {
    queueEvent.on("20sStop", () => {
      clearTimeout(timerIdentifier);
      console.log("clearTimeout실행");
    });
    timerIdentifier = setTimeout(() => {
      console.log("clearTimeout이 실행되고 있지 않음. ");
      queue.shift();
      reject();
    }, 20000);

    //큐에 사람이 들어오면
    queueEvent.on("queueIn", () => {
      console.log("queueIn이벤트 on");
      user1 = queue.shift();
      user2 = queue.shift();
      roomName = uuidv4();

      resolve([user1, user2, roomName]);
    });
  });
};
