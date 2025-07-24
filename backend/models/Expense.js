import mongoose from 'mongoose';

const expenseSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  title: { type: String, required: true, trim: true, maxlength: 100 },
  amount: { type: Number, required: true, min: 0 },
  category: {
    type: String,
    enum: ['Food', 'Transportation', 'Entertainment', 'Education', 'Bills', 'Other'],
    default: 'Other',
  },
  date: { type: Date, required: true, default: Date.now },
}, { timestamps: true });

export default mongoose.model('Expense', expenseSchema);