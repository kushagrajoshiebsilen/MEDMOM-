// v2
import express from 'express';
import cors from 'cors';
import mongoose, { Schema } from 'mongoose';
import { GoogleGenAI } from '@google/genai';
import { OAuth2Client } from 'google-auth-library';
import jwt from 'jsonwebtoken';

// ---- MODELS (inlined to avoid ESM/CJS path issues) ----

const UserSchema = new Schema({
  uid: { type: String, required: true, unique: true },
  displayName: { type: String },
  picture: { type: String },
  email: { type: String, required: true, unique: true, lowercase: true },
  pairingCode: { type: String, unique: true },
  role: { type: String, enum: ['standard', 'parent', 'child'], default: 'standard' },
  connectedMembers: [{ type: String }],
  settings: {
    alertPreference: { type: String, default: 'loud' },
    collegeMode: { type: Boolean, default: false },
    vibrationEnabled: { type: Boolean, default: true }
  },
  activeCall: {
    callerId: { type: String, default: null },
    callerName: { type: String, default: null },
    status: { type: String, enum: ['ringing', 'connected', 'ended', null], default: null }
  },
  notifications: [{
    id: { type: String, required: true },
    fromName: { type: String, required: true },
    message: { type: String, required: true },
    type: { type: String, default: 'reminder' },
    createdAt: { type: Date, default: Date.now }
  }],
  healthReports: [{
    id: { type: String, required: true },
    title: { type: String, required: true },
    analysis: { type: String, required: true },
    severity: { type: String, enum: ['normal', 'action_needed', 'urgent'], default: 'normal' },
    imageUrl: { type: String },
    createdAt: { type: Date, default: Date.now }
  }]
}, {
  timestamps: true,
  toJSON: {
    transform: (_doc: any, ret: any) => {
      ret.id = ret._id; delete ret._id; delete ret.__v;
    }
  }
});

const MedicationSchema = new Schema({
  userId: { type: String, required: true },
  name: { type: String, required: true },
  dose: { type: String, required: true },
  schedule: { type: String },
  time: { type: String, required: true },
  status: { type: String, enum: ['Pending', 'Taken', 'Upcoming', 'Missed'], default: 'Pending' },
  type: { type: String },
  days: [{ type: Number }],
  referenceImageUrl: { type: String },
  publicId: { type: String },
}, {
  timestamps: true,
  toJSON: {
    transform: (_doc: any, ret: any) => {
      ret.id = ret._id; delete ret._id; delete ret.__v;
    }
  }
});

const ConnectionSchema = new Schema({
  uidA: { type: String, required: true },
  uidB: { type: String, required: true },
  typeA: { type: String, default: 'Son' },
  typeB: { type: String, default: 'Mom' },
  status: { type: String, enum: ['pending', 'accepted'], default: 'accepted' }
}, { timestamps: true });
ConnectionSchema.index({ uidA: 1, uidB: 1 }, { unique: true });

const User = mongoose.models.User || mongoose.model('User', UserSchema);
const Medication = mongoose.models.Medication || mongoose.model('Medication', MedicationSchema);
const Connection = mongoose.models.Connection || mongoose.model('Connection', ConnectionSchema);

// ---- DB CONNECTION ----
let isConnected = false;
async function connectDB() {
  if (isConnected && mongoose.connection.readyState === 1) return;
  await mongoose.connect(process.env.MONGODB_URI!);
  isConnected = true;
}

// ---- AUTH ----
const oauthClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID || '');
const JWT_SECRET = process.env.JWT_SECRET || 'medmom-secure-fallback';

const authenticate = (req: any, res: any, next: any) => {
  const auth = req.headers.authorization;
  if (!auth?.startsWith('Bearer ')) return res.status(401).json({ error: 'No token provided' });
  try {
    req.user = jwt.verify(auth.split(' ')[1], JWT_SECRET);
    next();
  } catch {
    res.status(401).json({ error: 'Invalid token' });
  }
};

const genCode = async (): Promise<string> => {
  while (true) {
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    if (!await User.findOne({ pairingCode: code })) return code;
  }
};

// ---- APP ----
const app = express();
app.use(cors());
app.use(express.json({ limit: '50mb' }));

const r = express.Router();

