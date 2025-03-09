import { v4 as uuidv4 } from "uuid";
import EventEmitter from "events";
class QueueEventListener extends EventEmitter {}
export const queueEvent = new QueueEventListener();

let queue = [];
let user1, user2, roomName;
let timerIdentifier;
//큐에 같은 소켓이 못들어오게 막아야겟네 그럼 이것도 set으로 하는게 나을까
let nonDuplicateUserPair = new Set();
// nonDuplicateUserPair.add([socketId, socketId])
// 중복되는 값은 더해지지않음.
export const queueIn = (socketId) => {
  //대기열 큐에 넣고
  //같은 사용자면 큐에 못넣음

  // queue 순회 후 같은 socketid있으면 안됨.
  for (let elem of queue) {
    if (elem == socketId) {
      console.log("queue에 같은 id 발견");
      return;
    }
  }

  queue.push(socketId);
  console.log("queue.length", queue.length);
  if (queue.length > 1) {
    queueEvent.emit("queueIn");
    return {
      first: user1,
      second: user2,
      roomName: roomName,
    };
  }

  // 이걸 어떻게 하지???
  /**
   * 총 세가지 경우가 잇음.
   * 1. queue에 1명밖에 없어서 그냥 아무값없이 return 하는 경우
   * 2. queue에 애초부터 2명이상이어서 그냥 queue.shift해도 아무 상관없는경우
   * 3. queue에 2명이라서 shitf되면 0인경우
   */
  if (queue.length == 1) {
    console.log("여기가 실행됨");
    return;
  } else {
    console.log("두명이상");
    user1 = queue.shift();
    user2 = queue.shift();
    roomName = uuidv4();
  }
  console.log("user1", user1);
  console.log("user2", user2);
  console.log("queue", queue);

  //두 사용자 반환
  return {
    first: user1,
    second: user2,
    roomName: roomName,
  };
  //이거를 트랜잭션으로 해야할것같음.중간에 방해받으면 안되니까
};

export const matching = () => {};
export const matchCancel = (socketId) => {
  //해당 socket에 해당하는 사용자 대기열에서 삭제
  //
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
