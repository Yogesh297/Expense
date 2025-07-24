import express from 'express';
import nodemailer from 'nodemailer';
import bcrypt from 'bcryptjs';
import User from '../models/User.js';
import Otp from '../models/Otp.js';
import { register, login } from '../controllers/authController.js';
import dotenv from 'dotenv';

dotenv.config();

const router = express.Router();

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER, // your Gmail
    pass: process.env.EMAIL_PASS, // your App Password
  },
});


router.post('/check-email', async (req, res) => {
  const { email } = req.body;
  try {
    const user = await User.findOne({ email });
    if (user) {
      return res.json({ exists: true });
    } else {
      return res.json({ exists: false });
    }
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Server error while checking email.' });
  }
});
// POST /api/auth/send-otp - generate OTP and save to DB, then email it
router.post('/send-otp', async (req, res) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ success: false, message: 'Email is required' });

  const otp = Math.floor(100000 + Math.random() * 900000).toString();

  try {
    // Save or update OTP entry in DB with timestamp
    await Otp.findOneAndUpdate(
      { email },
      { otp, createdAt: new Date() },
      { upsert: true, new: true }
    );

    // Send OTP email
    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: email,
      subject: 'Your OTP Code',
      text: `Your OTP code is ${otp}`,
    });

    return res.json({ success: true });
  } catch (error) {
    console.error('Error sending OTP:', error);
    return res.status(500).json({ success: false, message: 'Failed to send OTP' });
  }
});

// POST /api/auth/register-with-otp - verify OTP, then register user
router.post('/register-with-otp', async (req, res) => {
  try {
    const { name, email, password, otp } = req.body;

    if (!name || !email || !password || !otp) {
      return res.status(400).json({ success: false, message: 'All fields are required' });
    }

    // Check if user exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ success: false, message: 'User already exists' });
    }

    // Validate OTP from DB and check expiry (10 minutes)
    const otpEntry = await Otp.findOne({ email });
    if (!otpEntry) {
      return res.status(400).json({ success: false, message: 'OTP not found or expired' });
    }

    const now = new Date();
    const otpAgeMinutes = (now - otpEntry.createdAt) / 1000 / 60;
    if (otpEntry.otp !== otp) {
      return res.status(400).json({ success: false, message: 'Incorrect OTP' });
    } else if (otpAgeMinutes > 10) {
      return res.status(400).json({ success: false, message: 'OTP expired' });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Save user with passwordHash
    const user = new User({ name, email, passwordHash: hashedPassword });
    await user.save();

    // Delete OTP after successful registration
    await Otp.deleteOne({ email });

    return res.status(201).json({ success: true, message: 'User registered successfully' });
  } catch (error) {
    console.error('Error during registration:', error);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
});
router.post('/register', register);
router.post('/login', login);

export default router;