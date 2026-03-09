import React, { useContext, useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { AppContext } from '../context/AppContext';

const Doctors = () => {
  const { speciality } = useParams();
  const { doctors } = useContext(AppContext);
  const navigate = useNavigate();
  const [filterDoc, setFilterDoc] = useState([]);
  const [showFilter, setShowFilter] = useState(false);

  const specialities = [
    'ENT',
    'MRI / Radiology',
  ];

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
    <div className="py-8 sm:py-10 px-4 sm:px-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8 sm:mb-10">
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900 tracking-tight">
            {speciality ? speciality : 'All Doctors'}
          </h1>
          <div className="w-14 h-1 bg-gradient-to-r from-sky-500 to-cyan-400 rounded-full mx-auto mt-3 mb-3" />
          <p className="text-sm text-gray-500 max-w-md mx-auto">
            Browse through our specialist doctors and book your appointment.
          </p>
          {filterDoc.length > 0 && (
            <div className="inline-flex items-center gap-1.5 mt-3 px-3 py-1 rounded-full bg-sky-50 border border-sky-100 text-sky-600 text-xs font-medium">
              <span className="w-1.5 h-1.5 bg-sky-400 rounded-full" />
              {filterDoc.length} {filterDoc.length === 1 ? 'doctor' : 'doctors'} found
            </div>
          )}
        </div>

        <div className="flex flex-col sm:flex-row gap-6">
          {/* Filter Sidebar */}
          {/* <div>
            <button
              className={`sm:hidden mb-4 px-5 py-2 rounded-xl text-sm font-medium border transition-all cursor-pointer ${showFilter ? 'bg-sky-50 text-sky-600 border-sky-200' : 'bg-white text-gray-600 border-gray-200'
                }`}
              onClick={() => setShowFilter((prev) => !prev)}
            >
              {showFilter ? 'Hide Filters' : 'Show Filters'}
            </button>
            <div className={`${showFilter ? 'flex' : 'hidden'} sm:flex flex-col gap-2 text-sm w-full sm:w-48`}>
              {specialities.map((spec, index) => (
                <button
                  onClick={() =>
                    speciality === spec
                      ? navigate('/doctors')
                      : navigate(`/doctors/${spec}`)
                  }
                  className={`px-4 py-2.5 rounded-xl text-left text-sm font-medium border transition-all duration-200 cursor-pointer ${speciality === spec
                      ? 'bg-sky-50 text-sky-600 border-sky-200'
                      : 'bg-white text-gray-600 border-gray-200 hover:border-sky-200 hover:bg-sky-50/50'
                    }`}
                  key={index}
                >
                  {spec}
                </button>
              ))}
            </div>
          </div> */}

          {/* Doctor Grid */}
          <div className="flex-1">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
              {filterDoc.map((item, index) => (
                <div
                  onClick={() => {
                    navigate(`/appointments/${item._id}`);
                    scrollTo(0, 0);
                  }}
                  className="group bg-white rounded-2xl overflow-hidden cursor-pointer card-hover border border-gray-100 shadow-sm"
                  key={index}
                >
                  <div className="relative bg-blue-50 overflow-hidden">
                    <img
                      className="w-full transition-transform duration-[500ms] group-hover:scale-105"
                      src={item.image}
                      alt={`${item.name}`}
                      loading="lazy"
                      decoding="async"
                    />
                    <div className={`absolute top-3 right-3 flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium backdrop-blur-sm ${item.available
                      ? 'bg-emerald-500/90 text-white'
                      : 'bg-gray-800/70 text-gray-200'
                      }`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${item.available ? 'bg-white animate-pulse' : 'bg-gray-400'}`} />
                      {item.available ? 'Available' : 'Unavailable'}
                    </div>
                  </div>
                  <div className="p-4 sm:p-5">
                    <h3 className="text-gray-900 text-base sm:text-lg font-semibold mb-1 line-clamp-1 group-hover:text-sky-600 transition-colors duration-200">
                      {item.name}
                    </h3>
                    <p className="text-gray-500 text-xs sm:text-sm">{item.speciality}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Doctors;