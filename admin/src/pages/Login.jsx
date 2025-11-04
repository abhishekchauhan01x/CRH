import React, { useContext, useState } from 'react'
import { assets } from '../assets/assets'
import { AdminContext } from '../context/AdminContext'
import axios from 'axios'
import { toast } from 'react-toastify'
import { DoctorContext } from '../context/DoctorContext'
import {useNavigate} from 'react-router-dom'


const Login = () => {

    const [state, setState] = useState('Admin')
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [showPassword, setShowPassword] = useState(false)

    const { setAToken, backendUrl } = useContext(AdminContext)
    const { setDToken } = useContext(DoctorContext)
    const navigate = useNavigate()

    const onSubmitHandler = async (event) => {

        event.preventDefault()

        try {

            if (state === 'Admin') {
                const baseUrl = backendUrl?.trim().replace(/\/+$/, '') || 'https://crh-2.onrender.com'
                const { data } = await axios.post(`${baseUrl}/api/admin/login`, { email, password })
                if (data.success) {
                    sessionStorage.setItem('aToken', data.token)
                    setAToken(data.token);
                    navigate('/admin-dashboard')
                    
                } else {
                    toast.error(data.message)
                }

            } else {
                const baseUrl = backendUrl?.trim().replace(/\/+$/, '') || 'https://crh-2.onrender.com'
                const { data } = await axios.post(`${baseUrl}/api/doctor/login`, { email, password })
                if (data.success) {
                    sessionStorage.setItem('dToken', data.token)
                    setDToken(data.token);
                    console.log(data.token);
                    navigate('/doctor-dashboard')
                    
                } else {
                    toast.error(data.message)
                }

            }

        } catch (error) {
            if (error.response && error.response.data && error.response.data.message) {
                toast.error(error.response.data.message);
            } else {
                toast.error("An error occurred. Please try again.");
            }
        }

    }

    return (
        <form onSubmit={onSubmitHandler} className='min-h-[80vh] flex items-center px-4'>
            <div className='flex flex-col gap-3 m-auto items-start p-6 sm:p-8 w-full max-w-sm sm:max-w-md border-0 rounded-xl text-[#5E5E5E] text-sm shadow-lg'>
                <p className='text-2xl font-semibold m-auto'><span className='text-primary'> {state} </span> Login</p>
                <div className='w-full'>
                    <p>Email</p>
                    <input onChange={(e) => setEmail(e.target.value)} value={email} className='border border-[#DADADA] rounded w-full p-2 mt-1 ' type="email" required />
                </div>

                <div className='w-full'>
                    <p>Password</p>
                    <div className='relative'>
                        <input onChange={(e) => setPassword(e.target.value)} value={password} className='border border-[#DADADA] rounded w-full p-2 mt-1 pr-10' type={showPassword ? 'text' : 'password'} required />
                        <button type='button' onClick={()=>setShowPassword(prev=>!prev)} className='absolute right-2 top-[14px] p-1 hover:bg-gray-200 rounded'>
                            {assets.eye && assets.eyecross ? (
                                <img src={showPassword ? assets.eyecross : assets.eye} alt={showPassword ? 'Hide' : 'Show'} className='w-5 h-5'/>
                            ) : (
                                <span className='w-5 h-5 inline-block'>{showPassword ? '👁️‍🗨️' : '👁️'}</span>
                            )}
                        </button>
                    </div>
                </div>
                <button className='bg-primary text-white w-full py-2 rounded-md text-base cursor-pointer'>Login</button>
                {
                    state === 'Admin'
                        ? <p>Doctor Login? <span className='text-primary underline cursor-pointer' onClick={() => setState('Doctor')}>Click here</span></p>
                        : <p>Admin Login? <span className='text-primary underline cursor-pointer' onClick={() => setState('Admin')}> Click here</span></p>
                }
            </div>
        </form>
    )
}


export default Login

