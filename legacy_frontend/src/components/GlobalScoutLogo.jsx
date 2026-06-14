import React from 'react';

const GlobalScoutLogo = ({ size = 'medium', className = '', showText = true }) => {
  const sizes = {
    small: { width: 32, height: 32, text: 'text-lg' },
    medium: { width: 48, height: 48, text: 'text-2xl' },
    large: { width: 64, height: 64, text: 'text-3xl' },
    xl: { width: 80, height: 80, text: 'text-4xl' }
  };

  const currentSize = sizes[size] || sizes.medium;

  return (
    <div className={`flex items-center ${className}`}>
      <div className="relative">
        <svg
          width={currentSize.width}
          height={currentSize.height}
          viewBox="0 0 100 100"
          className="drop-shadow-lg"
        >
          {/* Gradient Definitions */}
          <defs>
            <linearGradient id="compassGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#1e40af" />
              <stop offset="50%" stopColor="#3b82f6" />
              <stop offset="100%" stopColor="#1e3a8a" />
            </linearGradient>
            <linearGradient id="starGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#fbbf24" />
              <stop offset="100%" stopColor="#f59e0b" />
            </linearGradient>
            <filter id="shadow" x="-20%" y="-20%" width="140%" height="140%">
              <feDropShadow dx="2" dy="2" stdDeviation="2" floodOpacity="0.3"/>
            </filter>
          </defs>

          {/* Outer Circle */}
          <circle
            cx="50"
            cy="50"
            r="45"
            fill="url(#compassGradient)"
            stroke="#1e3a8a"
            strokeWidth="2"
            filter="url(#shadow)"
          />

          {/* Inner Circle */}
          <circle
            cx="50"
            cy="50"
            r="35"
            fill="none"
            stroke="#ffffff"
            strokeWidth="1.5"
            opacity="0.8"
          />

          {/* Compass Lines */}
          <g stroke="#ffffff" strokeWidth="1" opacity="0.6">
            <line x1="50" y1="15" x2="50" y2="25" />
            <line x1="50" y1="75" x2="50" y2="85" />
            <line x1="15" y1="50" x2="25" y2="50" />
            <line x1="75" y1="50" x2="85" y2="50" />
            <line x1="26.5" y1="26.5" x2="32" y2="32" />
            <line x1="68" y1="68" x2="73.5" y2="73.5" />
            <line x1="73.5" y1="26.5" x2="68" y2="32" />
            <line x1="32" y1="68" x2="26.5" y2="73.5" />
          </g>

          {/* Main Compass Star */}
          <g transform="translate(50,50)">
            {/* North Point (Main) */}
            <path
              d="M 0,-25 L 8,-8 L 0,-12 L -8,-8 Z"
              fill="url(#starGradient)"
              stroke="#1e3a8a"
              strokeWidth="0.5"
            />
            
            {/* South Point */}
            <path
              d="M 0,25 L 8,8 L 0,12 L -8,8 Z"
              fill="#1e3a8a"
              stroke="#ffffff"
              strokeWidth="0.5"
            />
            
            {/* East Point */}
            <path
              d="M 25,0 L 8,8 L 12,0 L 8,-8 Z"
              fill="#3b82f6"
              stroke="#ffffff"
              strokeWidth="0.5"
            />
            
            {/* West Point */}
            <path
              d="M -25,0 L -8,8 L -12,0 L -8,-8 Z"
              fill="#3b82f6"
              stroke="#ffffff"
              strokeWidth="0.5"
            />
          </g>

          {/* Center Circle */}
          <circle
            cx="50"
            cy="50"
            r="4"
            fill="#ffffff"
            stroke="#1e3a8a"
            strokeWidth="1"
          />

          {/* Globe Lines */}
          <g stroke="#ffffff" strokeWidth="0.8" opacity="0.4" fill="none">
            <ellipse cx="50" cy="50" rx="30" ry="15" />
            <ellipse cx="50" cy="50" rx="30" ry="25" />
            <path d="M 20,50 Q 50,35 80,50 Q 50,65 20,50" />
          </g>
        </svg>
      </div>
      
      {showText && (
        <span className={`ml-3 font-bold text-gray-900 ${currentSize.text} tracking-tight`}>
          <span className="text-primary-600">Global</span>
          <span className="text-gray-800">Scout</span>
        </span>
      )}
    </div>
  );
};

export default GlobalScoutLogo;