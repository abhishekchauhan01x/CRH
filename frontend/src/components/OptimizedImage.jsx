import React, { useState } from 'react';

const OptimizedImage = ({
  src,
  alt,
  className = '',
  loading = 'lazy',
  fallback = 'https://via.placeholder.com/400x300?text=Loading...',
  ...props
}) => {
  const [imageSrc, setImageSrc] = useState(src);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  const handleLoad = () => {
    setIsLoading(false);
  };

  const handleError = () => {
    setHasError(true);
    setIsLoading(false);
    setImageSrc(fallback);
  };

  return (
    <div className={`relative overflow-hidden ${className}`}>
      {/* Shimmer skeleton */}
      {isLoading && (
        <div className="absolute inset-0 bg-gray-100 rounded-xl">
          <div className="absolute inset-0 shimmer-skeleton" />
        </div>
      )}

      {/* Error state */}
      {hasError && (
        <div className="absolute inset-0 bg-gray-50 rounded-xl flex flex-col items-center justify-center gap-2">
          <svg className="w-10 h-10 text-gray-300" fill="none" viewBox="0 0 24 24" strokeWidth={1} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909M3.75 21h16.5a2.25 2.25 0 002.25-2.25V5.25a2.25 2.25 0 00-2.25-2.25H3.75a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 003.75 21z" />
          </svg>
          <span className="text-xs text-gray-400">Image unavailable</span>
        </div>
      )}

      <img
        src={imageSrc}
        alt={alt}
        loading={loading}
        decoding="async"
        onLoad={handleLoad}
        onError={handleError}
        className={`${className} transition-all duration-500 ease-out ${isLoading ? 'opacity-0 scale-105 blur-sm' : 'opacity-100 scale-100 blur-0'
          }`}
        {...props}
      />
    </div>
  );
};

export default OptimizedImage;
