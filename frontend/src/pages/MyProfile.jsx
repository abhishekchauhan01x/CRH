import React, { useContext } from 'react';
import { useState } from 'react';
import { AppContext } from '../context/AppContext';
import axios from 'axios';
import { toast } from 'react-toastify';

const MyProfile = () => {

  const { userData, setUserData, token, backendUrl, loadUserProfileData } = useContext(AppContext)

  const [isEdit, setIsEdit] = useState(false);
  const [image, setImage] = useState(false)

  const updateUserProfileData = async () => {

    try {
      const formData = new FormData()

      formData.append('name',userData.name)
      formData.append('phone',userData.phone)
      formData.append('address',JSON.stringify(userData.address))
      formData.append('gender',userData.gender)
      formData.append('dob',userData.dob)

      image && formData.append('image',image)

      const {data} = await axios.post(backendUrl + '/api/user/update-profile',formData,{headers:{token}})

      if (data.success) {
        toast.success(data.message)
       await loadUserProfileData()
       setIsEdit(false)
      } else {
        toast.error(data.message)
      }
    } catch (error) {
      console.log(error)
      toast.error(error.message)
    }
  }

  return userData && (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-2xl mx-auto px-4">
        {/* Simple Header */}
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-gray-800 mb-2">My Profile</h1>
          <div className="w-16 h-1 bg-blue-500 mx-auto"></div>
        </div>

        {/* Profile Card */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="p-6">
            {/* Profile Picture */}
            <div className="text-center mb-6">
              {isEdit ? (
                <label htmlFor="image" className="cursor-pointer">
                  <div className="relative inline-block">
                    <img 
                      className="w-24 h-24 rounded-full object-cover border-2 border-gray-300" 
                      src={image ? URL.createObjectURL(image) : userData.image} 
                      alt="Profile" 
                    />
                    <div className="absolute bottom-0 right-0 bg-blue-500 text-white rounded-full p-1">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                      </svg>
                    </div>
                  </div>
                  <p className="text-sm text-blue-600 mt-2">Click to change photo</p>
                  <input onChange={(e) => setImage(e.target.files[0])} type="file" id='image' hidden accept="image/*" />
                </label>
              ) : (
                <img
                  className="w-24 h-24 rounded-full object-cover border-2 border-gray-300 mx-auto"
                  src={userData.image}
                  alt={`${userData.name} profile`}
                />
              )}
              
              {/* Name */}
              <div className="mt-4">
                {isEdit ? (
                  <input
                    className="text-xl font-semibold text-center bg-gray-100 border border-gray-300 rounded px-3 py-1 w-full max-w-xs focus:outline-none focus:border-blue-400"
                    type="text"
                    value={userData.name}
                    onChange={(e) => setUserData((prev) => ({ ...prev, name: e.target.value }))}
                    placeholder="Enter your name"
                  />
                ) : (
                  <h2 className="text-xl font-semibold text-gray-800">
                    {userData.name}
                  </h2>
                )}
              </div>
            </div>

            {/* Contact Information */}
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-4 pb-2 border-b border-gray-200">
                Contact Information
              </h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                  {isEdit ? (
                    <input
                      className="w-full bg-gray-100 border border-gray-300 rounded px-3 py-2 focus:outline-none focus:border-blue-400"
                      type="email"
                      value={userData.email || ''}
                      onChange={(e) => setUserData((prev) => ({ ...prev, email: e.target.value }))}
                      placeholder="Enter your email"
                    />
                  ) : (
                    <p className="text-gray-600 py-2 px-3 bg-gray-50 rounded">
                      {userData.email || 'Not provided'}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                  {isEdit ? (
                    <input
                      className="w-full bg-gray-100 border border-gray-300 rounded px-3 py-2 focus:outline-none focus:border-blue-400"
                      type="tel"
                      value={userData.phone}
                      onChange={(e) => setUserData((prev) => ({ ...prev, phone: e.target.value }))}
                      placeholder="Enter your phone number"
                    />
                  ) : (
                    <p className="text-gray-600 py-2 px-3 bg-gray-50 rounded">
                      {userData.phone}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
                  {isEdit ? (
                    <div className="space-y-2">
                      <input
                        className="w-full bg-gray-100 border border-gray-300 rounded px-3 py-2 focus:outline-none focus:border-blue-400"
                        type="text"
                        value={userData.address.line1 || ''}
                        onChange={(e) =>
                          setUserData((prev) => ({
                            ...prev,
                            address: { ...prev.address, line1: e.target.value },
                          }))
                        }
                        placeholder="Address Line 1"
                      />
                      <input
                        className="w-full bg-gray-100 border border-gray-300 rounded px-3 py-2 focus:outline-none focus:border-blue-400"
                        type="text"
                        value={userData.address.line2 || ''}
                        onChange={(e) =>
                          setUserData((prev) => ({
                            ...prev,
                            address: { ...prev.address, line2: e.target.value },
                          }))
                        }
                        placeholder="Address Line 2"
                      />
                    </div>
                  ) : (
                    <div className="text-gray-600 py-2 px-3 bg-gray-50 rounded">
                      {userData.address.line1 && userData.address.line2 ? (
                        <>
                          <p>{userData.address.line1}</p>
                          <p>{userData.address.line2}</p>
                        </>
                      ) : (
                        <p className="text-gray-400">No address provided</p>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Basic Information */}
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-4 pb-2 border-b border-gray-200">
                Basic Information
              </h3>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Gender</label>
                  {isEdit ? (
                    <select
                      className="w-full bg-gray-100 border border-gray-300 rounded px-3 py-2 focus:outline-none focus:border-blue-400"
                      onChange={(e) => setUserData((prev) => ({ ...prev, gender: e.target.value }))}
                      value={userData.gender || ''}
                    >
                      <option value="">Select Gender</option>
                      <option value="Male">Male</option>
                      <option value="Female">Female</option>
                      <option value="Other">Other</option>
                    </select>
                  ) : (
                    <p className="text-gray-600 py-2 px-3 bg-gray-50 rounded">
                      {userData.gender || 'Not selected'}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Birthday</label>
                  {isEdit ? (
                    <input
                      className="w-full bg-gray-100 border border-gray-300 rounded px-3 py-2 focus:outline-none focus:border-blue-400"
                      type="date"
                      value={userData.dob || ''}
                      onChange={(e) => setUserData((prev) => ({ ...prev, dob: e.target.value }))}
                    />
                  ) : (
                    <p className="text-gray-600 py-2 px-3 bg-gray-50 rounded">
                      {userData.dob ? new Date(userData.dob).toLocaleDateString() : 'Not selected'}
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex justify-center gap-3 pt-4 border-t border-gray-200">
              {isEdit ? (
                <>
                  <button
                    className="px-6 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
                    onClick={updateUserProfileData}
                  >
                    Save
                  </button>
                  <button
                    className="px-6 py-2 bg-gray-500 text-white rounded hover:bg-gray-600 transition-colors"
                    onClick={() => setIsEdit(false)}
                  >
                    Cancel
                  </button>
                </>
              ) : (
                <button
                  className="px-6 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
                  onClick={() => setIsEdit(true)}
                >
                  Edit Profile
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MyProfile;