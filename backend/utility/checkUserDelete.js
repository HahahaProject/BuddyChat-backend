import { checkUsers } from "#module/matchingFunc.js";

export const checkUsersDelete = (socketId, partnerId) => {
  checkUsers.delete(socketId);
  checkUsers.delete(partnerId);
};
