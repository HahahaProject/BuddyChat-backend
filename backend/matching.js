import { v4 as uuidv4 } from "uuid";
import EventEmitter from "events";
class QueueEventListener extends EventEmitter {}
const queueEvent = new QueueEventListener();

let queue = [];
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
  if (queue.length > 1) {
    queueEvent.emit("queueIn");
  }

  let user1, user2, roomName;
  /**
   * 두 사용자를 뽑을때 조건
   * 1. 중복되어 뽑히지 않는다.
   * 2. 오래 들어온 사람들이 먼저 뽑힌다.
   */
  /**
   * 20초를 기다리는 경우는
   * 두 사용자를 뽑을때 2명이하이거나
      모두 매칭되었던 사람일때 

      들어가고 삭제한 상태를 알려줘야함. 
      status ok 

      이 두개를 비교해보겠다. 
      
      소켓연결을 끊는다고 하면 
      소켓 연결이됐냐안됐냐를 따라서 프론트에서 처리함. 

      성능쪽으로 어느면이 더 좋은지 확인

   */

  if (queue.length < 2) {
    // 2명이하일경우 매칭이안됨.
    // 그럼 여기서 기다려야함.
    // 그럼 Promise 로 20초 기다리는데
    // console.log("두명이하");
    // user1 = "yet";
    // user2 = "yet";
    // roomName = "";
    return;
  } else {
    user1 = queue.shift();
    user2 = queue.shift();
    roomName = uuidv4();
    console.log("두명이상");
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

export const matchCancel = (socketId) => {
  //해당 socket에 해당하는 사용자 대기열에서 삭제
  //
};

export const waiting20 = () => {
  return new Promise((resolve, reject) => {
    let timerIdentifier = setTimeout(() => {
      queue.shift();
      reject();
    }, 20000);

    //큐에 사람이 들어오면
    queueEvent.on("queueIn", () => {
      resolve();
      clearTimeout(timerIdentifier);
    });
  });
};
