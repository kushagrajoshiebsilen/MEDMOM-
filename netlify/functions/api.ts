import express from 'express';
import cors from 'cors';
import mongoose from 'mongoose';
import serverless from 'serverless-http';
import { GoogleGenAI } from "@google/genai";
import { User } from '../../server/models/User';
import { Medication } from '../../server/models/Medication';
import { Connection } from '../../server/models/Connection';
import { OAuth2Client } from 'google-auth-library';
import jwt from 'jsonwebtoken';

const app = express();
const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID || '');
const JWT_SECRET = process.env.JWT_SECRET || 'medmom-secure-fallback';

// --- DATABASE CONNECTION HELPER ---
let isConnected = false;
const connectDB = async () => {
  if (isConnected && mongoose.connection.readyState === 1) return;
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/medmom');
    isConnected = true;
    console.log('Connected to MongoDB');
  } catch (err) {
    console.error('MongoDB connection error:', err);
  }
};

app.use(cors());
app.use(express.json({ limit: '10mb' }));

// Middleware to ensure DB connection
app.use(async (req, res, next) => {
  await connectDB();
  next();
});

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

const router = express.Router();

router.get('/health', (req, res) => res.json({ status: 'ok', environment: 'netlify' }));

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
      user = await User.findOneAndUpdate({ uid: req.user.uid }, { $set: { pairingCode } }, { new: true });
    }
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json(user.toJSON());
  } catch (err: any) { res.status(500).json({ error: err.message }); }
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
      return {
        connectionId: conn._id, status: conn.status,
        member: { uid: otherUid, displayName: otherUser?.displayName || 'Unknown', picture: otherUser?.picture, email: otherUser?.email },
        stats: {
          takenToday, totalToday, adherencePct: totalToday > 0 ? Math.round((takenToday / totalToday) * 100) : null,
          nextDue: null, allDone: totalToday > 0 && takenToday === totalToday, noMeds: totalToday === 0,
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

router.post('/health-reports/analyze', authenticate, async (req: any, res) => {
  const { imageBase64, title } = req.body;
  if (!imageBase64) return res.status(400).json({ error: 'No image' });
  try {
    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || '' });
    const result = await ai.models.generateContent({
      model: "gemini-1.5-flash",
      contents: ["Analyze this medical report. Explain key findings simply.", { inlineData: { data: imageBase64.split(',')[1], mimeType: "image/jpeg" } }]
    });
    const newReport = { id: Date.now().toString(), title: title || 'Blood Report', analysis: result.text, severity: 'normal', createdAt: new Date() };
    await User.findOneAndUpdate({ uid: req.user.uid }, { $push: { healthReports: newReport } });
    res.json({ success: true, report: newReport });
  } catch (err: any) { res.status(500).json({ error: err.message }); }
});

app.use('/.netlify/functions/api', router);

export const handler = serverless(app);
