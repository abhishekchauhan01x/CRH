import React, { useContext, useEffect } from 'react'
import { AdminContext } from '../../context/AdminContext'
import { useNavigate } from 'react-router-dom'

const doctorsList = () => {

  const {doctors , aToken, getAllDoctors, changeAvailability} = useContext(AdminContext)
  const navigate = useNavigate()

  useEffect(() => {
    if (aToken) {
      getAllDoctors()
      
    }
  }, [aToken])

  const handleDoctorClick = (doctorId) => {
    navigate(`/doctor-profile/${doctorId}`)
  }
  
  return (
    <div className='m-5 max-h-[90vh] overflow-y-scroll scroll-smooth'>
      <h1 className='text-lg font-medium'>All Doctors</h1>
      <div className='w-full flex flex-wrap gap-4 pt-5 gap-y-6'>
        {
          doctors.map((item,index)=>(
            <div 
              className='border border-indigo-200 rounded-xl max-w-56 overflow-hidden cursor-pointer group hover:shadow-lg transition-all duration-300' 
              key={index}
              onClick={() => handleDoctorClick(item._id)}
            >
              <img className='bg-indigo-50 group-hover:bg-primary transition-all duration-500' src={item.image} alt="" />
              <div className='p-4'>
                <p className='text-neutral-800 text-lg font-medium'>{item.name}</p>
                <p className='text-zinc-600 text-sm'>{item.speciality}</p>
                <div className='mt-2'>
                  <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${item.available ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                    {item.available ? 'Available' : 'Not Available'}
                  </span>
                </div>
              </div>
            </div>
          ))
        }
      </div>
    </div>
  )
}

export default doctorsList
