import React, { useState } from 'react'
import { Route, Routes } from 'react-router-dom'
import Home from './pages/Home'
import Navbar from './components/Navbar'
import Footer from './components/Footer'
import Doctors from './pages/Doctors'
import Login from './pages/Login'
import DoctorLogin from './pages/DoctorLogin'
import DoctorDashboard from './pages/DoctorDashboard'
import About from './pages/About'
import Contact from './pages/Contact'
import MyProfile from './pages/MyProfile'
import MyAppointment from './pages/MyAppointment'
import Appointments from './pages/Appointments'
import { ToastContainer, toast } from 'react-toastify'
import TopDoctors from './components/TopDoctors.jsx'

const App = () => {
  const [count, setCount] = useState(0)

  return (
    <>
      <div className='mx-4 sm:mx-[10%] scroll-smooth'>
        <ToastContainer />
        <Navbar />

        <Routes>
          <Route path='/' element={<Home />} />
          <Route path='/topdoctors' element={<TopDoctors />} />
          <Route path='/doctors' element={<Doctors />} />
          <Route path='/doctors/:speciality' element={<Doctors />} />
          <Route path='/login' element={<Login />} />
          <Route path='/doctor-login' element={<DoctorLogin />} />
          <Route path='/doctor-dashboard' element={<DoctorDashboard />} />
          <Route path='/about' element={<About />} />
          <Route path='/contact' element={<Contact />} />
          <Route path='/my-profile' element={<MyProfile />} />
          <Route path='/my-appointment' element={<MyAppointment />} />
          <Route path='/appointments/:docId' element={<Appointments />} />
        </Routes>
        <Footer />
      </div>
    </>
  )
}

export default App
