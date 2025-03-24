import { v4 as uuidv4 } from "uuid";
import { checkUsers } from "../matching.js";
export let matchSuccessObject = (socket) => {
  const chatStartTime = Date.now();
  const randomRoom = uuidv4();
  checkUsers.delete(socket.id);
  socket.myPosInQueue = undefined;
  return {
    me: "",
    partner: "",
    andomRoom: randomRoom,
    chatStartTime: chatStartTime,
  };
};
