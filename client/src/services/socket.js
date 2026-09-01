import { io } from 'socket.io-client';

const SOCKET_URL = import.meta.env.VITE_API_BASE_URL || window.location.origin;

let socket = null;

export const getSocket = () => {
  if (!socket) {
    socket = io(SOCKET_URL, {
      autoConnect: true,
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 1000,
    });
  }
  return socket;
};

export const joinNegotiationRoom = (negotiationId) => {
  const s = getSocket();
  if (s && negotiationId) {
    s.emit('join_negotiation', negotiationId);
  }
};

export const leaveNegotiationRoom = (negotiationId) => {
  const s = getSocket();
  if (s && negotiationId) {
    s.emit('leave_negotiation', negotiationId);
  }
};
