import React, { useContext, useEffect } from 'react'
import { AdminContext } from '../../context/AdminContext'
import { useNavigate } from 'react-router-dom'

const doctorsList = () => {

  const {doctors , aToken, getAllDoctors, changeAvailability, deleteDoctor} = useContext(AdminContext)
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
      <div className="w-full grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6 gap-y-6 min-w-0">
        {
          doctors.map((item,index)=>(
            <div
              className="border border-blue-200 rounded-xl overflow-hidden cursor-pointer hover:shadow-lg transition-all duration-300 bg-white"
              key={index}
            >
              <div className="relative w-full h-72 bg-blue-50 overflow-hidden">
                <img 
                  className="w-full h-full object-cover object-center hover:scale-105 transition-transform duration-300" 
                  src={item.image} 
                  alt={`${item.name} profile`}
                  onError={(e) => {
                    e.target.src = 'https://via.placeholder.com/256x208?text=Doctor'
                  }}
                />
              </div>
              <div className="p-4">
                <div className={`flex items-center gap-2 text-sm ${item.available ? 'text-green-500' : 'text-gray-500'} mb-3`}>
                  <p className={`w-2 h-2 ${item.available ? 'bg-green-500' : 'bg-gray-500'} rounded-full`}></p>
                  <p>{item.available ? 'Available' : 'Not Available'}</p>
                </div>
                <p className="text-gray-900 text-lg font-medium mb-1">{item.name}</p>
                <p className="text-gray-600 text-sm">{item.speciality}</p>
                <div className='mt-4 flex gap-2'>
                  <button
                    className='px-4 py-2 text-sm rounded bg-primary text-white hover:bg-primary/90 transition-colors'
                    onClick={(e) => {
                      e.stopPropagation()
                      handleDoctorClick(item._id)
                    }}
                  >
                    View
                  </button>
                  <button
                    className='px-4 py-2 text-sm rounded bg-red-600 text-white hover:bg-red-700 transition-colors'
                    onClick={async (e) => {
                      e.stopPropagation()
                      if (confirm('Are you sure you want to remove this doctor? This will also remove their appointments.')) {
                        await deleteDoctor(item._id)
                      }
                    }}
                  >
                    Delete
                  </button>
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
