import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import financeImg from '../assets/finance.jpeg';

export default function RegisterPage() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [otp, setOtp] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

 const handleSendOtp = async () => {
  if (!email) return setMessage('Please enter your email.');

  try {
    setLoading(true);

    // 🔍 First check if email is already registered
    const check = await axios.post('https://expense-1myv.onrender.com/api/auth/check-email', { email });
    if (check.data.exists) {
      setMessage('This email is already registered. Please log in.');
      setLoading(false);
      return;
    }

    // ✅ If not registered, send OTP
    const res = await axios.post('https://expense-1myv.onrender.com/api/auth/send-otp', { email });

    if (res.data.success) {
      setOtpSent(true);
      setMessage('OTP sent to your email.');
    } else {
      setMessage('Failed to send OTP.');
    }
  } catch (error) {
    console.error(error);
    setMessage('Error checking email or sending OTP.');
  } finally {
    setLoading(false);
  }
};

  const handleRegister = async () => {
    if (!name || !email || !password || !otp) {
      return setMessage('All fields including OTP are required.');
    }

    try {
      setLoading(true);
      const res = await axios.post('https://expense-1myv.onrender.com/api/auth/register-with-otp', {
        name,
        email,
        password,
        otp,
      });

      if (res.data.success) {
        setMessage('Registration successful! You can now log in.');
        setName('');
        setEmail('');
        setPassword('');
        setOtp('');
        setOtpSent(false);
      } else {
        setMessage(res.data.message || 'Registration failed.');
      }
    } catch (error) {
      console.error(error);
      setMessage(error.response?.data?.message || 'Error during registration.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-gradient-to-br from-white to-indigo-100 dark:from-gray-900 dark:to-gray-900">
      {/* Header */}
      <header className="w-full flex justify-between items-center px-6 py-4 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 shadow-md">
        <h1 className="text-xl font-bold text-indigo-600 dark:text-indigo-300">FinTrack</h1>
      </header>

      <div className="flex flex-1 w-full">
        {/* Left Form */}
        <div className="w-full md:w-2/3 flex flex-col justify-center bg-transparent px-8 sm:px-16 md:px-24">
          <div className="bg-white dark:bg-gray-800 p-8 rounded-xl shadow-lg w-full">
            <h2 className="text-3xl font-bold text-indigo-600 dark:text-indigo-300 mb-6 text-center">
              Create Account
            </h2>

            <div className="space-y-5">
              <input
                type="text"
                placeholder="Full Name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
              />

              <input
                type="email"
                placeholder="Email Address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
              />

              <button
                onClick={handleSendOtp}
                disabled={loading}
                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-3 rounded-lg font-semibold"
              >
                {loading ? 'Sending OTP...' : 'Send OTP'}
              </button>

              {otpSent && (
                <>
                  <input
                    type="text"
                    placeholder="Enter OTP"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value)}
                    className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                  />

                  <input
                    type="password"
                    placeholder="Create Password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                  />

                  <button
                    onClick={handleRegister}
                    disabled={loading}
                    className="w-full bg-green-600 hover:bg-green-700 text-white py-3 rounded-lg font-semibold"
                  >
                    {loading ? 'Registering...' : 'Register'}
                  </button>
                </>
              )}

              {message && (
                <p className="text-red-500 text-sm text-center mt-2">{message}</p>
              )}

              <p className="text-center text-sm text-gray-600 dark:text-gray-400 mt-2">
                Already have an account?{' '}
                <Link to="/login" className="text-indigo-600 hover:underline">
                  Login
                </Link>
              </p>
            </div>
          </div>
        </div>

        {/* Right Info Panel */}
        <div className="hidden md:flex flex-col justify-center items-center w-1/3 bg-transparent p-10 space-y-4">
          <div className="bg-white/30 dark:bg-white/10 backdrop-blur-lg p-4 rounded-2xl shadow-lg">
            <img
              src={financeImg}
              alt="FinTrack"
              className="w-44 h-auto rounded-xl shadow-xl transform transition-transform duration-300 hover:scale-105 hover:rotate-1"
            />
          </div>
          <h3 className="text-xl font-bold text-indigo-700 dark:text-white">Join FinTrack Today</h3>
          <ul className="list-disc list-inside text-[16px] text-gray-700 dark:text-gray-300 space-y-2 font-semibold">
            <li>Track expenses & savings</li>
            <li>Simple, secure onboarding</li>
            <li>Smart budget planning</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
