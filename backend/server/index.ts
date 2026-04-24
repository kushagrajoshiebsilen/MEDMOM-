import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import fs from 'fs';
import path from 'path';
import { createServer } from 'http';
import { Server } from 'socket.io';
import { GoogleGenAI } from "@google/genai";
import { User } from './models/User';
import { Medication } from './models/Medication';
import { Connection } from './models/Connection';
import { OAuth2Client } from 'google-auth-library';
import jwt from 'jsonwebtoken';

import { fileURLToPath } from 'url';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Ensure uploads directory exists
const UPLOADS_DIR = path.resolve(__dirname, 'uploads');
if (!process.env.VERCEL && !fs.existsSync(UPLOADS_DIR)) {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID || '');
const JWT_SECRET = process.env.JWT_SECRET || 'medmom-secure-fallback';

// --- DATABASE ---
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/medmom')
  .then(() => console.log('Connected to MongoDB'))
  .catch(err => console.error('MongoDB connection error:', err));

// --- EXPRESS APP ---
const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: { origin: "*", methods: ["GET", "POST"] }
});

app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use('/uploads', express.static(UPLOADS_DIR));

// Serve static frontend in production
const frontendDistPath = path.resolve(__dirname, '..', '..', 'frontend', 'dist');
if (fs.existsSync(frontendDistPath)) {
  app.use(express.static(frontendDistPath));
} else {
  console.warn("Frontend dist not found at:", frontendDistPath);
}

// --- MIDDLEWARE ---
const authenticate = (req: any, res: any, next: any) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) return res.status(401).json({ error: 'No token' });
  try {
    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, JWT_SECRET) as { uid: string };
    req.user = decoded;
    next();
  } catch (err) { res.status(401).json({ error: 'Invalid token' }); }
};

// --- SIGNALING ENGINE (Socket.io) ---
const userSocketMap = new Map<string, string>(); // uid -> socketId

io.on('connection', (socket) => {
  socket.on('identify', (uid: string) => {
    userSocketMap.set(uid, socket.id);
  });

  socket.on('call-user', ({ targetUid, callerName, callerId }) => {
    const targetSocketId = userSocketMap.get(targetUid);
    if (targetSocketId) {
      io.to(targetSocketId).emit('incoming-call', { callerId, callerName });
    }
  });

  socket.on('accept-call', ({ targetUid }) => {
    const targetSocketId = userSocketMap.get(targetUid);
    if (targetSocketId) {
      io.to(targetSocketId).emit('call-accepted');
    }
  });

  socket.on('webrtc-signal', ({ targetUid, signal }) => {
    const targetSocketId = userSocketMap.get(targetUid);
    if (targetSocketId) {
      io.to(targetSocketId).emit('webrtc-signal', { signal, from: socket.id });
    }
  });

  socket.on('end-call', ({ targetUid }) => {
    const targetSocketId = userSocketMap.get(targetUid);
    if (targetSocketId) {
      io.to(targetSocketId).emit('call-ended');
    }
  });

  socket.on('disconnect', () => {
    for (const [uid, sid] of userSocketMap.entries()) {
      if (sid === socket.id) {
        userSocketMap.delete(uid);
        break;
      }
    }
  });
});

// --- REST ROUTES ---
const router = express.Router();

router.get('/health', (req, res) => res.json({ status: 'ok' }));

router.post('/auth/google', async (req, res) => {
  const { credential } = req.body;
  try {
    const ticket = await client.verifyIdToken({ idToken: credential, audience: process.env.GOOGLE_CLIENT_ID });
    const payload = ticket.getPayload();
    if (!payload) throw new Error('Invalid payload');
    const { sub: uid, email, name: displayName, picture } = payload;
    let user = await User.findOne({ uid });
    if (!user) {
      const pairingCode = Math.floor(100000 + Math.random() * 900000).toString();
      user = await User.create({ uid, displayName, email, picture, pairingCode });
    }
    const token = jwt.sign({ uid, email }, JWT_SECRET, { expiresIn: '30d' });
    res.json({ success: true, user: user.toJSON(), token });
  } catch (err: any) { res.status(401).json({ error: err.message }); }
});

router.get('/users/me', authenticate, async (req: any, res) => {
  try {
    let user = await User.findOne({ uid: req.user.uid });
    if (user && !user.pairingCode) {
      const pairingCode = Math.floor(100000 + Math.random() * 900000).toString();
      user = await User.findOneAndUpdate(
        { uid: req.user.uid }, 
        { $set: { pairingCode } }, 
        { new: true, runValidators: false }
      );
    }
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json(user.toJSON());
  } catch (err: any) {
    console.error("ME Error:", err);
    res.status(500).json({ error: err.message });
  }
});

