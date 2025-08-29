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

  // Function to fetch profiles for password reset
  const handleResetPassword = async () => {
    if (!phone || phone.length !== 10) {
      toast.error('Please enter a valid 10-digit mobile number')
      return
    }

    try {
      setIsResetting(true)
      // First, try to get profiles by phone number
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

  // Function to reset password for selected profile
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
    <form onSubmit={onSubmitHandler} className="min-h-[80vh] flex items-center justify-center bg-gradient-to-b from-white to-zinc-50">
      <div className="flex flex-col gap-4 m-auto items-stretch p-8 min-w-[340px] sm:min-w-96 max-w-md w-full bg-white/90 backdrop-blur border border-zinc-200 rounded-2xl text-zinc-700 text-sm shadow-xl">
        {/* Toggle */}
        <div className="grid grid-cols-2 p-1 rounded-full bg-zinc-100 text-zinc-600">
          <button
            type="button"
            onClick={() => setState('Sign Up')}
            className={`${state === 'Sign Up' ? 'bg-white text-zinc-900 shadow-sm' : ''} rounded-full py-2 text-sm font-medium transition-colors`}
          >
            Sign Up
          </button>
          <button
            type="button"
            onClick={() => setState('Login')}
            className={`${state === 'Login' ? 'bg-white text-zinc-900 shadow-sm' : ''} rounded-full py-2 text-sm font-medium transition-colors`}
          >
            Login
          </button>
        </div>

        <p className="text-2xl font-semibold text-zinc-900">
          {state === 'Sign Up' ? 'Create Account' : 'Welcome Back'}
        </p>
        <p className="text-sm sm:text-base text-zinc-500">Please {state === 'Sign Up' ? 'sign up' : 'log in'} to book appointment</p>
        {state === 'Sign Up' && (
          <div className="w-full">
            <p className="text-sm sm:text-base font-medium">Full Name</p>
            <input
              className="border border-zinc-300 rounded-lg w-full px-3 py-2 mt-1 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary/60 transition-shadow"
              type="text"
              placeholder="Enter your name"
              onChange={(e) => setName(e.target.value)}
              value={name}
              required
            />
          </div>
        )}
        <div className="w-full">
          <p className="text-sm sm:text-base font-medium">{state === 'Sign Up' ? 'Mobile Number' : 'Mobile Number'}</p>
          <input
            className="border border-zinc-300 rounded-lg w-full px-3 py-2 mt-1 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary/60 transition-shadow"
            type="tel"
            placeholder={state === 'Sign Up' ? 'Enter your mobile number' : 'Enter your mobile number'}
            onChange={(e) => setPhone(e.target.value.replace(/[^0-9]/g, '').slice(0, 10))}
            value={phone}
            pattern="^[0-9]{10}$"
            maxLength="10"
            required
          />
          <p className="text-xs text-zinc-500 mt-1">Enter 10-digit mobile number</p>
        </div>
        
        <div className="w-full">
          <p className="text-sm sm:text-base font-medium">Password</p>
          <div className="relative">
            <input
              className="border border-zinc-300 rounded-lg w-full px-3 py-2 mt-1 pr-10 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary/60 transition-shadow"
              type={showPass ? 'text' : 'password'}
              placeholder="Enter your password"
              onChange={(e) => setPassword(e.target.value)}
              value={password}
              required
            />
            <button type="button" onClick={()=>setShowPass(prev=>!prev)} className="absolute right-2 top-1/2 -translate-y-1/2 p-1 hover:bg-gray-100 rounded">
              {showPass ? <img src={assets.eyecross} alt="Hide" className="w-5 h-5" /> : <img src={assets.eye} alt="Show" className="w-5 h-5" />}
            </button>
          </div>
        </div>
        <button type='submit' className="bg-primary text-white w-full py-2.5 rounded-lg text-base font-medium shadow hover:bg-[#4a5bff] transition-colors duration-300">
          {state === 'Sign Up' ? 'Create Account' : 'Login'}
        </button>
        
        {/* Reset Password Button - Only show on Login state */}
        {state === 'Login' && (
          <button
            type="button"
            onClick={handleResetPassword}
            disabled={isResetting || !phone || phone.length !== 10}
            className="w-full py-2.5 rounded-lg text-base font-medium border border-gray-300 text-gray-700 hover:bg-gray-50 transition-colors duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isResetting ? 'Loading...' : 'Reset Password'}
          </button>
        )}
        {state === 'Sign Up' ? (
          <p className="text-sm sm:text-base text-center">
            Already have an account?{' '}
            <span
              onClick={() => setState('Login')}
              className="text-primary underline cursor-pointer hover:text-[#4a5bff] transition-colors duration-300"
            >
              Login Here
            </span>
          </p>
        ) : (
          <p className="text-sm sm:text-base text-center">
            Create a new account?{' '}
            <span
              onClick={() => setState('Sign Up')}
              className="text-primary underline cursor-pointer hover:text-[#4a5bff] transition-colors duration-300"
            >
              Click here
            </span>
          </p>
        )}
        {/* Profile chooser modal */}
        {showProfileChooser && (
          <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-[90%] max-w-md shadow-xl">
              <h3 className="text-lg font-semibold mb-3">Select your profile</h3>
              <p className="text-sm text-zinc-600 mb-4">Multiple profiles found for +91 {phone}. Choose one to continue.</p>
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
                  }} className="w-full text-left px-4 py-2 rounded border hover:bg-gray-50">
                    {p.name}
                  </button>
                ))}
              </div>
              <div className="mt-4 text-right">
                <button type="button" onClick={() => setShowProfileChooser(false)} className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800">Cancel</button>
              </div>
            </div>
          </div>
        )}
        
        {/* Reset Password Modal */}
        {showResetPassword && (
          <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-[90%] max-w-md shadow-xl max-h-[80vh] overflow-y-auto">
              <h3 className="text-lg font-semibold mb-3">Reset Password</h3>
              <p className="text-sm text-zinc-600 mb-4">Select the profile for which you want to reset the password.</p>
              
              {/* Profile Selection */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">Select Profile:</label>
                <div className="space-y-2 max-h-40 overflow-auto">
                  {resetProfiles.map((profile) => (
                    <button
                      key={profile.id}
                      onClick={() => setSelectedResetProfile(profile)}
                      className={`w-full text-left px-3 py-2 rounded border transition-colors ${
                        selectedResetProfile?.id === profile.id
                          ? 'border-primary bg-primary/10 text-primary'
                          : 'border-gray-300 hover:bg-gray-50'
                      }`}
                    >
                      {profile.name}
                    </button>
                  ))}
                </div>
              </div>

              {/* New Password Input */}
              {selectedResetProfile && (
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">New Password:</label>
                    <div className="relative">
                      <input
                        type={showNewPass ? 'text' : 'password'}
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        placeholder="Enter new password (min 8 characters)"
                        className="w-full border border-gray-300 rounded px-3 py-2 pr-10"
                        minLength="8"
                        required
                      />
                                              <button
                          type="button"
                          onClick={() => setShowNewPass(!showNewPass)}
                          className="absolute right-2 top-1/2 transform -translate-y-1/2 p-1 hover:bg-gray-200 rounded"
                        >
                          {showNewPass ? <img src={assets.eyecross} alt="Hide" className="w-5 h-5" /> : <img src={assets.eye} alt="Show" className="w-5 h-5" />}
                        </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Confirm Password:</label>
                    <div className="relative">
                      <input
                        type={showConfirmPass ? 'text' : 'password'}
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder="Confirm new password"
                        className="w-full border border-gray-300 rounded px-3 py-2 pr-10"
                        minLength="8"
                        required
                      />
                                              <button
                          type="button"
                          onClick={() => setShowConfirmPass(!showConfirmPass)}
                          className="absolute right-2 top-1/2 transform -translate-y-1/2 p-1 hover:bg-gray-200 rounded"
                        >
                          {showConfirmPass ? <img src={assets.eyecross} alt="Hide" className="w-5 h-5" /> : <img src={assets.eye} alt="Show" className="w-5 h-5" />}
                        </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex justify-end gap-2 mt-6">
                <button
                  type="button"
                  onClick={() => {
                    setShowResetPassword(false)
                    setNewPassword('')
                    setConfirmPassword('')
                    setSelectedResetProfile(null)
                    setResetProfiles([])
                  }}
                  className="px-4 py-2 text-sm border border-gray-300 rounded text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handlePasswordReset}
                  disabled={!selectedResetProfile || !newPassword || !confirmPassword || newPassword !== confirmPassword || isResetting}
                  className="px-4 py-2 text-sm bg-primary text-white rounded hover:bg-[#4a5bff] disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isResetting ? 'Resetting...' : 'Reset Password'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </form>
  );
};

export default Login;