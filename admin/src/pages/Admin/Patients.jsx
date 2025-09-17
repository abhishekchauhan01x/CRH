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
            <div className='w-full flex flex-wrap gap-4 pt-5 gap-y-6 items-start'>
                {patients && patients.map((user, index) => (
                    <div
                        key={index}
                        className='border border-indigo-200 rounded-xl w-56 overflow-hidden group hover:shadow-lg transition-all duration-300 flex flex-col'
                    >
                        <div className='bg-indigo-50 group-hover:bg-primary transition-all duration-500 w-full h-40 flex items-center justify-center'>
                            <img className='w-24 h-24 rounded-full object-cover'
                                 src={user.image || 'https://via.placeholder.com/96?text=U'}
                                 alt={user.name || 'User'} />
                        </div>
                        <div className='p-4 flex flex-col gap-2 flex-1'>
                            <p className='text-neutral-800 text-lg font-medium cursor-pointer' onClick={() => handleUserClick(user._id)}>{user.name || 'Unnamed'}</p>
                            <p className='text-zinc-600 text-sm break-all'>{user.email}</p>
                            <div className='mt-auto flex gap-2'>
                                <button
                                    className='px-3 py-1 text-xs rounded bg-primary text-white hover:bg-primary/90'
                                    onClick={() => handleUserClick(user._id)}
                                >
                                    View
                                </button>
                                <button
                                    className='px-3 py-1 text-xs rounded bg-red-600 text-white hover:bg-red-700'
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


