import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import fs from 'fs';
import path from 'path';
import { GoogleGenAI } from "@google/genai";
import { User } from './models/User.js';
import { Medication } from './models/Medication.js';
import { Connection } from './models/Connection.js';
import { OAuth2Client } from 'google-auth-library';
import jwt from 'jsonwebtoken';

dotenv.config();

// Ensure uploads directory exists
const UPLOADS_DIR = path.resolve(process.cwd(), 'server', 'uploads');
if (!fs.existsSync(UPLOADS_DIR)) {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);
const JWT_SECRET = process.env.JWT_SECRET || 'medmom-secure-fallback';

const app = express();
const port = Number(process.env.PORT) || 5000;

mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/medmom')
  .then(() => console.log('Connected to MongoDB'))
  .catch(err => console.error('MongoDB connection error:', err));

// Serve uploaded reference images as static files
app.use('/uploads', express.static(UPLOADS_DIR));

app.use(cors());
app.use(express.json({ limit: '50mb' }));

// --- HELPERS ---
const generateUniquePairingCode = async (): Promise<string> => {
  while (true) {
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const existing = await User.findOne({ pairingCode: code });
    if (!existing) return code;
  }
};

// --- MIDDLEWARE ---
const authenticate = (req: any, res: any, next: any) => {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  const token = authHeader.split(' ')[1];
  try {
    req.user = jwt.verify(token, JWT_SECRET);
    next();
  } catch {
    return res.status(401).json({ error: 'Invalid token' });
  }
};

// --- AUTH ---
// Always upserts user, always ensures pairingCode, always returns full user object
app.post('/api/auth/google', async (req, res) => {
  const { credential } = req.body;
  try {
    const ticket = await client.verifyIdToken({
      idToken: credential,
      audience: process.env.GOOGLE_CLIENT_ID,
    });
    const payload = ticket.getPayload();
    if (!payload) throw new Error('Invalid token payload');

    const { sub: uid, email, name: displayName, picture } = payload;
    const normalizedEmail = email?.toLowerCase() || '';

    // Find or create user
    let user = await User.findOne({ uid });

    if (!user) {
      // Brand new user - create with unique pairing code
      const pairingCode = await generateUniquePairingCode();
      user = await User.create({
        uid,
        displayName,
        email: normalizedEmail,
        picture,
        pairingCode
      });
      console.log(`[AUTH] New user created: ${displayName}, pairingCode: ${pairingCode}`);
    } else {
      // Existing user - update picture, ensure they have a pairing code
      user.displayName = displayName;
      user.picture = picture;
      if (!user.pairingCode) {
        user.pairingCode = await generateUniquePairingCode();
        console.log(`[AUTH] Generated pairingCode for existing user: ${displayName}, code: ${user.pairingCode}`);
      }
      await user.save();
    }

    const token = jwt.sign({ uid, email: normalizedEmail }, JWT_SECRET, { expiresIn: '30d' });
    // Return full user object - Mongoose toJSON transform adds id field
    const userObj = user.toJSON();
    console.log(`[AUTH] Login success for ${displayName}, pairingCode: ${userObj.pairingCode}`);
    res.json({ success: true, user: userObj, token });
  } catch (err: any) {
    console.error('[AUTH] Error:', err.message);
    res.status(401).json({ error: 'Authentication failed: ' + err.message });
  }
});

