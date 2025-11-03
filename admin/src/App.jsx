import React from 'react'
import Login from './pages/Login'
import { ToastContainer, toast } from 'react-toastify';
import { useContext, useEffect, useState } from 'react';
import { AdminContext } from './context/AdminContext';
import Navbar from './components/Navbar';
import Sidebar from './components/Sidebar';
import { Route, Routes, Navigate, useLocation, useNavigate } from 'react-router-dom';
import Dashboard from './pages/Admin/Dashboard';
import AllApointments from './pages/Admin/AllApointments';
import AddDoctor from './pages/Admin/AddDoctor';
import DoctorsList from './pages/Admin/DoctorsList';
// import Patients from './pages/Admin/Patients';
import UserProfile from './pages/Admin/UserProfile';
import AdminDoctorProfile from './pages/Admin/AdminDoctorProfile';

import { DoctorContext } from './context/DoctorContext';
import DoctorDashboard from './pages/Doctor/DoctorDashboard';
import DoctorAppointments from './pages/Doctor/DoctorAppointments';
import DoctorProfile from './pages/Doctor/DoctorProfile';
import Patients from './pages/Admin/Patients';

const App = () => {
  const { aToken } = useContext(AdminContext)
  const { dToken } = useContext(DoctorContext)
  const [isAdmin, setIsAdmin] = useState(false)
  const [isDoctor, setIsDoctor] = useState(false)
  const [isValidating, setIsValidating] = useState(true)
  const location = useLocation()
  const navigate = useNavigate()

  // Handle post-OAuth redirect marker and route to doctor profile
  useEffect(() => {
    const params = new URLSearchParams(location.search)
    const google = params.get('google')
    if (google === 'connected') {
      // Navigate to doctor profile; remove the marker param
      navigate('/doctor-profile', { replace: true })
    }
  }, [location.search, navigate])

  // Production-ready authentication and routing logic
  useEffect(() => {
    const validateTokensAndRoute = async () => {
      setIsValidating(true)
      
      try {
        const currentPath = location.pathname
        
        // Define route patterns
        const adminRoutes = ['/admin-dashboard', '/all-appointments', '/add-doctor', '/doctor-list', '/patients', '/user-profile']
        const doctorRoutes = ['/doctor-dashboard', '/doctor-appointments', '/doctor-profile']
        const adminDoctorProfileRoutes = ['/doctor-profile/'] // Admin viewing doctor profiles
        
        // Check if current path is an admin route
        const isAdminRoute = adminRoutes.some(route => currentPath.startsWith(route))
        const isDoctorRoute = doctorRoutes.some(route => currentPath === route) // Exact match for doctor routes
        const isAdminDoctorProfileRoute = adminDoctorProfileRoutes.some(route => 
          currentPath.startsWith(route) && currentPath !== '/doctor-profile'
        )
        
        // Validate tokens (hybrid approach for better performance)
        let adminValid = false
        let doctorValid = false
        
        // Quick client-side validation first
        if (aToken && aToken.length > 10) {
          adminValid = true
        }
        
        if (dToken && dToken.length > 10) {
          doctorValid = true
        }
        
        // Optional: Validate with backend for production (uncomment if needed)
        /*
        const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3000'
        
        if (aToken) {
          try {
            const adminResponse = await fetch(`${backendUrl}/api/admin/validate-token`, {
              method: 'GET',
              headers: { 'aToken': aToken }
            })
            adminValid = adminResponse.ok
          } catch (error) {
            console.log('Admin token validation failed:', error)
            adminValid = false
          }
        }
        
        if (dToken) {
          try {
            const doctorResponse = await fetch(`${backendUrl}/api/doctor/validate-token`, {
              method: 'GET',
              headers: { 'dToken': dToken }
            })
            doctorValid = doctorResponse.ok
          } catch (error) {
            console.log('Doctor token validation failed:', error)
            doctorValid = false
          }
        }
        */
        
        // Determine which interface to show based on route and valid tokens
        if (isDoctorRoute && doctorValid) {
          // User is on a doctor route with valid doctor token
          setIsDoctor(true)
          setIsAdmin(false)
        } else if ((isAdminRoute || isAdminDoctorProfileRoute) && adminValid) {
          // User is on an admin route with valid admin token
          setIsAdmin(true)
          setIsDoctor(false)
        } else if (doctorValid && !adminValid) {
          // Only doctor token is valid, redirect to doctor dashboard
          setIsDoctor(true)
          setIsAdmin(false)
          if (!isDoctorRoute) {
            navigate('/doctor-dashboard', { replace: true })
          }
        } else if (adminValid && !doctorValid) {
          // Only admin token is valid, redirect to admin dashboard
          setIsAdmin(true)
          setIsDoctor(false)
          if (!isAdminRoute && !isAdminDoctorProfileRoute) {
            navigate('/admin-dashboard', { replace: true })
          }
        } else if (adminValid && doctorValid) {
          // Both tokens are valid - determine by current route
          if (isDoctorRoute) {
            setIsDoctor(true)
            setIsAdmin(false)
          } else if (isAdminRoute || isAdminDoctorProfileRoute) {
            setIsAdmin(true)
            setIsDoctor(false)
          } else {
            // Default to admin if no specific route
            setIsAdmin(true)
            setIsDoctor(false)
            navigate('/admin-dashboard', { replace: true })
          }
        } else {
          // No valid tokens
          setIsAdmin(false)
          setIsDoctor(false)
        }
        
      } catch (error) {
        console.error('Authentication validation error:', error)
        setIsAdmin(false)
        setIsDoctor(false)
      } finally {
        setIsValidating(false)
      }
    }
    
    validateTokensAndRoute()
  }, [aToken, dToken, location.pathname, navigate])



  // Show loading while validating tokens
  if (isValidating) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-gray-600">Validating authentication...</p>
        </div>
      </div>
    )
  }

  // Show doctor interface
  if (isDoctor) {
    return (
      <div className='bg-[#F8F9FD] min-h-screen'>
        <ToastContainer/>
        <Navbar/>
        <div className='flex h-[calc(100vh-64px)]'>
          <Sidebar/>
          <div className='flex-1 overflow-auto scroll-smooth'>
            <Routes>
              <Route path='/' element={<Navigate to='/doctor-dashboard' replace />}/>
              <Route path='/doctor-dashboard' element={<DoctorDashboard/>}/>
              <Route path='/doctor-appointments' element={<DoctorAppointments/>}/>
              <Route path='/doctor-profile' element={<DoctorProfile/>}/>
              {/* Preserve deep links on refresh */}
              <Route path='*' element={<Navigate to='/doctor-dashboard' replace />}/>
            </Routes>
          </div>
        </div>
      </div>
    )
  }

  // Show admin interface
  if (isAdmin) {
    return (
      <div className='bg-[#F8F9FD] min-h-screen'>
        <ToastContainer/>
        <Navbar/>
        <div className='flex h-[calc(100vh-64px)]'>
          <Sidebar/>
          <div className='flex-1 overflow-auto scroll-smooth'>
            <Routes>
              <Route path='/' element={<Navigate to='/admin-dashboard' replace />}/>
              <Route path='/admin-dashboard' element={<Dashboard/>}/>
              <Route path='/all-appointments' element={<AllApointments/>}/>
              <Route path='/add-doctor' element={<AddDoctor/>}/>
              <Route path='/doctor-list' element={<DoctorsList/>}/>
              <Route path='/patients' element={<Patients/>}/>
              <Route path='/user-profile/:userId' element={<UserProfile/>}/>
              <Route path='/doctor-profile/:doctorId' element={<AdminDoctorProfile/>}/>
              <Route path='/doctor-profile/:doctorId/schedule' element={<AdminDoctorProfile/>}/>
              {/* Preserve deep links on refresh */}
              <Route path='*' element={<Navigate to='/admin-dashboard' replace />}/>
            </Routes>
          </div>
        </div>
      </div>
    )
  }



  // Show login if no valid tokens
  return (
    <>
      <Login/>
      <ToastContainer/>
    </>
  )
}

export default App
