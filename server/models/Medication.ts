import mongoose from 'mongoose';

const medicationSchema = new mongoose.Schema({
  userId: { type: String, required: true, index: true },
  name: { type: String, required: true },
  dose: { type: String, required: true },
  schedule: { type: String },
  time: { type: String, required: true },
  status: { 
    type: String, 
    enum: ['Pending', 'Taken', 'Upcoming', 'Missed'], 
    default: 'Pending' 
  },
  type: { type: String },
  days: [{ type: Number }], // [0, 1, 2, 3, 4, 5, 6]
  referenceImageUrl: { type: String }, // Cloudinary URL
  publicId: { type: String }, // Cloudinary Public ID for deletion
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

export const Medication = mongoose.model('Medication', medicationSchema);
