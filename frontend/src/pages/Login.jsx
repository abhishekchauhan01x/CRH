import React, { useContext, useEffect } from 'react';
import { useState } from 'react';
import { AppContext } from '../context/AppContext';
import axios from 'axios';
import { toast } from 'react-toastify';
import { useNavigate } from 'react-router-dom';
import { assets } from '../assets/assets';

const Login = () => {

  const { backendUrl, token, setToken } = useContext(AppContext)
  const navigate = useNavigate()

  const [state, setState] = useState('Sign Up');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [showPass, setShowPass] = useState(false)
  const [showProfileChooser, setShowProfileChooser] = useState(false)
  const [profileChoices, setProfileChoices] = useState([])
  const [showResetPassword, setShowResetPassword] = useState(false)
  const [resetProfiles, setResetProfiles] = useState([])
  const [selectedResetProfile, setSelectedResetProfile] = useState(null)
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showNewPass, setShowNewPass] = useState(false)
  const [showConfirmPass, setShowConfirmPass] = useState(false)
  const [isResetting, setIsResetting] = useState(false)

  const onSubmitHandler = async (event) => {
    event.preventDefault();

    try {
      if (state === 'Sign Up') {
        const { data } = await axios.post(backendUrl + '/api/user/register', { name, password, phone })
        if (data.success) {
          localStorage.setItem('token', data.token)
          setToken(data.token)
        } else {
          toast.error(data.message)
        }

      } else {
        const { data } = await axios.post(backendUrl + '/api/user/login', { password, phone })
        if (data.success) {
          if (data.selectProfile && Array.isArray(data.profiles)) {
            setProfileChoices(data.profiles)
            setShowProfileChooser(true)
          } else if (data.token) {
            localStorage.setItem('token', data.token)
            setToken(data.token)
          } else if (data.message) {
            toast.error(data.message)
          }
        } else {
          toast.error(data.message)
        }
      }
    } catch (error) {
      toast.error(error.message)
    }
  }

  const handleResetPassword = async () => {
    if (!phone || phone.length !== 10) {
      toast.error('Please enter a valid 10-digit mobile number')
      return
    }

    try {
      setIsResetting(true)
      const { data } = await axios.post(backendUrl + '/api/user/get-profiles-by-phone', { phone })

      if (data.success && Array.isArray(data.profiles)) {
        setResetProfiles(data.profiles)
        setShowResetPassword(true)
      } else {
        toast.error('No profiles found for this phone number')
      }
    } catch {
      toast.error('Unable to find profiles for this phone number')
    } finally {
      setIsResetting(false)
    }
  }

  const handlePasswordReset = async () => {
    if (!selectedResetProfile) {
      toast.error('Please select a profile')
      return
    }

    if (!newPassword || newPassword.length < 8) {
      toast.error('Password must be at least 8 characters long')
      return
    }

    if (newPassword !== confirmPassword) {
      toast.error('Passwords do not match')
      return
    }

    try {
      setIsResetting(true)
      const { data } = await axios.post(backendUrl + '/api/user/reset-password', {
        phone,
        profileId: selectedResetProfile.id,
        newPassword
      })

      if (data.success) {
        toast.success('Password reset successfully! Please login with your new password.')
        setShowResetPassword(false)
        setNewPassword('')
        setConfirmPassword('')
        setSelectedResetProfile(null)
        setResetProfiles([])
      } else {
        toast.error(data.message || 'Password reset failed')
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Password reset failed')
    } finally {
      setIsResetting(false)
    }
  }


  useEffect(() => {
    if (token) {
      navigate('/')
    }
  }, [token])


  return (
    <div className="min-h-[80vh] flex items-center justify-center py-10 px-4">
      <form onSubmit={onSubmitHandler} className="w-full max-w-md">
        <div className="relative bg-white rounded-2xl shadow-xl shadow-gray-200/60 border border-gray-100 overflow-hidden">
          {/* Left gradient accent */}
          <div className="absolute top-0 left-0 w-1 h-full bg-gradient-to-b from-sky-400 via-cyan-400 to-sky-500" />

          <div className="p-7 sm:p-8 pl-8 sm:pl-9 space-y-5">
            {/* Toggle */}
            <div className="grid grid-cols-2 p-1 rounded-xl bg-gray-100 text-gray-600">
              <button
                type="button"
                onClick={() => setState('Sign Up')}
                className={`${state === 'Sign Up' ? 'bg-white text-gray-900 shadow-sm' : ''} rounded-lg py-2.5 text-sm font-medium transition-all duration-200 cursor-pointer`}
              >
                Sign Up
              </button>
              <button
                type="button"
                onClick={() => setState('Login')}
                className={`${state === 'Login' ? 'bg-white text-gray-900 shadow-sm' : ''} rounded-lg py-2.5 text-sm font-medium transition-all duration-200 cursor-pointer`}
              >
                Login
              </button>
            </div>

            <div>
              <h2 className="text-2xl font-bold text-gray-900">
                {state === 'Sign Up' ? 'Create Account' : 'Welcome Back'}
              </h2>
              <p className="text-sm text-gray-500 mt-1">
                Please {state === 'Sign Up' ? 'sign up' : 'log in'} to book appointment
              </p>
            </div>

            {state === 'Sign Up' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Full Name</label>
                <div className="relative">
                  <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                    <svg className="w-4.5 h-4.5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
                    </svg>
                  </div>
                  <input
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl pl-10 pr-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-sky-400/30 focus:border-sky-400 transition-all"
                    type="text"
                    placeholder="Enter your name"
                    onChange={(e) => setName(e.target.value)}
                    value={name}
                    required
                  />
                </div>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Mobile Number</label>
              <div className="relative">
                <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                  <svg className="w-4.5 h-4.5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 1.5H8.25A2.25 2.25 0 006 3.75v16.5a2.25 2.25 0 002.25 2.25h7.5A2.25 2.25 0 0018 20.25V3.75a2.25 2.25 0 00-2.25-2.25H13.5m-3 0V3h3V1.5m-3 0h3m-3 18.75h3" />
                  </svg>
                </div>
                <input
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl pl-10 pr-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-sky-400/30 focus:border-sky-400 transition-all"
                  type="tel"
                  placeholder="Enter your mobile number"
                  onChange={(e) => setPhone(e.target.value.replace(/[^0-9]/g, '').slice(0, 10))}
                  value={phone}
                  pattern="^[0-9]{10}$"
                  maxLength="10"
                  required
                />
              </div>
              <p className="text-xs text-gray-400 mt-1.5 ml-1">Enter 10-digit mobile number</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Password</label>
              <div className="relative">
                <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                  <svg className="w-4.5 h-4.5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
                  </svg>
                </div>
                <input
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl pl-10 pr-10 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-sky-400/30 focus:border-sky-400 transition-all"
                  type={showPass ? 'text' : 'password'}
                  placeholder="Enter your password"
                  onChange={(e) => setPassword(e.target.value)}
                  value={password}
                  required
                />
                <button type="button" onClick={() => setShowPass(prev => !prev)} className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer">
                  {showPass ? <img src={assets.eyecross} alt="Hide" className="w-4.5 h-4.5 opacity-50" /> : <img src={assets.eye} alt="Show" className="w-4.5 h-4.5 opacity-50" />}
                </button>
              </div>
            </div>

            <button type='submit' className="w-full py-3 rounded-xl text-sm font-semibold text-white bg-gradient-to-r from-[#3f5261] to-[#2c3e50] hover:from-[#2c3e50] hover:to-[#1a252f] shadow-md hover:shadow-lg transition-all duration-300 cursor-pointer">
              {state === 'Sign Up' ? 'Create Account' : 'Login'}
            </button>

            {state === 'Login' && (
              <button
                type="button"
                onClick={handleResetPassword}
                disabled={isResetting || !phone || phone.length !== 10}
                className="w-full py-2.5 rounded-xl text-sm font-medium border border-gray-200 text-gray-600 hover:bg-gray-50 transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
              >
                {isResetting ? 'Loading...' : 'Reset Password'}
              </button>
            )}

            <p className="text-sm text-center text-gray-500">
              {state === 'Sign Up' ? 'Already have an account? ' : 'Create a new account? '}
              <span
                onClick={() => setState(state === 'Sign Up' ? 'Login' : 'Sign Up')}
                className="text-sky-600 font-medium cursor-pointer hover:text-sky-700 transition-colors"
              >
                {state === 'Sign Up' ? 'Login Here' : 'Click here'}
              </span>
            </p>
          </div>
        </div>
      </form>

      {/* Profile chooser modal */}
      {showProfileChooser && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 w-[90%] max-w-md shadow-2xl">
            <h3 className="text-lg font-bold text-gray-900 mb-1">Select your profile</h3>
            <p className="text-sm text-gray-500 mb-5">Multiple profiles found for +91 {phone}. Choose one to continue.</p>
            <div className="space-y-2 max-h-60 overflow-auto">
              {profileChoices.map((p) => (
                <button key={p.id} onClick={async () => {
                  try {
                    const resp = await axios.post(backendUrl + '/api/user/login', { phone, password, name: p.name })
                    if (resp.data?.success && resp.data?.token) {
                      localStorage.setItem('token', resp.data.token)
                      setToken(resp.data.token)
                      setShowProfileChooser(false)
                    } else if (resp.data?.message) {
                      toast.error(resp.data.message)
                    }
                  } catch (e) { toast.error(e.message) }
                }} className="w-full text-left px-4 py-3 rounded-xl border border-gray-200 hover:bg-sky-50 hover:border-sky-300 transition-all text-sm font-medium cursor-pointer">
                  {p.name}
                </button>
              ))}
            </div>
            <div className="mt-5 text-right">
              <button type="button" onClick={() => setShowProfileChooser(false)} className="px-4 py-2 text-sm text-gray-500 hover:text-gray-700 cursor-pointer">Cancel</button>
            </div>
          </div>
        </div>
      )}

      {/* Reset Password Modal */}
      {showResetPassword && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 w-[90%] max-w-md shadow-2xl max-h-[80vh] overflow-y-auto">
            <h3 className="text-lg font-bold text-gray-900 mb-1">Reset Password</h3>
            <p className="text-sm text-gray-500 mb-5">Select the profile for which you want to reset the password.</p>

            <div className="mb-5">
              <label className="block text-sm font-medium text-gray-700 mb-2">Select Profile:</label>
              <div className="space-y-2 max-h-40 overflow-auto">
                {resetProfiles.map((profile) => (
                  <button
                    key={profile.id}
                    onClick={() => setSelectedResetProfile(profile)}
                    className={`w-full text-left px-4 py-3 rounded-xl border transition-all text-sm font-medium cursor-pointer ${selectedResetProfile?.id === profile.id
                        ? 'border-sky-400 bg-sky-50 text-sky-700'
                        : 'border-gray-200 hover:bg-gray-50'
                      }`}
                  >
                    {profile.name}
                  </button>
                ))}
              </div>
            </div>

            {selectedResetProfile && (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">New Password:</label>
                  <div className="relative">
                    <input
                      type={showNewPass ? 'text' : 'password'}
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="Enter new password (min 8 characters)"
                      className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 pr-10 text-sm focus:outline-none focus:ring-2 focus:ring-sky-400/30 focus:border-sky-400 transition-all"
                      minLength="8"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewPass(!showNewPass)}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 rounded-lg hover:bg-gray-100 cursor-pointer"
                    >
                      {showNewPass ? <img src={assets.eyecross} alt="Hide" className="w-4.5 h-4.5 opacity-50" /> : <img src={assets.eye} alt="Show" className="w-4.5 h-4.5 opacity-50" />}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Confirm Password:</label>
                  <div className="relative">
                    <input
                      type={showConfirmPass ? 'text' : 'password'}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Confirm new password"
                      className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 pr-10 text-sm focus:outline-none focus:ring-2 focus:ring-sky-400/30 focus:border-sky-400 transition-all"
                      minLength="8"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPass(!showConfirmPass)}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 rounded-lg hover:bg-gray-100 cursor-pointer"
                    >
                      {showConfirmPass ? <img src={assets.eyecross} alt="Hide" className="w-4.5 h-4.5 opacity-50" /> : <img src={assets.eye} alt="Show" className="w-4.5 h-4.5 opacity-50" />}
                    </button>
                  </div>
                </div>
              </div>
            )}

            <div className="flex justify-end gap-3 mt-6">
              <button
                type="button"
                onClick={() => {
                  setShowResetPassword(false)
                  setNewPassword('')
                  setConfirmPassword('')
                  setSelectedResetProfile(null)
                  setResetProfiles([])
                }}
                className="px-5 py-2.5 text-sm font-medium border border-gray-200 rounded-xl text-gray-600 hover:bg-gray-50 transition-all cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handlePasswordReset}
                disabled={!selectedResetProfile || !newPassword || !confirmPassword || newPassword !== confirmPassword || isResetting}
                className="px-5 py-2.5 text-sm font-semibold text-white bg-gradient-to-r from-[#3f5261] to-[#2c3e50] rounded-xl hover:from-[#2c3e50] hover:to-[#1a252f] disabled:opacity-40 disabled:cursor-not-allowed transition-all cursor-pointer"
              >
                {isResetting ? 'Resetting...' : 'Reset Password'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Login;