import React, { useContext, useState } from 'react'
import { assets } from '../../assets/assets'
import { AdminContext } from '../../context/AdminContext'
import { toast } from 'react-toastify'
import axios from 'axios'

const AddDoctor = () => {

  const [docImg, setDocImg] = useState(false)
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [experience, setExperience] = useState('1 Year')
  const [isCustomExperience, setIsCustomExperience] = useState(false)
  const [customExperience, setCustomExperience] = useState('')
  const [fees, setFees] = useState('')
  const [about, setAbout] = useState('')
  const [speciality, setSpeciality] = useState('')
  const [isCustomSpeciality, setIsCustomSpeciality] = useState(false)
  const [customSpeciality, setCustomSpeciality] = useState('')
  const [showSpecialityDropdown, setShowSpecialityDropdown] = useState(false)
  const [degree, setDegree] = useState('')
  const [address1, setAddress1] = useState('')
  const [address2, setAddress2] = useState('')

  const { backendUrl, aToken } = useContext(AdminContext)

  const onSubmitHandler = async (event) => {
    event.preventDefault()

    try {

      if (!docImg) {
        return toast.error('Image not Selected')
      }

             // Format name with Dr. prefix
        const cleanName = 'Dr. ' + name.trim()

      const formData = new FormData()

      formData.append('image', docImg)
      formData.append('name', cleanName)
      formData.append('email', email)
      formData.append('password', password)
      formData.append('experience', experience)
      formData.append('fees', Number(fees))
      formData.append('about', about)
      formData.append('speciality', speciality)
      formData.append('degree', degree)
      formData.append('address', JSON.stringify({ line1: address1, line2: address2 }))

      // console log formdata
      formData.forEach((value, key) => {
        console.log(`${key} : ${value}`);
      })
      const { data } = await axios.post(backendUrl + '/api/admin/add-doctor', formData, { headers: { aToken } })

      if (data.success) {
        toast.success(data.message)
        setDocImg(false)
        setName('')
        setPassword('')
        setEmail('')
        setAddress1('')
        setAddress2('')
        setDegree('')
        setAbout('')
        setFees('')
        setExperience('1 Year')
        setSpeciality('')
        setIsCustomSpeciality(false)
        setCustomSpeciality('')

      } else {
        toast.error(data.message)
      }

    } catch (error) {
      toast.error(error.message)
      console.log(error)
    }
  }

  return (
    <form onSubmit={onSubmitHandler} className='m-3 sm:m-5 max-w-6xl mx-auto'>
      <style jsx>{`
        .custom-dropdown {
          -webkit-tap-highlight-color: transparent;
        }
        .custom-dropdown-option {
          -webkit-tap-highlight-color: transparent;
          user-select: none;
        }
      `}</style>
      {/* Header Section */}
      <div className='mb-4 sm:mb-6 text-center sm:text-left'>
        <h1 className='text-xl sm:text-2xl font-bold text-gray-800 mb-2'>Add New Doctor</h1>
        <p className='text-sm sm:text-base text-gray-600'>Fill in the details below to add a new doctor to the system</p>
      </div>

      <div className='bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden'>
        {/* Image Upload Section */}
        <div className='bg-gradient-to-r from-blue-50 to-indigo-50 px-4 sm:px-6 lg:px-8 py-6 sm:py-8 border-b border-gray-100'>
          <div className='flex flex-col sm:flex-row items-center sm:items-start gap-4 sm:gap-6'>
            <label htmlFor="doc-img" className='cursor-pointer group'>
              <div className='relative'>
                <div className='w-20 h-20 sm:w-24 sm:h-24 bg-white rounded-full shadow-md border-4 border-white overflow-hidden group-hover:border-blue-200 transition-all duration-300'>
                  {docImg ? (
                    <img 
                      className='w-full h-full object-cover' 
                      src={URL.createObjectURL(docImg)} 
                      alt="Doctor preview" 
                    />
                  ) : (
                    <div className='w-full h-full flex items-center justify-center bg-gray-100'>
                      <svg className='w-10 h-10 sm:w-12 sm:h-12 text-gray-400' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                        <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z' />
                      </svg>
                    </div>
                  )}
                </div>
                <div className='absolute -bottom-1 -right-1 w-6 h-6 sm:w-8 sm:h-8 bg-blue-500 rounded-full flex items-center justify-center shadow-lg'>
                  <svg className='w-3 h-3 sm:w-4 sm:h-4 text-white' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                    <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M12 6v6m0 0v6m0-6h6m-6 0H6' />
                  </svg>
                </div>
              </div>
            </label>
            <input onChange={(e) => setDocImg(e.target.files[0])} type="file" id='doc-img' hidden accept="image/*" />
            <div className='text-center sm:text-left'>
              <h3 className='text-base sm:text-lg font-semibold text-gray-800 mb-2'>Upload Doctor Photo</h3>
              <p className='text-sm text-gray-600'>Click on the image to upload a professional photo</p>
              <p className='text-xs text-gray-500 mt-1'>Recommended: Square image, 400x400px or larger</p>
            </div>
          </div>
        </div>

        {/* Form Fields Section */}
        <div className='p-4 sm:p-6 lg:p-8'>
          <div className='grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 lg:gap-8'>
            {/* Left Column */}
            <div className='space-y-4 sm:space-y-6'>
              {/* Doctor Name */}
              <div className='space-y-2'>
                <label className='text-sm font-medium text-gray-700 flex items-center gap-2'>
                  <svg className='w-4 h-4 text-blue-500' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                    <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z' />
                  </svg>
                  Doctor Name *
                </label>
                <div className='relative'>
                  <div className='absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 font-medium pointer-events-none'>
                    Dr.
                  </div>
                  <input 
                    onChange={(e) => setName(e.target.value)} 
                    value={name} 
                    className='w-full pl-12 pr-4 py-2.5 sm:py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 placeholder-gray-400' 
                    type="text" 
                    placeholder='Enter doctor name' 
                    required 
                  />
                </div>
                <p className='text-xs text-gray-500'>Name will be displayed as: Dr. {name || '[Enter name]'}</p>
              </div>

              {/* Doctor Email */}
              <div className='space-y-2'>
                <label className='text-sm font-medium text-gray-700 flex items-center gap-2'>
                  <svg className='w-4 h-4 text-blue-500' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                    <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z' />
                  </svg>
                  Email Address *
                </label>
                <input 
                  onChange={(e) => setEmail(e.target.value)} 
                  value={email} 
                  className='w-full px-4 py-2.5 sm:py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 placeholder-gray-400' 
                  type="email" 
                  placeholder='Enter email address' 
                  required 
                />
              </div>

              {/* Doctor Password */}
              <div className='space-y-2'>
                <label className='text-sm font-medium text-gray-700 flex items-center gap-2'>
                  <svg className='w-4 h-4 text-blue-500' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                    <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z' />
                  </svg>
                  Password *
                </label>
                <div className='relative'>
                  <input 
                    onChange={(e) => setPassword(e.target.value)} 
                    value={password} 
                    className='w-full px-4 py-2.5 sm:py-3 pr-12 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 placeholder-gray-400' 
                    type={showPassword ? 'text' : 'password'} 
                    placeholder='Enter password' 
                    required 
                  />
                  <button
                    onClick={(e)=>{ e.preventDefault(); setShowPassword(prev=>!prev) }}
                    className='absolute right-3 top-1/2 transform -translate-y-1/2 p-1 hover:bg-gray-100 rounded-md transition-colors'
                    type='button'
                  >
                    {showPassword ? (
                      <svg className='w-5 h-5 text-gray-500' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                        <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L21 21' />
                      </svg>
                    ) : (
                      <svg className='w-5 h-5 text-gray-500' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                        <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M15 12a3 3 0 11-6 0 3 3 0 016 0z' />
                        <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z' />
                      </svg>
                    )}
                  </button>
                </div>
              </div>

              {/* Experience */}
              <div className='space-y-2'>
                <label className='text-sm font-medium text-gray-700 flex items-center gap-2'>
                  <svg className='w-4 h-4 text-blue-500' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                    <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M12 16h.01' />
                  </svg>
                  Years of Experience *
                </label>
                <div className='relative'>
                  <input
                    onChange={(e) => {
                      const val = e.target.value
                      if (val === '') {
                        setExperience('')
                      } else {
                        const numVal = parseInt(val) || 0
                        if (numVal >= 1) {
                          setExperience(numVal + ' Years')
                        } else {
                          setExperience('')
                        }
                      }
                    }}
                    value={parseInt(experience) || ''}
                    className='w-full px-4 py-2.5 sm:py-3 pr-20 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 placeholder-gray-400'
                    type="number"
                    min="1"
                    placeholder='Enter years of experience'
                    required
                  />
                  <span className='absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-500 font-medium'>Years</span>
                </div>
                <p className='text-xs text-gray-500'>Experience will be displayed as: {experience || '[Enter years]'}</p>
              </div>

              {/* Fees */}
              <div className='space-y-2'>
                <label className='text-sm font-medium text-gray-700 flex items-center gap-2'>
                  <svg className='w-4 h-4 text-blue-500' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                    <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1' />
                  </svg>
                  Consultation Fees (₹) *
                </label>
                <input 
                  onChange={(e) => {
                    const val = e.target.value
                    if (val === '') {
                      setFees('')
                    } else {
                      const numVal = parseInt(val) || 0
                      if (numVal >= 1) {
                        setFees(numVal)
                      } else {
                        setFees('')
                      }
                    }
                  }}
                  value={fees || ''}
                  className='w-full px-4 py-2.5 sm:py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 placeholder-gray-400' 
                  type="number" 
                  min="1"
                  placeholder='Enter consultation fees' 
                  required 
                />
              </div>
            </div>

            {/* Right Column */}
            <div className='space-y-4 sm:space-y-6'>
              {/* Speciality */}
              <div className='space-y-2'>
                <label className='text-sm font-medium text-gray-700 flex items-center gap-2'>
                  <svg className='w-4 h-4 text-blue-500' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                    <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z' />
                  </svg>
                  Medical Speciality *
                </label>
                <div className='relative custom-dropdown'>
                  <button
                    type='button'
                    onClick={() => setShowSpecialityDropdown(prev => !prev)}
                    className='w-full px-4 py-2.5 sm:py-3 pr-12 text-left border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-white text-sm sm:text-base cursor-pointer hover:bg-gray-50'
                  >
                    {speciality || 'Select medical speciality'}
                  </button>
                  <div className='absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none'>
                    <svg className={`w-5 h-5 text-gray-400 transition-transform duration-200 ${showSpecialityDropdown ? 'rotate-180' : ''}`} fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                      <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M19 9l-7 7-7-7' />
                    </svg>
                  </div>
                  
                  {/* Custom Dropdown Options */}
                  {showSpecialityDropdown && (
                    <div className='absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-auto'>
                      <div 
                        className='px-4 py-3 cursor-pointer hover:bg-blue-50 border-b border-gray-100 custom-dropdown-option'
                        onClick={() => {
                          setIsCustomSpeciality(false)
                          setCustomSpeciality('')
                          setSpeciality('ENT')
                          setShowSpecialityDropdown(false)
                        }}
                      >
                        <span className='text-gray-900'>ENT</span>
                      </div>
                      <div 
                        className='px-4 py-3 cursor-pointer hover:bg-blue-50 custom-dropdown-option'
                        onClick={() => {
                          setIsCustomSpeciality(true)
                          setSpeciality('')
                          setShowSpecialityDropdown(false)
                        }}
                      >
                        <span className='text-gray-900'>Custom Speciality</span>
                      </div>
                    </div>
                  )}
                </div>
                
                {isCustomSpeciality && (
                  <input
                    className='w-full px-4 py-2.5 sm:py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 placeholder-gray-400'
                    type='text'
                    placeholder='Enter custom speciality (e.g., Cardiologist, Neurologist)'
                    value={customSpeciality}
                    onChange={(e)=> {
                      const v = e.target.value
                      setCustomSpeciality(v)
                      setSpeciality(v)
                    }}
                    required
                  />
                )}
              </div>

              {/* Education */}
              <div className='space-y-2'>
                <label className='text-sm font-medium text-gray-700 flex items-center gap-2'>
                  <svg className='w-4 h-4 text-blue-500' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                    <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M12 14l9-5-9-5-9 5 9 5z' />
                    <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z' />
                  </svg>
                  Education & Qualifications *
                </label>
                <input 
                  onChange={(e) => setDegree(e.target.value)} 
                  value={degree} 
                  className='w-full px-4 py-2.5 sm:py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 placeholder-gray-400' 
                  type="text" 
                  placeholder='e.g., MBBS, MD, MS, etc.' 
                  required 
                />
              </div>

              {/* Address */}
              <div className='space-y-2'>
                <label className='text-sm font-medium text-gray-700 flex items-center gap-2'>
                  <svg className='w-4 h-4 text-blue-500' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                    <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z' />
                    <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M15 11a3 3 0 11-6 0 3 3 0 016 0z' />
                  </svg>
                  Address *
                </label>
                <input 
                  onChange={(e) => setAddress1(e.target.value)} 
                  value={address1} 
                  className='w-full px-4 py-2.5 sm:py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 placeholder-gray-400' 
                  type="text" 
                  placeholder='Street address, building, etc.' 
                  required 
                />
                <input 
                  onChange={(e) => setAddress2(e.target.value)} 
                  value={address2} 
                  className='w-full px-4 py-2.5 sm:py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 placeholder-gray-400' 
                  type="text" 
                  placeholder='City, state, PIN code' 
                  required 
                />
              </div>
            </div>
          </div>

          {/* About Doctor Section */}
          <div className='mt-6 sm:mt-8 space-y-2'>
            <label className='text-sm font-medium text-gray-700 flex items-center gap-2'>
              <svg className='w-4 h-4 text-blue-500' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z' />
              </svg>
              About Doctor *
            </label>
            <textarea 
              onChange={(e) => setAbout(e.target.value)} 
              value={about} 
              className='w-full px-4 py-2.5 sm:py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 placeholder-gray-400 resize-none' 
              placeholder="Describe the doctor's expertise, achievements, and approach to patient care..." 
              rows={3} 
              required 
            />
          </div>

          {/* Submit Button */}
          <div className='mt-6 sm:mt-8 pt-4 sm:pt-6 border-t border-gray-100'>
            <button 
              type='submit' 
              className='w-full lg:w-auto bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-semibold px-6 sm:px-8 py-3 sm:py-4 rounded-lg shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all duration-200 flex items-center justify-center gap-2'
            >
              <svg className='w-5 h-5' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M12 6v6m0 0v6m0-6h6m-6 0H6' />
              </svg>
              Add Doctor to System
            </button>
          </div>
        </div>
      </div>
    </form>
  )
}

export default AddDoctor