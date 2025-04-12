export const setSocketProperties = (sockets, data, type) => {
  let socket = sockets.socket;
  let partnerSocket = sockets.partnerSocket;
  let roomListCount, dateNow;
  if (data.roomListCount) {
    roomListCount = data.roomListCount;
  } else if (data.dateNow) {
    dateNow = data.dateNow;
  }
  // 일반화를 어떻게 시키지? 생각해보잗ㅈ
  const handle = {
    matchStart: () => {
      // roomList Idx 추가
      console.log("roomListCount", roomListCount);
      socket.roomListIdx = roomListCount;
      partnerSocket.roomListIdx = roomListCount;
      // queue내에서의 정보 초기화
      socket.myPosInQueue = undefined;
      partnerSocket.myPosInQueue = undefined;
      // 채팅시작시간 저장
      socket.chatStartTime = Date.now();
      partnerSocket.chatStartTime = Date.now();
      //매칭되었던 유저 저장
      socket.checkUserPair.add(partnerSocket.id);
      partnerSocket.checkUserPair.add(socket.id);
    },
    roomOutside: () => {
      socket.chatEndTime = dateNow;
      partnerSocket.chatEndTime = dateNow;
      socket.roomListIdx = undefined;
      partnerSocket.roomListIdx = undefined;
      socket.myPosInQueue = undefined;
      partnerSocket.myPosInQueue = undefined;
    },
  };
  const resultFunction = handle[type];
  if (resultFunction) {
    resultFunction();
  } else {
    throw new Error("타입이 없어요");
  }
};
