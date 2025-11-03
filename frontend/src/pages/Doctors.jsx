import React, { useContext, useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { AppContext } from '../context/AppContext';

const Doctors = () => {
  const { speciality } = useParams();
  const [filterDoc, setFilterDoc] = useState([]);
  const [showfilter, setShowfilter] = useState(false);
  const navigate = useNavigate();
  const { doctors } = useContext(AppContext);

  const applyFilter = () => {
    if (speciality) {
      setFilterDoc(doctors.filter((doc) => doc.speciality === speciality));
    } else {
      setFilterDoc(doctors);
    }
  };

  useEffect(() => {
    applyFilter();
  }, [doctors, speciality]);

  return (
    <div className="px-3 sm:px-6 md:px-10 lg:px-16 py-5 sm:py-8">
      {/* Filters section commented out as requested */}
      <div className="flex flex-col sm:flex-row items-start gap-5 mt-5">
        {/* <button className={`py-1 px-3 border rounded text-sm transition-all sm:hidden ${showfilter ? 'bg-primary text-white' : ''}`} onClick={() => setShowfilter(prev => !prev)}>Filters</button>
        <div className={` flex flex-col gap-4 text-sm text-gray-600 ${showfilter ? 'flex' : 'hidden sm:flex'}`}>
          ...filter options removed...
        </div> */}
        <div className="w-full grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 sm:gap-5 min-w-0">
          {filterDoc.map((item, index) => (
            <div
              onClick={() => {
                navigate(`/appointments/${item._id}`);
                scrollTo(0, 0);
              }}
              className="border border-blue-200 rounded-xl overflow-hidden cursor-pointer hover:shadow-md sm:hover:shadow-lg transition-all duration-300 bg-white"
              key={index}
            >
              <div className="relative w-full h-44 xs:h-48 sm:h-56 md:h-64 lg:h-72 bg-blue-50 overflow-hidden">
                <img 
                  className="w-full h-full object-cover object-center hover:scale-105 transition-transform duration-300" 
                  src={item.image} 
                  alt={`${item.name} profile`}
                  onError={(e) => {
                    e.target.src = 'https://via.placeholder.com/256x208?text=Doctor'
                  }}
                />
              </div>
              <div className="p-3 sm:p-4">
                  <div className={`flex items-center gap-2 text-[11px] sm:text-xs md:text-sm ${item.available ? 'text-green-600' : 'text-gray-500'} mb-1.5 sm:mb-2`}>
                    <p className={`w-2 h-2 ${item.available ? 'bg-green-500' : 'bg-gray-400'} rounded-full`}></p>
                    <p className="whitespace-nowrap">{item.available ? 'Available' : 'Not Available'}</p>
                  </div>
                  <p className="text-gray-900 text-sm sm:text-base md:text-lg font-semibold mb-0.5 line-clamp-2">{item.name}</p>
                  <p className="text-gray-600 text-[11px] sm:text-xs md:text-sm">{item.speciality}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Doctors;