// --- USERS ---
app.get('/api/users/me', authenticate, async (req: any, res) => {
  try {
    const user = await User.findOne({ uid: req.user.uid });
    if (!user) {
      return res.status(404).json({ error: 'User not found. Please log out and log in again.' });
    }
    if (!user.pairingCode) {
      user.pairingCode = await generateUniquePairingCode();
      await user.save();
    }
    res.json(user.toJSON());
  } catch (err: any) {
    console.error('[/api/users/me] Error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

app.patch('/api/users/profile', authenticate, async (req: any, res) => {
  try {
    const user = await User.findOneAndUpdate(
      { uid: req.user.uid },
      { $set: req.body },
      { returnDocument: 'after' }
    );
    res.json(user?.toJSON());
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// --- MEDICATIONS ---
app.get('/api/medications/:userId', authenticate, async (req: any, res) => {
  const { userId } = req.params;
  try {
    const meds = await Medication.find({ userId }).sort({ time: 1 });
    res.json(meds);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/medications/:userId', authenticate, async (req: any, res) => {
  const { userId } = req.params;
  if (req.user.uid !== userId) return res.status(403).json({ error: 'Forbidden' });
  const medData = req.body;
  
  // Save reference image LOCALLY instead of Cloudinary
  let savedImagePath: string | undefined;
  if (medData.referenceImageUrl?.startsWith('data:image')) {
    try {
      const matches = medData.referenceImageUrl.match(/^data:image\/(\w+);base64,(.+)$/);
      if (matches) {
        const ext = matches[1] === 'jpeg' ? 'jpg' : matches[1];
        const base64Data = matches[2];
        const filename = `${userId}_${Date.now()}.${ext}`;
        const filepath = path.join(UPLOADS_DIR, filename);
        fs.writeFileSync(filepath, Buffer.from(base64Data, 'base64'));
        savedImagePath = `/uploads/${filename}`;
        console.log('[/api/medications] Image saved locally:', savedImagePath);
      }
    } catch (imgErr: any) {
      console.error('[/api/medications] Image save FAILED:', imgErr.message);
    }
  }

  try {
    const { referenceImageUrl, ...rest } = medData;
    const med = await Medication.create({ ...rest, userId, referenceImageUrl: savedImagePath || undefined });
    console.log('[/api/medications] Saved medication:', med.name, '| hasImage:', !!savedImagePath);
    res.json(med);
  } catch (err: any) {
    console.error('[/api/medications] DB Error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/medications/:userId/:medId', authenticate, async (req: any, res) => {
  const { userId, medId } = req.params;
  try {
    const med = await Medication.findOneAndUpdate(
      { _id: medId, userId },
      { status: req.body.status },
      { returnDocument: 'after' }
    );
    res.json(med);
  } catch (err: any) {
    console.error('[/api/medications] PUT Error:', err);
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/medications/:userId/:medId', authenticate, async (req: any, res) => {
  const { userId, medId } = req.params;
  try {
    await Medication.findOneAndDelete({ _id: medId, userId });
    res.json({ success: true });
  } catch (err: any) {
    console.error('[/api/medications] DELETE Error:', err);
    res.status(500).json({ error: err.message });
  }
});

// --- CONNECTIONS ---
app.get('/api/connections/:userId', authenticate, async (req, res) => {
  const { userId } = req.params;
  try {
    const connections = await Connection.find({
      $or: [{ uidA: userId }, { uidB: userId }]
    });

    // Enrich each connection with the OTHER user's profile + their medication stats
    const enriched = await Promise.all(connections.map(async (conn) => {
      const otherUid = conn.uidA === userId ? conn.uidB : conn.uidA;
      const otherUser = await User.findOne({ uid: otherUid });
      const otherMeds = await Medication.find({ userId: otherUid });

      const takenToday = otherMeds.filter(m => m.status === 'Taken').length;
      const totalToday = otherMeds.length;
      const adherence = totalToday > 0 ? Math.round((takenToday / totalToday) * 100) : null;
      const nextDue = otherMeds
        .filter(m => m.status === 'Pending')
        .sort((a, b) => a.time.localeCompare(b.time))[0];

      return {
        connectionId: conn._id,
        status: conn.status,
        member: {
          uid: otherUid,
          displayName: otherUser?.displayName || 'Unknown',
          picture: otherUser?.picture || null,
          email: otherUser?.email || '',
        },
        stats: {
          takenToday,
          totalToday,
          adherencePct: adherence,
          nextDue: nextDue ? { name: nextDue.name, time: nextDue.time, dose: nextDue.dose } : null,
          allDone: totalToday > 0 && takenToday === totalToday,
          noMeds: totalToday === 0,
        },
        healthReports: otherUser?.healthReports || []
      };
    }));

    res.json(enriched);
  } catch (err: any) {
    console.error('[/api/connections] Error:', err);
    res.status(500).json({ error: err.message });
  }
});

// IMPORTANT: /pair must come BEFORE /:userId to avoid route conflict
app.post('/api/connections/pair', authenticate, async (req: any, res) => {
  const { pairingCode } = req.body;
  const myUid = req.user.uid;
  try {
    if (!pairingCode || pairingCode.length !== 6) {
      return res.status(400).json({ error: 'Invalid pairing code format' });
    }
    const targetUser = await User.findOne({ pairingCode: pairingCode.toString() });
    if (!targetUser) return res.status(404).json({ error: 'No user found with that code. Double-check and try again.' });
    if (targetUser.uid === myUid) return res.status(400).json({ error: 'You cannot pair with yourself.' });

    // Check if connection already exists
    const existing = await Connection.findOne({
      $or: [
        { uidA: myUid, uidB: targetUser.uid },
        { uidA: targetUser.uid, uidB: myUid }
      ]
    });
    if (existing) {
      return res.json({ success: true, connection: existing, targetUser: targetUser.toJSON(), alreadyConnected: true });
    }

    const connection = await Connection.create({
      uidA: myUid,
      uidB: targetUser.uid,
      typeB: 'Family',
      status: 'accepted'
    });
    res.json({ success: true, connection, targetUser: targetUser.toJSON() });
  } catch (err: any) {
    console.error('[/api/connections/pair] Error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// --- CALLING SYSTEM ---
app.post('/api/calls/:targetUid/start', authenticate, async (req: any, res) => {
  try {
    const caller = await User.findOne({ uid: req.user.uid });
    await User.findOneAndUpdate(
      { uid: req.params.targetUid },
      { activeCall: { callerId: req.user.uid, callerName: caller?.displayName || 'Family Member', status: 'ringing' } }
    );
    res.json({ success: true });
  } catch (err: any) { res.status(500).json({ error: err.message }); }
});

app.post('/api/calls/answer', authenticate, async (req: any, res) => {
  try {
    await User.findOneAndUpdate(
      { uid: req.user.uid },
      { 'activeCall.status': 'connected' }
    );
    res.json({ success: true });
  } catch (err: any) { res.status(500).json({ error: err.message }); }
});

app.post('/api/calls/end', authenticate, async (req: any, res) => {
  try {
    await User.findOneAndUpdate({ uid: req.user.uid }, { activeCall: null });
    await User.updateMany({ 'activeCall.callerId': req.user.uid }, { activeCall: null });
    res.json({ success: true });
  } catch (err: any) { res.status(500).json({ error: err.message }); }
});

app.get('/api/calls/status/:targetUid', authenticate, async (req: any, res) => {
  try {
    const target = await User.findOne({ uid: req.params.targetUid });
    res.json({ status: target?.activeCall?.status || null });
  } catch (err: any) { res.status(500).json({ error: err.message }); }
});

// --- REMINDERS & NOTIFICATIONS ---
app.post('/api/remind/:targetUid', authenticate, async (req: any, res) => {
  try {
    const sender = await User.findOne({ uid: req.user.uid });
    const { message } = req.body;
    
    await User.findOneAndUpdate(
      { uid: req.params.targetUid },
      { 
        $push: { 
          notifications: {
            id: Math.random().toString(36).substr(2, 9),
            fromName: sender?.displayName || 'Family Member',
            message: message || 'Please check your medication schedule.',
            type: 'reminder',
            createdAt: new Date()
          }
        }
      }
    );
    res.json({ success: true });
  } catch (err: any) { res.status(500).json({ error: err.message }); }
});

app.post('/api/notifications/clear', authenticate, async (req: any, res) => {
  try {
    await User.findOneAndUpdate(
      { uid: req.user.uid },
      { $set: { notifications: [] } }
    );
    res.json({ success: true });
  } catch (err: any) { res.status(500).json({ error: err.message }); }
});

// --- HEALTH REPORTS ---
app.post('/api/health-reports/analyze', authenticate, async (req: any, res) => {
  const { imageBase64, title } = req.body;
  if (!imageBase64) return res.status(400).json({ error: 'No image provided' });

  try {
    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || '' });
    
    const prompt = "Analyze this medical blood report image. Explain the key findings in simple, easy-to-understand language for a non-medical person. Highlight if any values are critically high/low and provide clear advice on whether they need to take immediate action, consult a doctor soon, or if everything looks normal. Keep the tone empathetic and helpful. Structure your response with a summary, key findings, and recommended action.";

    const response = await ai.models.generateContent({
      model: "gemini-1.5-flash-latest",
      contents: [
        {
          role: "user",
          parts: [
            { text: prompt },
            {
              inlineData: {
                data: imageBase64.split(',')[1],
                mimeType: "image/jpeg"
              }
            }
          ]
        }
      ]
    });

    const analysis = response.text || "Analysis could not be generated.";

    let severity = 'normal';
    const lowerAnalysis = analysis.toLowerCase();
    if (lowerAnalysis.includes('urgent') || lowerAnalysis.includes('immediate') || lowerAnalysis.includes('emergency')) {
      severity = 'urgent';
    } else if (lowerAnalysis.includes('consult') || lowerAnalysis.includes('doctor') || lowerAnalysis.includes('abnormal') || lowerAnalysis.includes('attention')) {
      severity = 'action_needed';
    }

    const newReport = {
      id: Math.random().toString(36).substr(2, 9),
      title: title || 'Blood Report Analysis',
      analysis,
      severity,
      createdAt: new Date()
    };

    await User.findOneAndUpdate(
      { uid: req.user.uid },
      { $push: { healthReports: newReport } }
    );

    res.json({ success: true, report: newReport });
  } catch (err: any) {
    console.error('Report Analysis Error:', err);
    res.status(500).json({ error: 'Failed to analyze report: ' + err.message });
  }
});

// --- PHOTO VERIFICATION ---
// Accepts any uploaded image as verified (no AI call needed)
app.post('/api/verify-pill', authenticate, async (req, res) => {
  const { imageBase64 } = req.body;
  if (!imageBase64) return res.status(400).json({ error: 'No image provided' });

  console.log('[/api/verify-pill] Image received — auto-verified.');
  res.json({ verified: true });
});

if (process.env.NODE_ENV !== 'production' || !process.env.VERCEL) {
  app.listen(port, '0.0.0.0', () => {
    console.log(`Backend running on http://0.0.0.0:${port}`);
  });
}

export default app;