r.post('/auth/google', async (req, res) => {
  try {
    await connectDB();
    const ticket = await oauthClient.verifyIdToken({ idToken: req.body.credential, audience: process.env.GOOGLE_CLIENT_ID });
    const p = ticket.getPayload();
    if (!p) throw new Error('Invalid payload');
    const { sub: uid, email, name: displayName, picture } = p;
    const normalizedEmail = email?.toLowerCase() || '';
    let user: any = await User.findOne({ uid });
    if (!user) {
      user = await User.create({ uid, displayName, email: normalizedEmail, picture, pairingCode: await genCode() });
    } else {
      user.displayName = displayName; user.picture = picture;
      if (!user.pairingCode) user.pairingCode = await genCode();
      await user.save();
    }
    const token = jwt.sign({ uid, email: normalizedEmail }, JWT_SECRET, { expiresIn: '30d' });
    res.json({ success: true, user: user.toJSON(), token });
  } catch (e: any) { res.status(401).json({ error: 'Auth failed: ' + e.message }); }
});

r.get('/users/me', authenticate, async (req: any, res) => {
  try {
    await connectDB();
    const user = await User.findOne({ uid: req.user.uid });
    if (!user) return res.status(404).json({ error: 'Not found' });
    res.json(user.toJSON());
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

r.patch('/users/profile', authenticate, async (req: any, res) => {
  try {
    await connectDB();
    const user = await User.findOneAndUpdate({ uid: req.user.uid }, { $set: req.body }, { returnDocument: 'after' });
    res.json(user?.toJSON());
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

r.get('/medications/:userId', authenticate, async (req: any, res) => {
  try {
    await connectDB();
    res.json(await Medication.find({ userId: req.params.userId }).sort({ time: 1 }));
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

r.post('/medications/:userId', authenticate, async (req: any, res) => {
  if (req.user.uid !== req.params.userId) return res.status(403).json({ error: 'Forbidden' });
  try {
    await connectDB();
    const { referenceImageUrl, ...rest } = req.body;
    res.json(await Medication.create({ ...rest, userId: req.params.userId }));
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

r.put('/medications/:userId/:medId', authenticate, async (req: any, res) => {
  try {
    await connectDB();
    res.json(await Medication.findOneAndUpdate({ _id: req.params.medId, userId: req.params.userId }, { status: req.body.status }, { returnDocument: 'after' }));
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

r.delete('/medications/:userId/:medId', authenticate, async (req: any, res) => {
  try {
    await connectDB();
    await Medication.findOneAndDelete({ _id: req.params.medId, userId: req.params.userId });
    res.json({ success: true });
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

r.get('/connections/:userId', authenticate, async (req, res) => {
  try {
    await connectDB();
    const { userId } = req.params;
    const conns = await Connection.find({ $or: [{ uidA: userId }, { uidB: userId }] });
    const enriched = await Promise.all(conns.map(async (conn: any) => {
      const otherUid = conn.uidA === userId ? conn.uidB : conn.uidA;
      const [otherUser, otherMeds] = await Promise.all([User.findOne({ uid: otherUid }), Medication.find({ userId: otherUid })]);
      const taken = otherMeds.filter((m: any) => m.status === 'Taken').length;
      const total = otherMeds.length;
      const nextDue = otherMeds.filter((m: any) => m.status === 'Pending').sort((a: any, b: any) => a.time.localeCompare(b.time))[0];
      return {
        connectionId: conn._id, status: conn.status,
        member: { uid: otherUid, displayName: (otherUser as any)?.displayName || 'Unknown', picture: (otherUser as any)?.picture || null, email: (otherUser as any)?.email || '' },
        stats: { takenToday: taken, totalToday: total, adherencePct: total > 0 ? Math.round((taken / total) * 100) : null, nextDue: nextDue ? { name: (nextDue as any).name, time: (nextDue as any).time, dose: (nextDue as any).dose } : null, allDone: total > 0 && taken === total, noMeds: total === 0 },
        healthReports: (otherUser as any)?.healthReports || []
      };
    }));
    res.json(enriched);
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

r.post('/connections/pair', authenticate, async (req: any, res) => {
  try {
    await connectDB();
    const { pairingCode } = req.body;
    if (!pairingCode || pairingCode.length !== 6) return res.status(400).json({ error: 'Invalid code' });
    const target: any = await User.findOne({ pairingCode: pairingCode.toString() });
    if (!target) return res.status(404).json({ error: 'No user found with that code.' });
    if (target.uid === req.user.uid) return res.status(400).json({ error: 'Cannot pair with yourself.' });
    const existing = await Connection.findOne({ $or: [{ uidA: req.user.uid, uidB: target.uid }, { uidA: target.uid, uidB: req.user.uid }] });
    if (existing) return res.json({ success: true, connection: existing, targetUser: target.toJSON(), alreadyConnected: true });
    const conn = await Connection.create({ uidA: req.user.uid, uidB: target.uid, typeB: 'Family', status: 'accepted' });
    res.json({ success: true, connection: conn, targetUser: target.toJSON() });
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

r.post('/calls/:targetUid/start', authenticate, async (req: any, res) => {
  try {
    await connectDB();
    const caller: any = await User.findOne({ uid: req.user.uid });
    await User.findOneAndUpdate({ uid: req.params.targetUid }, { activeCall: { callerId: req.user.uid, callerName: caller?.displayName || 'Family Member', status: 'ringing' } });
    res.json({ success: true });
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

r.post('/calls/answer', authenticate, async (req: any, res) => {
  try { await connectDB(); await User.findOneAndUpdate({ uid: req.user.uid }, { 'activeCall.status': 'connected' }); res.json({ success: true }); }
  catch (e: any) { res.status(500).json({ error: e.message }); }
});

r.post('/calls/end', authenticate, async (req: any, res) => {
  try {
    await connectDB();
    await User.findOneAndUpdate({ uid: req.user.uid }, { activeCall: null });
    await User.updateMany({ 'activeCall.callerId': req.user.uid }, { activeCall: null });
    res.json({ success: true });
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

r.get('/calls/status/:targetUid', authenticate, async (req: any, res) => {
  try { await connectDB(); const t: any = await User.findOne({ uid: req.params.targetUid }); res.json({ status: t?.activeCall?.status || null }); }
  catch (e: any) { res.status(500).json({ error: e.message }); }
});

r.post('/remind/:targetUid', authenticate, async (req: any, res) => {
  try {
    await connectDB();
    const sender: any = await User.findOne({ uid: req.user.uid });
    await User.findOneAndUpdate({ uid: req.params.targetUid }, { $push: { notifications: { id: Math.random().toString(36).substr(2, 9), fromName: sender?.displayName || 'Family Member', message: req.body.message || 'Please check your medication schedule.', type: 'reminder', createdAt: new Date() } } });
    res.json({ success: true });
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

r.post('/notifications/clear', authenticate, async (req: any, res) => {
  try { await connectDB(); await User.findOneAndUpdate({ uid: req.user.uid }, { $set: { notifications: [] } }); res.json({ success: true }); }
  catch (e: any) { res.status(500).json({ error: e.message }); }
});

r.post('/health-reports/analyze', authenticate, async (req: any, res) => {
  const { imageBase64, title } = req.body;
  if (!imageBase64) return res.status(400).json({ error: 'No image provided' });
  try {
    await connectDB();
    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || '' });
    const response = await ai.models.generateContent({ model: 'gemini-1.5-flash-latest', contents: [{ role: 'user', parts: [{ text: 'Analyze this medical blood report image. Explain key findings in simple language with a summary, key findings, and recommended action.' }, { inlineData: { data: imageBase64.split(',')[1], mimeType: 'image/jpeg' } }] }] });
    const analysis = response.text || 'Analysis could not be generated.';
    const lower = analysis.toLowerCase();
    const severity = lower.includes('urgent') || lower.includes('immediate') ? 'urgent' : lower.includes('consult') || lower.includes('doctor') ? 'action_needed' : 'normal';
    const report = { id: Math.random().toString(36).substr(2, 9), title: title || 'Blood Report', analysis, severity, createdAt: new Date() };
    await User.findOneAndUpdate({ uid: req.user.uid }, { $push: { healthReports: report } });
    res.json({ success: true, report });
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

r.post('/verify-pill', authenticate, (_req, res) => res.json({ verified: true }));

app.use('/api', r);

export default app;
