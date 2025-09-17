import React, { useState, useContext, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'react-toastify';
import { AppContext } from '../context/AppContext';

const DoctorLogin = () => {
  const { backendUrl, setDToken } = useContext(AppContext);
  const navigate = useNavigate();
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Check if doctor is already logged in
  useEffect(() => {
    const dToken = localStorage.getItem('dToken');
    if (dToken) {
      navigate('/doctor-dashboard');
    }
  }, [navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!email.trim() || !password.trim()) {
      toast.error('Please fill in all fields');
      return;
    }

    setIsLoading(true);
    
    try {
      console.log('Attempting doctor login with:', { email: email.trim(), password: password.trim() });
      console.log('Backend URL:', backendUrl);
      
      const { data } = await axios.post(`${backendUrl}/api/doctor/login`, {
        email: email.trim(),
        password: password.trim()
      });

      console.log('Login response:', data);

      if (data.success) {
        localStorage.setItem('dToken', data.token);
        setDToken(data.token);
        toast.success('Login successful!');
        navigate('/doctor-dashboard');
      } else {
        toast.error(data.message || 'Login failed');
      }
    } catch (error) {
      console.error('Login error:', error);
      console.error('Error response:', error.response);
      toast.error(error.response?.data?.message || 'Login failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full bg-white rounded-lg shadow-md p-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold">
            <span className="text-primary">Doctor</span>
            <span className="text-gray-700"> Login</span>
          </h1>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
              Email
            </label>
            <div className="relative">
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent transition-colors"
                placeholder="Enter your email"
                required
              />
              <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                <div className="w-5 h-5 bg-primary rounded-full flex items-center justify-center">
                  <span className="text-white text-xs font-bold">T</span>
                </div>
              </div>
            </div>
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
              Password
            </label>
            <div className="relative">
              <input
                id="password"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent transition-colors"
                placeholder="Enter your password"
                required
              />
              <button type="button" onClick={()=>setShowPassword(prev=>!prev)} className="absolute right-2 top-1/2 -translate-y-1/2 p-1 rounded hover:bg-gray-200">
                {showPassword ? '👁️‍🗨️' : '👁️'}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-primary text-white py-3 px-4 rounded-lg font-medium hover:bg-primary/90 focus:ring-2 focus:ring-primary focus:ring-offset-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? 'Logging in...' : 'Login'}
          </button>
        </form>

        <div className="mt-6 text-center">
          <p className="text-gray-600">
            Admin Login?{' '}
            <button
              onClick={() => navigate('/admin-login')}
              className="text-primary underline hover:text-primary/80 transition-colors"
            >
              Click here
            </button>
          </p>
        </div>

        <div className="mt-4 text-center">
          <p className="text-gray-600">
            Patient Login?{' '}
            <button
              onClick={() => navigate('/login')}
              className="text-primary underline hover:text-primary/80 transition-colors"
            >
              Click here
            </button>
          </p>
        </div>
      </div>
    </div>
  );
};

export default DoctorLogin;
