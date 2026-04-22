import mongoose from 'mongoose';

const connectionSchema = new mongoose.Schema({
  uidA: { type: String, required: true },
  uidB: { type: String, required: true },
  typeA: { type: String, default: 'Son' },
  typeB: { type: String, default: 'Mom' },
  status: { type: String, enum: ['pending', 'accepted'], default: 'accepted' }
}, { timestamps: true });

// Ensure unique connections between two users
connectionSchema.index({ uidA: 1, uidB: 1 }, { unique: true });

export const Connection = mongoose.model('Connection', connectionSchema);
