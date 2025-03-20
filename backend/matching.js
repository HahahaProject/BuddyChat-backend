import { v4 as uuidv4 } from "uuid";
import EventEmitter from "events";
import { PriorityQueue } from "./priorityQueue.js";
class QueueEventListener extends EventEmitter {}
export const queueEvent = new QueueEventListener();

let priorityQueue = new PriorityQueue();
let checkUsers = new Set(); // 중복버튼 클릭인지 확인용
let checkUserPair = new Map(); // 짝지어진 적이 있는 경우 모음
let myPosInQueue;
export const queueIn = (socketInfo) => {
  // 중복을 검사해서 줄복이면 우선순위큐에 넣지않음.
  if (!checkUsers.has(socketInfo.socketId)) {
    myPosInQueue = priorityQueue.insert(socketInfo);
    console.log("큐에서 내 포지션", myPosInQueue);
    checkUsers.add(socketInfo.socketId);
    return true;
  } else {
    //중복등록함
    return false;
  }
};

export const matching = (id) => {
  // socketid가 했었던 pairList를 반환받음.
  let pairList = new Set(checkUserPair.get(id) || []);
  let currentQueueStatus = priorityQueue.peekAll();
  let partner, index, roomName, me;
  if (pairList.size == 0 && currentQueueStatus.length == 2) {
    // 매칭된적이 없고, 대기열속에 본인밖에 없는경우
    return;
  } else if (pairList.size == 0 && currentQueueStatus.length > 2) {
    // 매칭된적이 없고, 대기열속에 사람들이 있을때
    for (index = 1; index < currentQueueStatus.length; index++) {
      if (id !== priorityQueue.peek(index).socketId) {
        me = priorityQueue.shift(myPosInQueue);
        partner = priorityQueue.shift(index);
        break;
      }
    }
    roomName = uuidv4();
    return {
      partner: partner,
      room: roomName,
    };
  } else {
    // 여기 매칭취소하고 다시 구현
    // 매칭된적이 있고, 대기열속에 사람들이 있을때 , 대기열속에 본인밖에 없을때?
    index = 1;
    console.log("pairList", pairList);
    for (let elem of pairList) {
      if (elem == priorityQueue.peek(i)) {
        continue;
      } else {
        break;
      }
      index++;
    }
  }

  // 매칭해야할 인덱스
  // partner = priorityQueue.peek(index);
  // const roomName = uuidv4();

  // // 이부분이 좀 이상한데?
  // pairList.add(partner);
  // checkUserPair.set(id, pair);

  // return {
  //
  // };
  //   user1 = queue.shift();
  //   user2 = queue.shift();
  //   roomName = uuidv4();
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
/**
 * 중복구현
 * 소켓아이디 쌍을 저장한다.
 * 만약에
 */

//같은 사용자면 큐에 못넣음
// queue 순회 후 같은 socketid있으면 안됨.
// for (let elem of queue) {
//   if (elem == socketId) {
//     console.log("queue에 같은 id 발견");
//     return;
//   }
// }
// queue.push(socketId);
// console.log("queue.length", queue.length);
// if (queue.length > 1) {
//   queueEvent.emit("queueIn");
//   return {
//     first: user1,
//     second: user2,
//     roomName: roomName,
//   };
// }
// 이걸 어떻게 하지???
/**
 * 총 세가지 경우가 잇음.
 * 1. queue에 1명밖에 없어서 그냥 아무값없이 return 하는 경우
 * 2. queue에 애초부터 2명이상이어서 그냥 queue.shift해도 아무 상관없는경우
 * 3. queue에 2명이라서 shitf되면 0인경우
 */
// if (queue.length == 1) {
//   console.log("여기가 실행됨");
//   return;
// } else {
//   console.log("두명이상");
//   user1 = queue.shift();
//   user2 = queue.shift();
//   roomName = uuidv4();
// }
// console.log("user1", user1);
// console.log("user2", user2);
// console.log("queue", queue);
// //두 사용자 반환
// return {
//   first: user1,
//   second: user2,
//   roomName: roomName,
// };
//이거를 트랜잭션으로 해야할것같음.중간에 방해받으면 안되니까

export const matchCancel = (socketId) => {
  console.log("삭제될 소켓Id", socketId);
  //20초 그만
  queueEvent.emit("20sStop");
  //해당 socket에 해당하는 사용자 대기열에서 삭제
  let identNumber = 0;
  for (let elem of queue) {
    if (elem == socketId) {
      queue.splice(identNumber, 1);
    } else {
      identNumber++;
    }
  }
  console.log("현재 queue", queue);
};

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