router.get('/medications/:userId', authenticate, async (req, res) => {
  const meds = await Medication.find({ userId: req.params.userId }).sort({ time: 1 });
  res.json(meds);
});

router.post('/medications/:userId', authenticate, async (req: any, res) => {
  const med = await Medication.create({ ...req.body, userId: req.params.userId });
  res.json(med);
});

router.put('/medications/:userId/:medId', authenticate, async (req, res) => {
  const med = await Medication.findOneAndUpdate({ _id: req.params.medId }, { status: req.body.status }, { returnDocument: 'after' });
  res.json(med);
});

router.delete('/medications/:userId/:medId', authenticate, async (req, res) => {
  await Medication.findOneAndDelete({ _id: req.params.medId });
  res.json({ success: true });
});

router.get('/connections/:userId', authenticate, async (req, res) => {
  try {
    const connections = await Connection.find({ $or: [{ uidA: req.params.userId }, { uidB: req.params.userId }] });
    const enriched = await Promise.all(connections.map(async (conn) => {
      const otherUid = conn.uidA === req.params.userId ? conn.uidB : conn.uidA;
      const otherUser = await User.findOne({ uid: otherUid });
      const otherMeds = await Medication.find({ userId: otherUid });
      const takenToday = otherMeds.filter(m => m.status === 'Taken').length;
      const totalToday = otherMeds.length;
      const adherence = totalToday > 0 ? Math.round((takenToday / totalToday) * 100) : null;
      const nextDue = otherMeds
        .filter(m => m.status === 'Pending')
        .sort((a, b) => a.time.localeCompare(b.time))[0];

      return {
        connectionId: conn._id, status: conn.status,
        member: { uid: otherUid, displayName: otherUser?.displayName || 'Unknown', picture: otherUser?.picture, email: otherUser?.email },
        stats: {
          takenToday, totalToday, adherencePct: adherence,
          nextDue: nextDue ? { name: nextDue.name, time: nextDue.time, dose: nextDue.dose } : null,
          allDone: totalToday > 0 && takenToday === totalToday,
          noMeds: totalToday === 0,
        },
        healthReports: otherUser?.healthReports || []
      };
    }));
    res.json(enriched);
  } catch (err: any) { res.status(500).json({ error: err.message }); }
});

router.post('/connections/pair', authenticate, async (req: any, res) => {
  const targetUser = await User.findOne({ pairingCode: req.body.pairingCode });
  if (!targetUser) return res.status(404).json({ error: 'Not found' });
  const conn = await Connection.create({ uidA: req.user.uid, uidB: targetUser.uid, status: 'accepted' });
  res.json({ success: true, connection: conn, targetUser: targetUser.toJSON() });
});

router.post('/remind/:targetUid', authenticate, async (req: any, res) => {
  const sender = await User.findOne({ uid: req.user.uid });
  await User.findOneAndUpdate({ uid: req.params.targetUid }, { 
    $push: { notifications: { id: Date.now().toString(), fromName: sender?.displayName, message: req.body.message, type: 'reminder', createdAt: new Date() } } 
  });
  res.json({ success: true });
});

router.post('/notifications/clear', authenticate, async (req: any, res) => {
  await User.findOneAndUpdate({ uid: req.user.uid }, { $set: { notifications: [] } });
  res.json({ success: true });
});

// --- AI HEALTH ANALYSIS (Gemini) ---
router.post('/health-reports/analyze', authenticate, async (req: any, res) => {
  const { imageBase64, title } = req.body;
  if (!imageBase64) return res.status(400).json({ error: 'No image' });
  try {
    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || '' });
    const prompt = "Analyze this medical report. Explain key findings simply.";
    const result = await ai.models.generateContent({
      model: "gemini-1.5-flash",
      contents: [prompt, { inlineData: { data: imageBase64.split(',')[1], mimeType: "image/jpeg" } }]
    });
    const analysis = result.text;
    const newReport = { id: Date.now().toString(), title: title || 'Blood Report', analysis, severity: 'normal', createdAt: new Date() };
    await User.findOneAndUpdate({ uid: req.user.uid }, { $push: { healthReports: newReport } });
    res.json({ success: true, report: newReport });
  } catch (err: any) { res.status(500).json({ error: err.message }); }
});

router.post('/verify-pill', authenticate, async (req, res) => {
  res.json({ verified: true });
});

app.use('/api', router);

// Catch-all route to serve the React app
if (fs.existsSync(frontendDistPath)) {
  app.get('*', (req, res) => {
    res.sendFile(path.join(frontendDistPath, 'index.html'));
  });
}

const port = Number(process.env.PORT) || 5100;
httpServer.listen(port, '0.0.0.0', () => {
  console.log(`Server fully restored on port ${port}`);
});

export default app;
