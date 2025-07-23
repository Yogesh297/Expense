import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true, maxlength: 40 },
  email: { type: String, required: true, lowercase: true, unique: true, trim: true },
  passwordHash: { type: String, required: true },
}, { timestamps: true });

export default mongoose.model('User', userSchema);