import React, { useContext, useEffect, useState } from 'react'
import { AdminContext } from '../context/AdminContext'
import { NavLink, useLocation } from 'react-router-dom'
import { assets } from '../assets/assets'
import { DoctorContext } from '../context/DoctorContext'

const Sidebar = () => {
    const { aToken } = useContext(AdminContext)
    const { dToken } = useContext(DoctorContext)
    const [userType, setUserType] = useState(null)
    const location = useLocation()

    // Determine user type based on current path and tokens
    useEffect(() => {
        const adminPaths = ['/admin-dashboard', '/all-appointments', '/add-doctor', '/doctor-list', '/patients', '/user-profile', '/doctor-profile/']
        const doctorPaths = ['/doctor-dashboard', '/doctor-appointments', '/doctor-profile']
        
        const currentPath = location.pathname
        const isAdminPath = adminPaths.some(path => currentPath.startsWith(path))
        const isDoctorPath = doctorPaths.some(path => currentPath.startsWith(path))
        
        if (aToken && dToken) {
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

    if (userType === 'admin') {
        return (
            <div className='h-full bg-white border-r border-gray-200 flex flex-col scroll-smooth w-16 md:w-72' >
                <ul className='text-[#515151] mt-5 flex-1 flex flex-col'>
                    <NavLink className={({ isActive }) => `flex items-center gap-3 py-3.5 px-3 md:px-9 md:min-w-72 cursor-pointer ${isActive ? 'bg-[#F2F3FF] border-r-4 border-primary' : ''}`} to={'/admin-dashboard'}>
                        <img src={assets.home_icon} alt="" />
                        <p className='hidden md:block'>Dashboard</p>
                    </NavLink>

                    <NavLink className={({ isActive }) => `flex items-center gap-3 py-3.5 px-3 md:px-9 md:min-w-72 cursor-pointer ${isActive ? 'bg-[#F2F3FF] border-r-4 border-primary' : ''}`} to={'/all-appointments'}>
                        <img src={assets.appointment_icon} alt="" />
                        <p className='hidden md:block'>Appointments</p>
                    </NavLink>

                    <NavLink className={({ isActive }) => `flex items-center gap-3 py-3.5 px-3 md:px-9 md:min-w-72 cursor-pointer ${isActive ? 'bg-[#F2F3FF] border-r-4 border-primary' : ''}`} to={'/add-doctor'}>
                        <img src={assets.add_icon} alt="" />
                        <p className='hidden md:block'>Add Doctor</p>
                    </NavLink>

                    <NavLink className={({ isActive }) => `flex items-center gap-3 py-3.5 px-3 md:px-9 md:min-w-72 cursor-pointer ${isActive ? 'bg-[#F2F3FF] border-r-4 border-primary' : ''}`} to={'/doctor-list'}>
                        <img src={assets.people_icon} alt="" />
                        <p className='hidden md:block'>Doctors List</p>
                    </NavLink>

                    <NavLink className={({ isActive }) => `flex items-center gap-3 py-3.5 px-3 md:px-9 md:min-w-72 cursor-pointer ${isActive ? 'bg-[#F2F3FF] border-r-4 border-primary' : ''}`} to={'/patients'}>
                        <img src={assets.people_icon} alt="" />
                        <p className='hidden md:block'>Patients</p>
                    </NavLink>

                    {/* Spacer to push content to top */}
                    <div className='flex-1'></div>
                </ul>
            </div>
        )
    }

    if (userType === 'doctor') {
        return (
            <div className='h-full bg-white border-r border-gray-200 flex flex-col scroll-smooth' >
                <ul className='text-[#515151] mt-5 flex-1 flex flex-col'>
                    <NavLink className={({ isActive }) => `flex items-center gap-3 py-3.5 px-3 md:px-9 md:min-w-72 cursor-pointer ${isActive ? 'bg-[#F2F3FF] border-r-4 border-primary' : ''}`} to={'/doctor-dashboard'}>
                        <img src={assets.home_icon} alt="" />
                        <p className='hidden md:block'>Dashboard</p>
                    </NavLink>

                    <NavLink className={({ isActive }) => `flex items-center gap-3 py-3.5 px-3 md:px-9 md:min-w-72 cursor-pointer ${isActive ? 'bg-[#F2F3FF] border-r-4 border-primary' : ''}`} to={'/doctor-appointments'}>
                        <img src={assets.appointment_icon} alt="" />
                        <p className='hidden md:block'>Appointments</p>
                    </NavLink>

                    <NavLink className={({ isActive }) => `flex items-center gap-3 py-3.5 px-3 md:px-9 md:min-w-72 cursor-pointer ${isActive ? 'bg-[#F2F3FF] border-r-4 border-primary' : ''}`} to={'/doctor-profile'}>
                        <img src={assets.people_icon} alt="" />
                        <p className='hidden md:block'>Profile</p>
                    </NavLink>

                    {/* Spacer to push content to top */}
                    <div className='flex-1'></div>
                </ul>
            </div>
        )
    }

    return null
}

export default Sidebar


