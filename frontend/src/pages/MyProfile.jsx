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

      formData.append('name', userData.name)
      formData.append('phone', userData.phone)
      formData.append('address', JSON.stringify(userData.address))
      formData.append('gender', userData.gender)
      formData.append('dob', userData.dob)

      image && formData.append('image', image)

      const { data } = await axios.post(backendUrl + '/api/user/update-profile', formData, { headers: { token } })

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
    <div className="py-8 sm:py-10 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 tracking-tight">My Profile</h1>
          <div className="w-14 h-1 bg-gradient-to-r from-sky-500 to-cyan-400 rounded-full mx-auto mt-3" />
        </div>

        {/* Profile Card */}
        <div className="bg-white rounded-2xl shadow-xl shadow-gray-200/50 border border-gray-100 overflow-hidden">
          <div className="p-6 sm:p-8">
            {/* Profile Picture */}
            <div className="text-center mb-8">
              {isEdit ? (
                <label htmlFor="image" className="cursor-pointer inline-block">
                  <div className="relative inline-block group">
                    <img
                      className="w-24 h-24 sm:w-28 sm:h-28 rounded-full object-cover ring-4 ring-sky-100 transition-all duration-200 group-hover:ring-sky-200"
                      src={image ? URL.createObjectURL(image) : userData.image}
                      alt="Profile"
                    />
                    <div className="absolute bottom-1 right-1 bg-sky-500 text-white rounded-full p-2 shadow-lg group-hover:bg-sky-600 transition-colors">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                      </svg>
                    </div>
                  </div>
                  <p className="text-xs text-sky-600 mt-2 font-medium">Click to change photo</p>
                  <input onChange={(e) => setImage(e.target.files[0])} type="file" id='image' hidden accept="image/*" />
                </label>
              ) : (
                <img
                  className="w-24 h-24 sm:w-28 sm:h-28 rounded-full object-cover ring-4 ring-sky-100 mx-auto"
                  src={userData.image}
                  alt={`${userData.name} profile`}
                />
              )}

              {/* Name */}
              <div className="mt-4">
                {isEdit ? (
                  <input
                    className="text-xl font-bold text-center bg-gray-50 border border-gray-200 rounded-xl px-4 py-2 w-full max-w-xs focus:outline-none focus:ring-2 focus:ring-sky-400/30 focus:border-sky-400 transition-all mx-auto block"
                    type="text"
                    value={userData.name}
                    onChange={(e) => setUserData((prev) => ({ ...prev, name: e.target.value }))}
                    placeholder="Enter your name"
                  />
                ) : (
                  <h2 className="text-xl sm:text-2xl font-bold text-gray-900">{userData.name}</h2>
                )}
              </div>
            </div>

            {/* Contact Information */}
            <div className="mb-8">
              <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-4 flex items-center gap-2">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 9h3.75M15 12h3.75M15 15h3.75M4.5 19.5h15a2.25 2.25 0 002.25-2.25V6.75A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25v10.5A2.25 2.25 0 004.5 19.5zm6-10.125a1.875 1.875 0 11-3.75 0 1.875 1.875 0 013.75 0zm1.294 6.336a6.721 6.721 0 01-3.17.789 6.721 6.721 0 01-3.168-.789 3.376 3.376 0 016.338 0z" />
                </svg>
                Contact Information
              </h3>
              <div className="h-px bg-gradient-to-r from-gray-200 to-transparent mb-5" />

              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1.5">Email</label>
                  {isEdit ? (
                    <input
                      className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-sky-400/30 focus:border-sky-400 transition-all"
                      type="email"
                      value={userData.email || ''}
                      onChange={(e) => setUserData((prev) => ({ ...prev, email: e.target.value }))}
                      placeholder="Enter your email"
                    />
                  ) : (
                    <p className="text-sm text-gray-700 py-2.5 px-4 bg-gray-50 rounded-xl">{userData.email || 'Not provided'}</p>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1.5">Phone</label>
                  {isEdit ? (
                    <input
                      className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-sky-400/30 focus:border-sky-400 transition-all"
                      type="tel"
                      value={userData.phone}
                      onChange={(e) => setUserData((prev) => ({ ...prev, phone: e.target.value }))}
                      placeholder="Enter your phone number"
                    />
                  ) : (
                    <p className="text-sm text-gray-700 py-2.5 px-4 bg-gray-50 rounded-xl">{userData.phone}</p>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1.5">Address</label>
                  {isEdit ? (
                    <div className="space-y-2">
                      <input
                        className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-sky-400/30 focus:border-sky-400 transition-all"
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
                        className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-sky-400/30 focus:border-sky-400 transition-all"
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
                    <div className="text-sm text-gray-700 py-2.5 px-4 bg-gray-50 rounded-xl">
                      {userData.address.line1 && userData.address.line2 ? (
                        <>
                          <p>{userData.address.line1}</p>
                          <p className="text-gray-500">{userData.address.line2}</p>
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
            <div className="mb-8">
              <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-4 flex items-center gap-2">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M11.25 11.25l.041-.02a.75.75 0 011.063.852l-.708 2.836a.75.75 0 001.063.853l.041-.021M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9-3.75h.008v.008H12V8.25z" />
                </svg>
                Basic Information
              </h3>
              <div className="h-px bg-gradient-to-r from-gray-200 to-transparent mb-5" />

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1.5">Gender</label>
                  {isEdit ? (
                    <select
                      className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-sky-400/30 focus:border-sky-400 transition-all cursor-pointer"
                      onChange={(e) => setUserData((prev) => ({ ...prev, gender: e.target.value }))}
                      value={userData.gender || ''}
                    >
                      <option value="">Select Gender</option>
                      <option value="Male">Male</option>
                      <option value="Female">Female</option>
                      <option value="Other">Other</option>
                    </select>
                  ) : (
                    <p className="text-sm text-gray-700 py-2.5 px-4 bg-gray-50 rounded-xl">{userData.gender || 'Not selected'}</p>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1.5">Birthday</label>
                  {isEdit ? (
                    <input
                      className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-sky-400/30 focus:border-sky-400 transition-all"
                      type="date"
                      value={userData.dob || ''}
                      onChange={(e) => setUserData((prev) => ({ ...prev, dob: e.target.value }))}
                    />
                  ) : (
                    <p className="text-sm text-gray-700 py-2.5 px-4 bg-gray-50 rounded-xl">{userData.dob ? new Date(userData.dob).toLocaleDateString() : 'Not selected'}</p>
                  )}
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex justify-center gap-3 pt-5 border-t border-gray-100">
              {isEdit ? (
                <>
                  <button
                    className="px-7 py-2.5 text-sm font-semibold text-white bg-gradient-to-r from-[#3f5261] to-[#2c3e50] rounded-xl hover:from-[#2c3e50] hover:to-[#1a252f] shadow-md hover:shadow-lg transition-all duration-300 cursor-pointer"
                    onClick={updateUserProfileData}
                  >
                    Save Changes
                  </button>
                  <button
                    className="px-7 py-2.5 text-sm font-medium border border-gray-200 text-gray-600 rounded-xl hover:bg-gray-50 transition-all cursor-pointer"
                    onClick={() => setIsEdit(false)}
                  >
                    Cancel
                  </button>
                </>
              ) : (
                <button
                  className="px-7 py-2.5 text-sm font-semibold text-white bg-gradient-to-r from-[#3f5261] to-[#2c3e50] rounded-xl hover:from-[#2c3e50] hover:to-[#1a252f] shadow-md hover:shadow-lg transition-all duration-300 cursor-pointer"
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