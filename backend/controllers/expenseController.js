import Expense from '../models/Expense.js';

export const getExpenses = async (req, res) => {
  try {
    const expenses = await Expense.find({ user: req.user }).sort({ date: -1 });
    res.json(expenses);
  } catch (error) {
    console.error(error);
    res.status(500).json({ msg: 'Error loading expenses' });
  }
};

export const addExpense = async (req, res) => {
  try {
    const { title, amount, category, date } = req.body;
    if (!title || !amount) return res.status(400).json({ msg: 'Title and amount are required' });

    const newExpense = new Expense({
      user: req.user,
      title: title.trim(),
      amount,
      category: category || 'Other',
      date: date ? new Date(date) : Date.now(),
    });

    await newExpense.save();
    res.status(201).json(newExpense);
  } catch (error) {
    console.error(error);
    res.status(500).json({ msg: 'Failed to add expense' });
  }
};

export const updateExpense = async (req, res) => {
  try {
    const expense = await Expense.findById(req.params.id);
    if (!expense) return res.status(404).json({ msg: 'Expense not found' });

    if (expense.user.toString() !== req.user)
      return res.status(401).json({ msg: 'Unauthorized' });

    const { title, amount, category, date } = req.body;
    if (title) expense.title = title.trim();
    if (amount) expense.amount = amount;
    if (category) expense.category = category;
    if (date) expense.date = new Date(date);

    await expense.save();
    res.json(expense);
  } catch (error) {
    console.error(error);
    res.status(500).json({ msg: 'Failed to update expense' });
  }
};

export const deleteExpense = async (req, res) => {
  try {
    const expense = await Expense.findById(req.params.id);
    if (!expense) return res.status(404).json({ msg: 'Expense not found' });

    if (expense.user.toString() !== req.user)
      return res.status(401).json({ msg: 'Unauthorized' });

    await expense.remove();
    res.json({ msg: 'Expense deleted' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ msg: 'Failed to delete expense' });
  }
};