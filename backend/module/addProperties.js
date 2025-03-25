export const addSocketProperties = (data) => {
  let socket = data.socket;
  let partnerSocket = data.partnerSocket;
  let roomListCount = data.roomListCount;

  // roomList Idx 추가
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
};
