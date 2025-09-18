import React, { useState, Suspense, lazy } from 'react'
import { Route, Routes } from 'react-router-dom'
import Navbar from './components/Navbar'
import Footer from './components/Footer'
import { ToastContainer, toast } from 'react-toastify'
import TopDoctors from './components/TopDoctors.jsx'

// Lazy load pages for better performance
const Home = lazy(() => import('./pages/Home'))
const Doctors = lazy(() => import('./pages/Doctors'))
const Login = lazy(() => import('./pages/Login'))
const DoctorLogin = lazy(() => import('./pages/DoctorLogin'))
const DoctorDashboard = lazy(() => import('./pages/DoctorDashboard'))
const About = lazy(() => import('./pages/About'))
const Contact = lazy(() => import('./pages/Contact'))
const MyProfile = lazy(() => import('./pages/MyProfile'))
const MyAppointment = lazy(() => import('./pages/MyAppointment'))
const Appointments = lazy(() => import('./pages/Appointments'))

// Loading component
const LoadingSpinner = () => (
  <div className="flex justify-center items-center min-h-[400px]">
    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
  </div>
)

const App = () => {
  const [count, setCount] = useState(0)

  return (
    <>
      <div className='mx-4 sm:mx-[10%] scroll-smooth'>
        <ToastContainer />
        <Navbar />

        <Suspense fallback={<LoadingSpinner />}>
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
        </Suspense>
        <Footer />
      </div>
    </>
  )
}

export default App
