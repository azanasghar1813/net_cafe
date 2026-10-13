import React, { useState } from 'react';
import api from '../api';
import { Lock } from 'lucide-react';

const Login = ({ onLogin }) => {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      const res = await api.post('/auth/login', { password });
      if (res.data.success) {
        onLogin(res.data.token);
      }
    } catch (err) {
      setError("Invalid admin password");
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center items-center p-4">
      <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-200 w-full max-w-md animate-in fade-in zoom-in duration-500">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-blue-100 text-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Lock size={32} />
          </div>
          <h1 className="text-2xl font-bold text-slate-800">Admin Login</h1>
          <p className="text-slate-500 mt-2">Enter your password to access the system</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Password</label>
            <input 
              type="password" 
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all text-center text-lg tracking-widest font-bold"
              placeholder="••••••••"
              autoFocus
            />
          </div>

          {error && <div className="text-rose-500 text-sm text-center font-medium bg-rose-50 p-3 rounded-xl">{error}</div>}

          <button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 text-white p-4 rounded-xl font-bold transition-colors">
            Login
          </button>
        </form>
      </div>
      <p className="text-slate-400 mt-8 text-sm">Internet Cafe Management System</p>
    </div>
  );
};

export default Login;
