import React, { useContext, lazy, Suspense } from 'react';
import { useNavigate } from 'react-router-dom';
import { AppContext } from '../context/AppContext';

const TopDoctors = () => {
    const navigate = useNavigate();
    const { doctors } = useContext(AppContext);

    return (
        <div className="flex flex-col items-center gap-3 sm:gap-4 my-10 sm:my-14 md:my-16 text-gray-900 px-3 sm:px-4 md:mx-10">
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-semibold text-center">Top Doctors to Book</h1>
            <p className="w-full sm:w-2/3 md:w-1/2 text-center text-xs sm:text-sm text-gray-600">
                Simply browse through our extensive list of trusted doctors.
            </p>
            <div className="w-full flex justify-center">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6 min-w-0 w-full max-w-[1200px]">
                {doctors.slice(0, 10).map((item, index) => (
                    <div
                        onClick={() => {
                            navigate(`/appointments/${item._id}`);
                            scrollTo(0, 0);
                        }}
                        className="border border-blue-200 rounded-xl overflow-hidden cursor-pointer hover:shadow-lg transition-all duration-300 bg-white"
                        key={index}>
                        <div className="relative w-full h-52 sm:h-60 md:h-72 bg-blue-50 overflow-hidden">
                            <img 
                                className="w-full h-full object-cover object-center hover:scale-105 transition-transform duration-300"  
                                src={item.image} 
                                alt={`${item.name} profile`}
                                loading="lazy"
                                decoding="async"
                                onError={(e) => {
                                    e.target.src = 'https://via.placeholder.com/256x288?text=Doctor'
                                }}
                            />
                        </div>
                        <div className="p-3 sm:p-4">
                            <div className={`flex items-center gap-2 text-xs sm:text-sm ${item.available ? 'text-green-600' : 'text-gray-500'} mb-2 sm:mb-3`}>
                                <p className={`w-2 h-2 ${item.available ? 'bg-green-500' : 'bg-gray-400'} rounded-full`}></p>
                                <p className="whitespace-nowrap">{item.available ? 'Available' : 'Not Available'}</p>
                            </div>
                            <p className="text-gray-900 text-base sm:text-lg font-semibold mb-0.5 line-clamp-2">{item.name}</p>
                            <p className="text-gray-600 text-xs sm:text-sm">{item.speciality}</p>
                        </div>
                    </div>
                ))}
                </div>
            </div>
            {/* <button
                onClick={() => { navigate('/doctors'); scrollTo(0, 0); }}
                className="bg-blue-50 text-gray-600 px-12 py-3 rounded-full mt-10 text-sm sm:text-base font-medium hover:bg-blue-100 transition-colors">
                More
            </button> */}
        </div>
    );
};

export default TopDoctors;