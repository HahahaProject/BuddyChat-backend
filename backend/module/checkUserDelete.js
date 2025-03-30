import { checkUsers } from "../matching.js";

export const checkUsersDelete = (socketId, partnerId) => {
  checkUsers.delete(socketId);
  checkUsers.delete(partnerId);
};
