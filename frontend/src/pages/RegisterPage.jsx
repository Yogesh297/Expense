import React, { useState, useContext, useRef } from 'react';
import { AuthContext } from '../contexts/AuthContext';
import { Link, useNavigate } from 'react-router-dom';
import financeImg from '../assets/finance.jpeg';

export default function RegisterPage() {
  const navigate = useNavigate();
  const { register } = useContext(AuthContext);

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
  });

  const [showOtp, setShowOtp] = useState(false);
  const [otp, setOtp] = useState('');
  const [serverOtp, setServerOtp] = useState('');
  const [step, setStep] = useState(1); // 1: Enter Info, 2: Enter OTP
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const otpRef = useRef(null);

  const sendOtp = async () => {
    try {
      setLoading(true);
      const res = await fetch('http://localhost:5000/api/auth/send-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: formData.email }),
      });
      const data = await res.json();
      if (data.success) {
        setServerOtp(data.otp);
        setShowOtp(true);
        setStep(2);
        setMessage('OTP sent to your email');
      } else {
        setMessage(data.message);
      }
    } catch (err) {
      console.error(err);
      setMessage('Failed to send OTP');
    } finally {
      setLoading(false);
    }
  };

  const handleOtpSubmit = async (e) => {
    e.preventDefault();
    if (otp === serverOtp) {
      try {
        setLoading(true);
        await register(formData.name, formData.email, formData.password);
        setMessage('Registration successful!');
        navigate('/');
      } catch (err) {
        setMessage('Registration failed');
      } finally {
        setLoading(false);
      }
    } else {
      setMessage('Invalid OTP');
    }
  };

  const handleInputChange = (e) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const togglePassword = () => {
    setShowPassword(prev => !prev);
  };

  return (
    <div className="min-h-screen flex">
      {/* Left Panel */}
      <div className="flex flex-col justify-center items-center w-full md:w-1/2 px-8">
        <h2 className="text-3xl font-bold mb-4">Register to FinTrack</h2>
        <p className="text-gray-600 mb-6">Track your finances smarter</p>

        <form
          onSubmit={step === 1 ? (e) => { e.preventDefault(); sendOtp(); } : handleOtpSubmit}
          className="w-full max-w-md space-y-4"
        >
          {step === 1 && (
            <>
              <input
                type="text"
                name="name"
                placeholder="Name"
                required
                value={formData.name}
                onChange={handleInputChange}
                className="w-full border px-4 py-2 rounded-md focus:outline-none focus:ring"
              />
              <input
                type="email"
                name="email"
                placeholder="Email"
                required
                value={formData.email}
                onChange={handleInputChange}
                className="w-full border px-4 py-2 rounded-md focus:outline-none focus:ring"
              />
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  name="password"
                  placeholder="Password"
                  required
                  value={formData.password}
                  onChange={handleInputChange}
                  className="w-full border px-4 py-2 rounded-md focus:outline-none focus:ring"
                />
                <button
                  type="button"
                  onClick={togglePassword}
                  className="absolute top-2 right-3 text-sm text-gray-500"
                >
                  {showPassword ? 'Hide' : 'Show'}
                </button>
              </div>
            </>
          )}

          {step === 2 && (
            <>
              <input
                type="text"
                placeholder="Enter OTP"
                value={otp}
                ref={otpRef}
                onChange={(e) => setOtp(e.target.value)}
                className="w-full border px-4 py-2 rounded-md focus:outline-none focus:ring"
              />
            </>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 text-white py-2 rounded-md hover:bg-blue-700 transition"
          >
            {loading ? 'Processing...' : step === 1 ? 'Send OTP' : 'Register'}
          </button>

          {message && <p className="text-center text-sm text-red-500">{message}</p>}
        </form>

        <p className="mt-4 text-sm text-gray-600">
          Already have an account?{' '}
          <Link to="/" className="text-blue-600 hover:underline">
            Login
          </Link>
        </p>
      </div>

      {/* Right Panel */}
      <div className="hidden md:block md:w-1/2">
        <img
          src={financeImg}
          alt="Finance Visual"
          className="object-cover w-full h-full"
        />
      </div>
    </div>
  );
}