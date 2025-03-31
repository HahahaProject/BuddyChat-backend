import {
  matchStartService,
  matchCancelService,
  roomOutsideService,
  disconnectService,
  chatMessageService,
  chatTypingService,
  midnightAlertService,
} from "./service.js";
import cron from "node-cron";

export const socketController = (socket, io) => {
  socket.on("match-start", matchStartService(socket, io));
  socket.on("match-cancel", matchCancelService(socket, io));
  socket.on("room-outside", roomOutsideService(socket, io));
  socket.on("disconnect", disconnectService(socket));
  socket.on("chat-message", chatMessageService(socket, io));
  socket.on("chat-typing", chatTypingService(socket, io));
  cron.schedule("0 0 0 * * *", midnightAlertService(socket, io));
};
