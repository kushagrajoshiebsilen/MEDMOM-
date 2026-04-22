import mongoose from 'mongoose';

const generateCode = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

const userSchema = new mongoose.Schema({
  uid: { type: String, required: true, unique: true }, // Firebase UID or Google Subject ID
  displayName: { type: String },
  picture: { type: String },
  email: { type: String, required: true, unique: true, lowercase: true, index: true },
  pairingCode: { type: String, unique: true, index: true },
  role: { type: String, enum: ['standard', 'parent', 'child'], default: 'standard' },
  connectedMembers: [{ type: String }], // List of UIDs
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
    transform: (doc: any, ret: any) => {
      ret.id = ret._id;
      delete ret._id;
      delete ret.__v;
    }
  }
});

export const User = mongoose.model('User', userSchema);
