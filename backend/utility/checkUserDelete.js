import { checkUsers } from "../socket/module/matchingFunc.js";

export const checkUsersDelete = (socketId, partnerId) => {
  checkUsers.delete(socketId);
  checkUsers.delete(partnerId);
};
