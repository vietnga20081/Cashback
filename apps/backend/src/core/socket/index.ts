import { Server as HttpServer } from 'http';
import { Server, Socket } from 'socket.io';
import { verifyAccessToken } from '../../modules/auth/auth.service';
import { env } from '../config/env';
import logger from '../logger';

let io: Server | null = null;

const userSockets = new Map<string, Set<string>>(); // userId -> Set<socketId>

export function initializeSocket(server: HttpServer): Server {
  io = new Server(server, {
    cors: {
      origin: env.FRONTEND_URL.split(','),
      credentials: true,
    },
    path: '/socket.io',
  });

  io.use((socket: Socket, next) => {
    const token = socket.handshake.auth?.token || socket.handshake.query?.token;
    if (!token) return next(new Error('Authentication required'));

    try {
      const payload = verifyAccessToken(token as string);
      (socket as any).userId = payload.userId;
      next();
    } catch {
      next(new Error('Invalid token'));
    }
  });

  io.on('connection', (socket: Socket) => {
    const userId = (socket as any).userId;
    logger.debug(`Socket connected: ${socket.id} (user: ${userId})`);

    if (!userSockets.has(userId)) userSockets.set(userId, new Set());
    userSockets.get(userId)!.add(socket.id);

    socket.join(`user:${userId}`);

    socket.on('disconnect', () => {
      userSockets.get(userId)?.delete(socket.id);
      if (userSockets.get(userId)?.size === 0) userSockets.delete(userId);
      logger.debug(`Socket disconnected: ${socket.id}`);
    });
  });

  return io;
}

export function getIO(): Server {
  if (!io) throw new Error('Socket.io not initialized');
  return io;
}

export function emitToUser(userId: string, event: string, data: unknown) {
  if (!io) return;
  io.to(`user:${userId}`).emit(event, data);
}

export function emitToAdmins(event: string, data: unknown) {
  if (!io) return;
  io.to('admins').emit(event, data);
}

export function isUserOnline(userId: string): boolean {
  return userSockets.has(userId) && userSockets.get(userId)!.size > 0;
}
