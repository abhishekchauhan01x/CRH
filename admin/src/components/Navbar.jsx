import React, { useContext } from 'react'
import { assets } from '../assets/assets.js'
import { AdminContext } from '../context/AdminContext'
import { useNavigate, NavLink } from 'react-router-dom'
import { DoctorContext } from '../context/DoctorContext.jsx'

const Navbar = () => {

  const { aToken, setAToken } = useContext(AdminContext)
  const { dToken, setDToken } = useContext(DoctorContext)

  const navigate = useNavigate()

  const logout = () => {
    navigate('/')
    aToken && setAToken('')
    aToken && localStorage.removeItem('aToken')
    dToken && setDToken('')
    dToken && localStorage.removeItem('dToken')
  }

  return (
    <>
      <div className='flex justify-between items-center px-4 sm:px-10 border border-gray-300 bg-white'>
        <NavLink to={aToken ? '/admin-dashboard' : '/doctor-dashboard'}>
          <div className="flex items-center text-sm cursor-pointer">
            <img className='w-36 gap-0' src={assets.crhlogo} alt="CRH Logo" />
            <div className='flex flex-col'>
              <span>Dashboard Panel</span>
            </div>
            <p className='border ml-2 px-2.5 py-0.5 rounded-full border-gray-500 text-gray-600'>{aToken ? 'Admin' : 'Doctor'}</p>
          </div>
        </NavLink>
        <button onClick={logout} className='bg-primary text-white text-sm px-10 py-2 rounded-full cursor-pointer'>Log Out</button>
      </div>
    </>
  )
}

export default Navbar
