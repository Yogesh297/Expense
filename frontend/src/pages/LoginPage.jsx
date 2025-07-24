import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import financeImg from '../assets/finance.jpeg';
import { useContext } from 'react';
import { AuthContext } from '../contexts/AuthContext';

export default function LoginPage() {
  const [form, setForm] = useState({ email: '', password: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const { login } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(form.email, form.password);
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed');
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
              Welcome Back!
            </h2>

            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="block mb-1 text-sm font-medium text-gray-700 dark:text-gray-300">Email</label>
                <input
                  type="email"
                  name="email"
                  value={form.email}
                  onChange={handleChange}
                  className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                  placeholder="you@example.com"
                  required
                />
              </div>

              <div>
                <label className="block mb-1 text-sm font-medium text-gray-700 dark:text-gray-300">Password</label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    name="password"
                    value={form.password}
                    onChange={handleChange}
                    className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                    placeholder="••••••••"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute top-2.5 right-3 text-sm text-indigo-500 dark:text-indigo-300"
                  >
                    {showPassword ? 'Hide' : 'Show'}
                  </button>
                </div>
              </div>

              {error && <p className="text-red-500 text-sm text-center">{error}</p>}

              <button
                type="submit"
                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-3 rounded-lg transition font-semibold"
                disabled={loading}
              >
                {loading ? 'Logging in...' : 'Login'}
              </button>

              <p className="text-center text-sm text-gray-600 dark:text-gray-400">
                Don't have an account?{' '}
                <Link to="/register" className="text-indigo-600 hover:underline">
                  Sign Up
                </Link>
              </p>
            </form>
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
          <h3 className="text-xl font-bold text-indigo-700 dark:text-white">Track Your Financial Journey</h3>
          <ul className="list-disc list-inside text-[16px] text-gray-700 dark:text-gray-300 space-y-2 font-semibold">
            <li>Quick & Secure Login</li>
            <li>Access to your expense history</li>
            <li>Track savings & budgets</li>
          </ul>
        </div>
      </div>
    </div>
  );
}