import React from 'react';

interface BrandedLoaderProps {
  message?: string;
  size?: 'small' | 'medium' | 'large';
  showLogo?: boolean;
}

export const BrandedLoader: React.FC<BrandedLoaderProps> = ({ 
  message = 'Loading...',
  size = 'medium',
  showLogo = true
}) => {
  const sizeClasses = {
    small: {
      container: 'w-12 h-12',
      logo: 'w-10 h-10',
      spinner: 'w-8 h-8 border-2',
      text: 'text-sm',
      spacing: 'mb-2'
    },
    medium: {
      container: 'w-16 h-16',
      logo: 'w-44 h-44',
      spinner: 'w-12 h-12 border-3',
      text: 'text-base',
      spacing: 'mb-4'
    },
    large: {
      container: 'w-24 h-24',
      logo: 'w-52 h-52',
      spinner: 'w-16 h-16 border-4',
      text: 'text-lg',
      spacing: 'mb-6'
    }
  };

  const classes = sizeClasses[size];

  return (
    <div className="flex flex-col items-center justify-center">
      {showLogo && (
        <div className={`${classes.spacing}`}>
          <img 
            src="/familytide.png" 
            alt="Family Tide" 
            className={`${classes.logo} mx-auto object-contain`}
          />
        </div>
      )}
      
      <div className={`${classes.spinner} border-teal-600 border-t-transparent rounded-full animate-spin mx-auto ${classes.spacing}`}></div>
      
      {message && (
        <p className={`text-slate-600 ${classes.text} font-medium text-center`}>
          {message}
        </p>
      )}
    </div>
  );
};

export default BrandedLoader;