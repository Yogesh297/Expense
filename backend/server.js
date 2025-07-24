import express from 'express';
import cors from 'cors';
import mongoose from 'mongoose';
import { PORT, MONGO_URI } from './config.js';
import authRoutes from './routes/auth.js';
import expenseRoutes from './routes/expenses.js';

const app = express();

app.use(cors());
app.use(express.json());

app.use(cors({ origin: "https://your-frontend-url.vercel.app", credentials: true }));

app.use('/api/auth', authRoutes);
app.use('/api/expenses', expenseRoutes);

mongoose.connect(MONGO_URI).then(() => {
  console.log('MongoDB connected');
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
}).catch(err => {
  console.error('MongoDB connection failed', err);
  process.exit(1);
});