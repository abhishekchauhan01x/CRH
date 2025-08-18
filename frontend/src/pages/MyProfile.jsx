import React, { useContext } from 'react';
import { useState } from 'react';
import { AppContext } from '../context/AppContext';
import { assets } from '../assets/assets';
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
    <div className="px-4 sm:px-6 md:px-10 lg:px-16 py-6 sm:py-8 max-w-2xl mx-auto flex flex-col gap-3 sm:gap-4 text-sm sm:text-base">

      {
        isEdit
          ? <label htmlFor="image">
            <div className='inline-block relative cursor-pointer'>
              <img className='w-32 rounded opacity-75' src={image ? URL.createObjectURL(image) : userData.image} alt="" />
              <img className='w-10 absolute bottom-12 right-12' src={image ? '' : assets.upload_icon} alt="" />
            </div>
            <input onChange={(e) => setImage(e.target.files[0])} type="file" id='image' hidden />
          </label>
          : <img
            className="w-24 sm:w-32 md:w-36 h-24 sm:h-32 md:h-36 rounded-full object-cover"
            src={userData.image}
            alt={`${userData.name} profile`}
          />
      }
      {isEdit ? (
        <input
          className="bg-gray-50 text-xl sm:text-2xl font-medium w-full max-w-xs sm:max-w-md mt-3 sm:mt-4"
          type="text"
          value={userData.name}
          onChange={(e) => setUserData((prev) => ({ ...prev, name: e.target.value }))}
        />
      ) : (
        <p className="font-medium text-xl sm:text-2xl text-neutral-800 mt-3 sm:mt-4">
          {userData.name}
        </p>
      )}

      <hr className="bg-gray-300 h-[1px] border-none" />
      <div>
        <p className="text-neutral-500 underline mt-3 sm:mt-4 text-sm sm:text-base">
          CONTACT INFORMATION
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-[1fr_3fr] gap-y-2 sm:gap-y-3 gap-x-4 mt-3 sm:mt-4 text-neutral-700">
          <p className="font-medium">Email Id:</p>
          {isEdit ? (
            <input
              className="bg-gray-50 border border-gray-300 rounded-lg p-2 sm:p-2.5 w-full max-w-xs sm:max-w-md"
              type="email"
              value={userData.email}
              onChange={(e) => setUserData((prev) => ({ ...prev, email: e.target.value }))}
            />
          ) : (
            <p className="text-blue-500">{userData.email}</p>
          )}
          <p className="font-medium">Phone:</p>
          {isEdit ? (
            <input
              className="bg-gray-50 border border-gray-300 rounded-lg p-2 sm:p-2.5 w-full max-w-xs sm:max-w-md"
              type="text"
              value={userData.phone}
              onChange={(e) => setUserData((prev) => ({ ...prev, phone: e.target.value }))}
            />
          ) : (
            <p className="text-blue-500">{userData.phone}</p>
          )}
          <p className="font-medium">Address:</p>
          {isEdit ? (
            <div className="flex flex-col gap-2">
              <input
                className="bg-gray-50 border border-gray-300 rounded-lg p-2 sm:p-2.5 w-full max-w-xs sm:max-w-md"
                type="text"
                value={userData.address.line1}
                onChange={(e) =>
                  setUserData((prev) => ({
                    ...prev,
                    address: { ...prev.address, line1: e.target.value },
                  }))
                }
              />
              <input
                className="bg-gray-50 border border-gray-300 rounded-lg p-2 sm:p-2.5 w-full max-w-xs sm:max-w-md"
                type="text"
                value={userData.address.line2}
                onChange={(e) =>
                  setUserData((prev) => ({
                    ...prev,
                    address: { ...prev.address, line2: e.target.value },
                  }))
                }
              />
            </div>
          ) : (
            <p className="text-gray-500">
              {userData.address.line1}
              <br />
              {userData.address.line2}
            </p>
          )}
        </div>
      </div>
      <div>
        <p className="text-neutral-500 underline mt-3 sm:mt-4 text-sm sm:text-base">
          BASIC INFORMATION
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-[1fr_3fr] gap-y-2 sm:gap-y-3 gap-x-4 mt-3 sm:mt-4 text-neutral-700">
          <p className="font-medium">Gender:</p>
          {isEdit ? (
            <select
              className="bg-gray-50 border border-gray-300 rounded-lg p-2 sm:p-2.5 w-full max-w-[100px] sm:max-w-28"
              onChange={(e) => setUserData((prev) => ({ ...prev, gender: e.target.value }))}
              value={userData.gender}
            >
              <option value="Male">Male</option>
              <option value="Female">Female</option>
            </select>
          ) : (
            <p className="text-gray-400">{userData.gender}</p>
          )}
          <p className="font-medium">Birthday:</p>
          {isEdit ? (
            <input
              className="bg-gray-50 border border-gray-300 rounded-lg p-2 sm:p-2.5 w-full max-w-[140px] sm:max-w-28"
              type="date"
              value={userData.dob}
              onChange={(e) => setUserData((prev) => ({ ...prev, dob: e.target.value }))}
            />
          ) : (
            <p className="text-gray-400">{userData.dob}</p>
          )}
        </div>
      </div>

      <div className="mt-6 sm:mt-8">
        {isEdit ? (
          <button
            className="border border-[#5F6FFF] px-6 sm:px-8 py-2 sm:py-2.5 rounded-lg text-sm sm:text-base hover:bg-[#5F6FFF] hover:text-white transition-colors duration-300"
            onClick={updateUserProfileData}
          >
            Save Information
          </button>
        ) : (
          <button
            className="border border-[#5F6FFF] px-6 sm:px-8 py-2 sm:py-2.5 rounded-lg text-sm sm:text-base hover:bg-[#5F6FFF] hover:text-white transition-colors duration-300"
            onClick={() => setIsEdit(true)}
          >
            Edit
          </button>
        )}
      </div>
    </div>
  );
};

export default MyProfile;