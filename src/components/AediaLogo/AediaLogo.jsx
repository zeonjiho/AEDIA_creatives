import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import './AediaLogo.css';

const AediaLogo = ({ 
  width = 100, 
  height = 105, 
  color = '#000000', 
  secondaryColor = '#4A90E2',
  className = '',
  onClick = () => {},
  style = {},
  animated = false,
  theme = 'light'
}) => {
  // 테마에 따른 색상 설정
  const [logoColor, setLogoColor] = useState(color);
  const [textColor, setTextColor] = useState(secondaryColor);
  
  // 테마 변경 시 색상 업데이트
  useEffect(() => {
    if (theme === 'dark') {
      setLogoColor(color === '#000000' ? '#FFFFFF' : color);
      setTextColor(secondaryColor === '#000000' ? '#4A90E2' : secondaryColor);
    } else {
      setLogoColor(color);
      setTextColor(secondaryColor);
    }
  }, [theme, color, secondaryColor]);

  return (
    <svg 
      width={width} 
      height={height} 
      viewBox="0 0 100 130" 
      fill="none" 
      xmlns="http://www.w3.org/2000/svg"
      className={`aedia-logo ${animated ? 'animated' : ''} ${className}`}
      onClick={onClick}
      style={style}
    >
      <g clipPath="url(#clip0_aedia)" className="logo-symbol">
        <path 
          d="M15.46 66.28C12.4 65.5 9.81 62.06 8.07 59.23C6.8 57.18 6.27 54.71 4.61 52.9C-5.33 42.11 1.66 30.67 17.36 14.36C22.68 8.83 26.58 5.97 32.56 3.95C58.96 -4.99 97.72 -9.62522e-07 99.81 32.06C100.43 41.46 95.28 49.9 89.15 57.28C87.33 59.47 85.33 61.68 83.54 63.93C81.2 66.78 79.15 70.11 77.43 73.06C76.57 74.5 75.69 75.96 75.17 77.54C74.18 80.27 74.69 83.04 74.88 85.8C75.08 90.84 70.6 93.33 65.79 96.97C60.23 100.72 53.19 107.34 46.34 102.83C44.49 101.64 43.06 99.84 41.09 98.56C37.66 96.13 33.28 96.34 29.2 95.9C26.43 95.54 24.29 94.41 22.79 92.28C21.83 90.94 21.14 89.33 20.33 87.87C19.23 85.82 17.66 84.02 15.77 82.54C13.41 80.65 10.58 79.35 9.16 76.81C7.7 74.43 8.16 70.54 11.59 69.95C13.94 69.54 16.59 70.36 18.95 70.9C22.86 71.99 27.52 72.42 31.21 73.6C33.4 74.31 35.59 75.81 35.59 78.11C35.71 80.28 34.63 82.63 35.64 84.71C37.11 87.69 42.32 90.31 45.76 90.17C47.95 90.15 49.52 88.61 50.62 86.98C51.92 85.11 53.36 82.56 55.31 80.52C58.97 76.5 63.03 76.3 67.61 74.05C68.8 73.43 69.9 72.65 70.82 71.72C75.14 67.32 73.24 62.03 66.66 63.76C64.03 64.46 61.71 66.14 59.93 68.04C57.8 70.21 56.24 73.41 53.19 74.31C50.8 75.02 48.07 74.49 45.57 74.08C43.01 73.6 40.39 73.17 37.88 72.45C36.1 71.96 31.97 70.26 33.16 68.14C34.14 66.91 37.17 67.07 39.02 67.05C43.04 67.22 46.91 66.53 50.58 64.83C56.36 62.16 61.85 58.61 66.23 53.94C68.41 51.61 70.3 49 71.74 46.15C73.17 43.33 74.58 39.82 74.77 36.65C74.88 34.88 74.55 33.08 73.78 31.47C71.16 26 64.21 24.35 58.64 24.67C53.27 24.98 48.23 27.44 43.93 30.53C33.83 37.78 26.66 48.31 22.71 60.02C21.58 63.38 19.71 67.22 15.47 66.27H15.43L15.46 66.28Z" 
          fill={logoColor}
          className="logo-path"
        />
      </g>
      
      <defs>
        <clipPath id="clip0_aedia">
          <rect width="99.86" height="104.35" fill="white"/>
        </clipPath>
      </defs>
    </svg>
  );
};

AediaLogo.propTypes = {
  width: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
  height: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
  color: PropTypes.string,
  secondaryColor: PropTypes.string,
  className: PropTypes.string,
  onClick: PropTypes.func,
  style: PropTypes.object,
  animated: PropTypes.bool,
  theme: PropTypes.oneOf(['light', 'dark'])
};

export default AediaLogo; 