import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { createServer } from 'http';
import { Server } from 'socket.io';
import pkg from '@prisma/client';
import authRoutes from './routes/authRoutes.js';
import adminRoutes from './routes/adminRoutes.js';
import dashboardRoutes from './routes/dashboardRoutes.js';
import relationRequestRoutes from './routes/relationRequestRoutes.js';
import chatRoutes from './routes/chatRoutes.js';
import medicalRoutes from './routes/medicalRoutes.js';
import { PeerServer } from 'peer';
import { startReminderService } from './services/reminderService.js';
import logRoutes from './routes/logRoutes.js';

const { PrismaClient } = pkg;
const prisma = new PrismaClient();

dotenv.config();
const app = express();
const server = createServer(app);
const peerServer = PeerServer({ port: 9000, path: '/' });
console.log('✅ PeerJS server running on port 9000');


// ✅ CORS options (both for Express and Socket.io)
const corsOptions = {
  origin: "http://localhost:5173",
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"]
};

app.use(cors(corsOptions));
app.use(express.json());

// ✅ Socket.io with explicit CORS
const io = new Server(server, {
  cors: {
    origin: "http://localhost:5173",
    credentials: true,
    methods: ["GET", "POST"]
  },
  transports: ['websocket', 'polling']  
});

app.use('/api/auth', authRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/relations', relationRequestRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/medical', medicalRoutes);
app.use('/api/logs', logRoutes);

app.get('/api/health', (req, res) => {
  res.json({ message: 'Server is running 🚀' });
});

io.on('connection', (socket) => {
  console.log('🟢 New client connected:', socket.id);

  socket.on('join-room', ({ groupId, userId }) => {
    socket.join(groupId);
    console.log(`User ${userId} joined room ${groupId}`);
    socket.to(groupId).emit('user-joined', { userId, message: 'User joined the chat' });
  });

  socket.on('send-message', async ({ groupId, senderId, content, type = 'text' }) => {
    try {
      const message = await prisma.message.create({
        data: {
          groupId,
          senderId,
          content,
          type
        }
      });
      
      io.to(groupId).emit('receive-message', {
        id: message.id,
        groupId: message.groupId,
        senderId: message.senderId,
        content: message.content,
        type: message.type,
        timestamp: message.timestamp
      });
    } catch (error) {
      console.error('Error saving message:', error);
    }
  });

  socket.on('typing', ({ groupId, userId, isTyping }) => {
    socket.to(groupId).emit('user-typing', { userId, isTyping });
  });

  socket.on('disconnect', () => {
    console.log('🔴 Client disconnected:', socket.id);
  });
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`✅ Server running on http://localhost:${PORT}`);
  console.log(`✅ Socket.io running on ws://localhost:${PORT}`);
  startReminderService();
});

