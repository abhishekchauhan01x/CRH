import React, { useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { AppContext } from '../context/AppContext';

const TopDoctors = () => {
    const navigate = useNavigate();
    const { doctors } = useContext(AppContext);

    return (
        <section className="py-14 sm:py-18 md:py-20 px-3 sm:px-4">
            {/* Section Header */}
            <div className="text-center mb-10 sm:mb-12">
                <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900 tracking-tight">
                    Top Doctors to Book
                </h2>
                <div className="w-16 h-1 bg-gradient-to-r from-sky-500 to-cyan-400 rounded-full mx-auto mt-3 mb-4" />
                <p className="text-gray-500 text-sm sm:text-base max-w-md mx-auto">
                    Simply browse through our extensive list of trusted doctors.
                </p>
            </div>

            {/* Doctor Grid */}
            <div className="max-w-[1200px] mx-auto">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5 sm:gap-6">
                    {doctors.slice(0, 10).map((item, index) => (
                        <div
                            onClick={() => {
                                navigate(`/appointments/${item._id}`);
                                scrollTo(0, 0);
                            }}
                            className="group bg-white rounded-2xl overflow-hidden cursor-pointer card-hover border border-gray-100 shadow-sm"
                            key={index}
                        >
                            {/* Image */}
                            <div className="relative bg-blue-50 overflow-hidden">
                                <img
                                    className="w-full transition-transform duration-[500ms] group-hover:scale-105"
                                    src={item.image}
                                    alt={`${item.name} profile`}
                                    loading="lazy"
                                    decoding="async"
                                    onError={(e) => {
                                        e.target.src = 'https://via.placeholder.com/256x288?text=Doctor'
                                    }}
                                />
                                {/* Availability badge */}
                                <div className={`absolute top-3 right-3 flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium backdrop-blur-sm ${item.available
                                    ? 'bg-emerald-500/90 text-white'
                                    : 'bg-gray-800/70 text-gray-200'
                                    }`}>
                                    <span className={`w-1.5 h-1.5 rounded-full ${item.available ? 'bg-white animate-pulse' : 'bg-gray-400'}`} />
                                    {item.available ? 'Available' : 'Unavailable'}
                                </div>
                            </div>

                            {/* Info */}
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
        </section>
    );
};

export default TopDoctors;