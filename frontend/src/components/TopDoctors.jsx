import React, { useContext, lazy, Suspense } from 'react';
import { useNavigate } from 'react-router-dom';
import { AppContext } from '../context/AppContext';

const TopDoctors = () => {
    const navigate = useNavigate();
    const { doctors } = useContext(AppContext);

    return (
        <div className="flex flex-col items-center gap-4 my-16 text-gray-900 md:mx-10">
            <h1 className="text-3xl font-medium">Doctors to Book</h1>
            <p className="sm:w-1/3 text-center text-sm">
                Simply browse through our extensive list of trusted doctors.
            </p>
            <div className="w-full flex justify-center">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 gap-y-6 min-w-0">
                {doctors.slice(0, 10).map((item, index) => (
                    <div
                        onClick={() => {
                            navigate(`/appointments/${item._id}`);
                            scrollTo(0, 0);
                        }}
                        className="border border-blue-200 rounded-xl overflow-hidden cursor-pointer hover:shadow-lg transition-all duration-300 bg-white"
                        key={index}>
                        <div className="relative w-full h-72 bg-blue-50 overflow-hidden">
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
                        <div className="p-4">
                            <div className={`flex items-center gap-2 text-sm ${item.available ? 'text-green-500' : 'text-gray-500'} mb-3`}>
                                <p className={`w-2 h-2 ${item.available ? 'bg-green-500' : 'bg-gray-500'} rounded-full`}></p>
                                <p>{item.available ? 'Available' : 'Not Available'}</p>
                            </div>
                            <p className="text-gray-900 text-lg font-medium mb-1">{item.name}</p>
                            <p className="text-gray-600 text-sm">{item.speciality}</p>
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