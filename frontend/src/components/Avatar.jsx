import React, { useState } from 'react';

const Avatar = ({ 
  src, 
  firstName, 
  lastName, 
  size = 'medium', 
  className = '',
  showFallback = true 
}) => {
  const [imageError, setImageError] = useState(false);
  
  const sizeClasses = {
    xs: 'w-6 h-6 text-xs',
    small: 'w-8 h-8 text-sm',
    medium: 'w-10 h-10 text-sm',
    large: 'w-16 h-16 text-lg',
    xl: 'w-24 h-24 text-2xl'
  };

  const getInitials = (first = firstName, last = lastName) => {
    if (!first && !last) return '?';
    const firstInitial = first?.[0] || '';
    const lastInitial = last?.[0] || '';
    return `${firstInitial}${lastInitial}`.toUpperCase();
  };

  const avatarSrc = src ? `http://localhost:5000${src}` : null;
  const shouldShowImage = avatarSrc && !imageError;

  const handleImageError = () => {
    setImageError(true);
  };

  return (
    <div className={`${sizeClasses[size]} rounded-full overflow-hidden bg-gray-200 flex items-center justify-center`}>
      {avatarSrc ? (
        <img 
          src={avatarSrc} 
          alt={`${firstName} ${lastName}`}
          className="w-full h-full object-cover"
          onError={(e) => {
            e.target.style.display = 'none';
            e.target.parentElement.innerHTML = `<div class="flex items-center justify-center w-full h-full bg-gradient-to-br from-blue-500 to-purple-600 text-white font-semibold text-lg">${getInitials()}</div>`;
          }}
        />
      ) : (
        <div className="flex items-center justify-center w-full h-full bg-gradient-to-br from-blue-500 to-purple-600 text-white font-semibold text-lg">
          {getInitials()}
        </div>
      )}
    </div>
  );
};

export default Avatar;