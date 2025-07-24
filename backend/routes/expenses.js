import express from 'express';
import {
  getExpenses,
  addExpense,
  updateExpense,
  deleteExpense,
} from '../controllers/expenseController.js';
import verifyToken from '../middleware/verifyToken.js';

const router = express.Router();

router.use(verifyToken); // ✅ Token is verified once globally

router.get('/', getExpenses);
router.post('/', addExpense);
router.put('/:id', updateExpense);
router.delete('/:id', verifyToken, deleteExpense);

export default router;