import React, { useContext, useState, useEffect } from 'react';
import { AppContext } from '../context/AppContext';
import { useNavigate } from 'react-router-dom';

const RelatedDoctors = ({ speciality, docId }) => {
    const { doctors } = useContext(AppContext);
    const navigate = useNavigate();
    const [relDoc, setRelDocs] = useState([]);

    useEffect(() => {
        if (doctors.length > 0 && speciality) {
            const doctorsData = doctors.filter((doc) => doc.speciality === speciality && doc._id !== docId);
            setRelDocs(doctorsData);
        }
    }, [doctors, speciality, docId]);

    if (relDoc.length === 0) return null;

    return (
        <section className="py-14 sm:py-16">
            {/* Section Header */}
            <div className="text-center mb-8 sm:mb-10">
                <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 tracking-tight">
                    Related Doctors
                </h2>
                <div className="w-14 h-1 bg-gradient-to-r from-sky-500 to-cyan-400 rounded-full mx-auto mt-3 mb-3" />
                <p className="text-gray-500 text-sm max-w-sm mx-auto">
                    Browse other specialists in {speciality}
                </p>
            </div>

            {/* Doctor Grid */}
            <div className="grid grid-cols-auto gap-5 px-3 sm:px-0">
                {relDoc.slice(0, 5).map((item, index) => (
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
                                alt={`${item.name} profile`}
                            />
                            <div className={`absolute top-3 right-3 flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium backdrop-blur-sm ${item.available
                                ? 'bg-emerald-500/90 text-white'
                                : 'bg-gray-800/70 text-gray-200'
                                }`}>
                                <span className={`w-1.5 h-1.5 rounded-full ${item.available ? 'bg-white animate-pulse' : 'bg-gray-400'}`} />
                                {item.available ? 'Available' : 'Unavailable'}
                            </div>
                        </div>
                        <div className="p-4">
                            <h3 className="text-gray-900 text-base font-semibold mb-1 group-hover:text-sky-600 transition-colors duration-200">
                                {item.name}
                            </h3>
                            <p className="text-gray-500 text-sm">{item.speciality}</p>
                        </div>
                    </div>
                ))}
            </div>

            {/* More Button */}
            <div className="text-center mt-10">
                <button
                    onClick={() => { navigate('/doctors'); scrollTo(0, 0); }}
                    className="group inline-flex items-center gap-2 px-8 py-3 rounded-full border-2 border-gray-200 text-gray-600 text-sm font-semibold hover:border-sky-400 hover:text-sky-600 hover:bg-sky-50/50 transition-all duration-300 cursor-pointer"
                >
                    View All Doctors
                    <svg className="w-4 h-4 transition-transform duration-300 group-hover:translate-x-1" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                    </svg>
                </button>
            </div>
        </section>
    );
};

export default RelatedDoctors;