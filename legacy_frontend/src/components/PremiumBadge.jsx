import React from 'react';
import { Crown } from 'lucide-react';

const PremiumBadge = ({ 
  size = 'sm', 
  showText = true, 
  className = '',
  variant = 'default' 
}) => {
  const sizeClasses = {
    xs: 'text-xs px-1.5 py-0.5',
    sm: 'text-xs px-2 py-1',
    md: 'text-sm px-3 py-1.5',
    lg: 'text-base px-4 py-2'
  };

  const iconSizes = {
    xs: 10,
    sm: 12,
    md: 14,
    lg: 16
  };

  const variants = {
    default: 'bg-gradient-to-r from-yellow-400 to-yellow-600 text-yellow-900 border border-yellow-500',
    gold: 'bg-gradient-to-r from-amber-400 to-amber-600 text-amber-900 border border-amber-500',
    minimal: 'bg-yellow-100 text-yellow-800 border border-yellow-300',
    dark: 'bg-gradient-to-r from-yellow-600 to-yellow-800 text-yellow-100 border border-yellow-700'
  };

  return (
    <span 
      className={`
        inline-flex items-center gap-1 rounded-full font-semibold
        shadow-sm transition-all duration-200 hover:shadow-md
        ${sizeClasses[size]} 
        ${variants[variant]}
        ${className}
      `}
      title="Premium Account"
    >
      <Crown 
        size={iconSizes[size]} 
        className="fill-current" 
      />
      {showText && (
        <span className="font-bold tracking-wide">
          PREMIUM
        </span>
      )}
    </span>
  );
};

export default PremiumBadge;