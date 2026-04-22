import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();

console.log('Testing DB connection...');
mongoose.connect(process.env.MONGODB_URI!)
  .then(() => {
    console.log('SUCCESS: DB Connected!');
    process.exit(0);
  })
  .catch(err => {
    console.error('FAILURE: DB Error:', err.message);
    process.exit(1);
  });
