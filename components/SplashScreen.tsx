import React from 'react';
import BrandedLoader from './BrandedLoader';

interface SplashScreenProps {
  message?: string;
}

export const SplashScreen: React.FC<SplashScreenProps> = ({ 
  message = 'Loading...' 
}) => {
  return (
    <div className="flex items-center justify-center min-h-screen bg-[#A8D8D8]">
      <div className="text-center">
        {/* Branded Loading Component */}
        <BrandedLoader 
          message={message}
          size="large"
          showLogo={true}
        />
      </div>
    </div>
  );
};

export default SplashScreen;