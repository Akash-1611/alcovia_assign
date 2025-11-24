import express from 'express';
import cors from 'cors';
import { createServer } from 'http';
import { Server } from 'socket.io';
import dotenv from 'dotenv';
import routes from './routes';

dotenv.config();

const app = express();
const httpServer = createServer(app);

// Initialize Socket.io for real-time updates (Bonus #2)
const io = new Server(httpServer, {
  cors: {
    origin: process.env.FRONTEND_URL || '*',
    methods: ['GET', 'POST']
  }
});

// Middleware
app.use(cors({
  origin: process.env.FRONTEND_URL || '*',
  credentials: true
}));
app.use(express.json());

// Make io accessible in routes
app.set('io', io);

// Socket.io connection handling
io.on('connection', (socket) => {
  console.log('✅ Client connected:', socket.id);

  // Student joins their personal room for targeted updates
  socket.on('join_student_room', (studentId: string) => {
    socket.join(`student_${studentId}`);
    console.log(`📍 Student ${studentId} joined room`);
  });

  socket.on('disconnect', () => {
    console.log('❌ Client disconnected:', socket.id);
  });
});

// Routes
app.use('/api', routes);

// Error handling middleware
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

const PORT = process.env.PORT || 3000;

httpServer.listen(PORT, () => {
  console.log(`
╔═══════════════════════════════════════════════════════════╗
║                                                           ║
║     🚀 ALCOVIA INTERVENTION ENGINE - BACKEND LIVE        ║
║                                                           ║
║     Server:     http://localhost:${PORT}                    ║
║     WebSocket:  ws://localhost:${PORT}                      ║
║     Status:     READY FOR DEPLOYMENT                      ║
║                                                           ║
╚═══════════════════════════════════════════════════════════╝
  `);
});

export default app;

