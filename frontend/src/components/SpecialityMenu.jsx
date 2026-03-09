import React, { useContext, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { AppContext } from '../context/AppContext';

const SpecialityMenu = () => {
    const { doctors } = useContext(AppContext);

    // Derive unique specialities from actual doctor data
    const specialities = useMemo(() => {
        const unique = [...new Set(doctors.map((d) => d.speciality))];
        return unique.filter(Boolean);
    }, [doctors]);

    return (
        <section className="py-14 sm:py-16 text-gray-800" id="speciality">
            {/* Section Header */}
            <div className="text-center mb-8 sm:mb-10">
                <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900 tracking-tight">
                    Find by Speciality
                </h2>
                <div className="w-14 h-1 bg-gradient-to-r from-sky-500 to-cyan-400 rounded-full mx-auto mt-3 mb-4" />
                <p className="text-gray-500 text-sm sm:text-base max-w-md mx-auto">
                    Simply browse through our extensive list of trusted doctors, schedule your appointment hassle-free.
                </p>
            </div>

            {/* Speciality Cards */}
            <div className="flex sm:justify-center gap-4 pt-2 w-full overflow-x-auto scrollbar-hide pb-2 px-4 sm:px-0">
                {specialities.map((spec, index) => (
                    <Link
                        onClick={() => scrollTo(0, 0)}
                        className="group flex flex-col items-center text-xs font-medium text-gray-600 cursor-pointer flex-shrink-0"
                        key={index}
                        to={`/doctors/${spec}`}
                    >
                        <div className="w-16 h-16 sm:w-20 sm:h-20 md:w-24 md:h-24 rounded-2xl bg-sky-50 border border-sky-100 flex items-center justify-center mb-2.5 transition-all duration-300 group-hover:bg-sky-100 group-hover:border-sky-200 group-hover:-translate-y-1.5 group-hover:shadow-lg group-hover:shadow-sky-100/50">
                            <svg className="w-7 sm:w-8 md:w-9 text-sky-500 transition-transform duration-300 group-hover:scale-110" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                                {spec.toLowerCase().includes('ent') ? (
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M9.75 3.104v5.714a2.25 2.25 0 01-.659 1.591L5 14.5M9.75 3.104c-.251.023-.501.05-.75.082m.75-.082a24.301 24.301 0 014.5 0m0 0v5.714c0 .597.237 1.17.659 1.591L19.8 15.3M14.25 3.104c.251.023.501.05.75.082M19.8 15.3l-1.57.393A9.065 9.065 0 0112 15a9.065 9.065 0 00-6.23.693L5 14.5m14.8.8l1.402 1.402c1.232 1.232.65 3.318-1.067 3.611A48.309 48.309 0 0112 21c-2.773 0-5.491-.235-8.135-.687-1.718-.293-2.3-2.379-1.067-3.61L5 14.5" />
                                ) : (
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M6.827 6.175A2.31 2.31 0 015.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 00-1.134-.175 2.31 2.31 0 01-1.64-1.055l-.822-1.316a2.192 2.192 0 00-1.736-1.039 48.774 48.774 0 00-5.232 0 2.192 2.192 0 00-1.736 1.039l-.821 1.316z" />
                                )}
                            </svg>
                        </div>
                        <span className="text-center text-[11px] sm:text-xs transition-colors duration-200 group-hover:text-sky-600">
                            {spec}
                        </span>
                    </Link>
                ))}
            </div>
        </section>
    );
};

export default SpecialityMenu;