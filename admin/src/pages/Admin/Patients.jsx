import React, { useContext, useEffect } from 'react'
import { AdminContext } from '../../context/AdminContext'
import { useNavigate } from 'react-router-dom'

const Patients = () => {

    const { aToken, getAllPatients, patients, deletePatient } = useContext(AdminContext)
    const navigate = useNavigate()

    useEffect(() => {
        if (aToken) {
            getAllPatients()
        }
    }, [aToken])

    const handleUserClick = (userId) => {
        navigate(`/user-profile/${userId}`)
    }

    return (
        <div className='m-5 max-h-[90vh] overflow-y-scroll scroll-smooth'>
            <h1 className='text-lg font-medium'>All Patients</h1>
            <div className='w-full grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 pt-5 gap-y-6'>
                {patients && patients.map((user, index) => (
                    <div
                        key={index}
                        className='border border-indigo-200 rounded-xl overflow-hidden group hover:shadow-lg transition-all duration-300 flex flex-col w-full'
                    >
                        <div className='bg-indigo-50 group-hover:bg-primary transition-all duration-500 w-full h-32 sm:h-40 flex items-center justify-center'>
                            <img className='w-20 h-20 sm:w-24 sm:h-24 rounded-full object-cover'
                                 src={user.image || 'https://via.placeholder.com/96?text=U'}
                                 alt={user.name || 'User'} />
                        </div>
                        <div className='p-3 sm:p-4 flex flex-col gap-1.5 sm:gap-2 flex-1'>
                            <p className='text-neutral-800 text-base sm:text-lg font-medium cursor-pointer line-clamp-1' onClick={() => handleUserClick(user._id)}>{user.name || 'Unnamed'}</p>
                            <p className='text-zinc-600 text-xs sm:text-sm break-all line-clamp-2'>{user.email}</p>
                            <div className='mt-auto flex gap-1.5 sm:gap-2'>
                                <button
                                    className='px-2.5 py-1 sm:px-3 text-xs rounded bg-primary text-white hover:bg-primary/90 flex-1 sm:flex-none'
                                    onClick={() => handleUserClick(user._id)}
                                >
                                    View
                                </button>
                                <button
                                    className='px-2.5 py-1 sm:px-3 text-xs rounded bg-red-600 text-white hover:bg-red-700 flex-1 sm:flex-none'
                                    onClick={async (e) => {
                                        e.stopPropagation()
                                        if (confirm('Are you sure you want to remove this patient? This will also remove their appointments.')) {
                                            await deletePatient(user._id)
                                        }
                                    }}
                                >
                                    Delete
                                </button>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    )
}

export default Patients


