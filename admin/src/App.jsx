import React from 'react'
import Login from './pages/Login'
import { ToastContainer, toast } from 'react-toastify';
import { useContext } from 'react';
import { AdminContext } from './context/AdminContext';
import Navbar from './components/Navbar';
import Sidebar from './components/Sidebar';
import { Route, Routes } from 'react-router-dom';
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

const App = () => {

  const {aToken} = useContext(AdminContext)
  const {dToken} = useContext(DoctorContext)
  return aToken || dToken ? (
    <div className='bg-[#F8F9FD] min-h-screen'>
      <ToastContainer/>
      <Navbar/>
      <div className='flex h-[calc(100vh-64px)]'>
        <Sidebar/>
        <div className='flex-1 overflow-auto scroll-smooth'>
          <Routes>
          {/* Admin Route */}
          <Route path='/' element={<></>}/>
          <Route path='/admin-dashboard' element={<Dashboard/>}/>
          <Route path='/all-appointments' element={<AllApointments/>}/>
          <Route path='/add-doctor' element={<AddDoctor/>}/>
          <Route path='/doctor-list' element={<DoctorsList/>}/>
          {/* <Route path='/patients' element={<Patients/>}/> */}
          <Route path='/user-profile/:userId' element={<UserProfile/>}/>
          <Route path='/doctor-profile/:doctorId' element={<AdminDoctorProfile/>}/>
          <Route path='/doctor-profile/:doctorId/schedule' element={<AdminDoctorProfile/>}/>


          {/* Doctor Route */}
          <Route path='/doctor-dashboard' element={<DoctorDashboard/>}/>
          <Route path='/doctor-appointments' element={<DoctorAppointments/>}/>
          <Route path='/doctor-profile' element={<DoctorProfile/>}/>
        </Routes>
        </div>
      </div>
    </div>
  ) : (
    <>
    <Login/>
    <ToastContainer/>
    </>
  )
}

export default App
App
