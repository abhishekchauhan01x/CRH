import React, { useContext, useEffect, useState } from 'react'
import { assets } from '../assets/assets.js'
import { AdminContext } from '../context/AdminContext'
import { useNavigate, NavLink, useLocation } from 'react-router-dom'
import { DoctorContext } from '../context/DoctorContext.jsx'

const Navbar = () => {
  const { aToken, setAToken } = useContext(AdminContext)
  const { dToken, setDToken } = useContext(DoctorContext)
  const [userType, setUserType] = useState(null)
  const location = useLocation()
  const navigate = useNavigate()

  // Determine user type based on current path and tokens
  useEffect(() => {
    const adminPaths = ['/admin-dashboard', '/all-appointments', '/add-doctor', '/doctor-list', '/patients', '/user-profile', '/doctor-profile/']
    const doctorPaths = ['/doctor-dashboard', '/doctor-appointments', '/doctor-profile']
    
    const currentPath = location.pathname
    const isAdminPath = adminPaths.some(path => currentPath.startsWith(path))
    const isDoctorPath = doctorPaths.some(path => currentPath.startsWith(path))
    
    if (aToken && dToken) {
      // When both tokens are present, choose by path; fall back to per-tab preference
      if (isDoctorPath) {
        setUserType('doctor')
      } else if (isAdminPath) {
        setUserType('admin')
      } else {
        const preferredPanel = sessionStorage.getItem('panel')
        if (preferredPanel === 'doctor') setUserType('doctor')
        else if (preferredPanel === 'admin') setUserType('admin')
        else setUserType(null)
      }
    } else if (aToken && (isAdminPath || !isDoctorPath)) {
      setUserType('admin')
    } else if (dToken && isDoctorPath) {
      setUserType('doctor')
    } else if (aToken && !dToken) {
      setUserType('admin')
    } else if (dToken && !aToken) {
      setUserType('doctor')
    } else {
      setUserType(null)
    }
  }, [aToken, dToken, location.pathname])

  const logout = () => {
    // Clear only the token for the current user type to avoid affecting other tabs
    if (userType === 'admin' && aToken) {
      setAToken('')
      sessionStorage.removeItem('aToken')
    } else if (userType === 'doctor' && dToken) {
      setDToken('')
      sessionStorage.removeItem('dToken')
    }
    // Clear panel preference for this tab
    sessionStorage.removeItem('panel')
    // Then navigate to the root, replacing history to avoid going back into dashboard
    navigate('/', { replace: true })
  }

  const getDashboardPath = () => {
    return userType === 'admin' ? '/admin-dashboard' : '/doctor-dashboard'
  }

  const getUserTypeLabel = () => {
    return userType === 'admin' ? 'Admin' : 'Doctor'
  }

  return (
    <>
      <div className='flex justify-between items-center px-3 sm:px-6 md:px-10 border border-gray-300 bg-white'>
        <NavLink to={getDashboardPath()} className='min-w-0'>
          <div className="flex items-center text-xs sm:text-sm cursor-pointer gap-2 sm:gap-3">
            <img className='w-28 sm:w-36 shrink-0' src={assets.crhlogo} alt="CRH Logo" />
            <div className='flex flex-col truncate'>
              <span className='hidden sm:inline truncate'>Dashboard Panel</span>
            </div>
            <p className='border ml-2 px-2.5 py-0.5 rounded-full border-gray-500 text-gray-600 shrink-0'>{getUserTypeLabel()}</p>
          </div>
        </NavLink>
        <button onClick={logout} className='bg-primary text-white text-xs sm:text-sm px-4 sm:px-8 md:px-10 py-2 rounded-full cursor-pointer'>Log Out</button>
      </div>
    </>
  )
}

export default Navbar
