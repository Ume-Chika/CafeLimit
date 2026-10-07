import React, { useId } from 'react';

interface NescafeCoffeeCupProps {
  color?: string;
  size?: 'sm' | 'md' | 'lg';
  category?: string;
}

export const NescafeCoffeeCup: React.FC<NescafeCoffeeCupProps> = ({
  color = '#5C3826',
  size = 'md',
  category = 'nescafe',
}) => {
  const uniqueId = useId().replace(/:/g, '');

  const sizeClasses = {
    sm: 'w-12 h-14',
    md: 'w-16 h-20',
    lg: 'w-24 h-28',
  };

  const isCoffee = category === 'nescafe' || category === 'coffee';

  if (!isCoffee) {
    let iconLetter = '⚡';
    if (category === 'tea') iconLetter = '🍵';
    else if (category === 'soda') iconLetter = '🥤';
    else if (category === 'energy') iconLetter = '⚡';

    return (
      <div className={`relative flex items-center justify-center ${sizeClasses[size]}`}>
        <div
          className="w-full h-full rounded-2xl flex flex-col items-center justify-center shadow-xs text-white font-bold border border-white/20"
          style={{ backgroundColor: color || '#10B981' }}
        >
          <span className="text-xl drop-shadow-xs">{iconLetter}</span>
        </div>
      </div>
    );
  }

  return (
    <div className={`relative flex flex-col items-center justify-end ${sizeClasses[size]}`}>
      <svg
        viewBox="0 0 100 110"
        className="w-full h-full drop-shadow-xs overflow-visible"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <clipPath id={`cupClip-${uniqueId}`}>
            <path d="M 23 20 L 29 88 C 29 94, 71 94, 71 88 L 77 20 Z" />
          </clipPath>
          <linearGradient id={`foamGrad-${uniqueId}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#F5E5C8" />
            <stop offset="100%" stopColor="#DFCA9D" />
          </linearGradient>
          <linearGradient id={`coffeeGrad-${uniqueId}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity="0.9" />
            <stop offset="100%" stopColor="#3E2415" stopOpacity="1" />
          </linearGradient>
        </defs>

        {/* 底面シャドウ */}
        <ellipse cx="50" cy="98" rx="24" ry="3" fill="#000000" fillOpacity="0.08" />

        {/* 取手 */}
        <path
          d="M 75 36 C 91 36, 91 72, 72 72"
          stroke="#DDE3E6"
          strokeWidth="5"
          strokeLinecap="round"
          fill="none"
        />

        {/* 外側ガラス本体 */}
        <path
          d="M 20 18 L 27 90 C 27 97, 73 97, 73 90 L 80 18 Z"
          fill="#FFFFFF"
          fillOpacity="0.85"
          stroke="#D0D8DC"
          strokeWidth="3"
          strokeLinejoin="round"
        />

        {/* 中身（コーヒー＋クレマ） */}
        <g clipPath={`url(#cupClip-${uniqueId})`}>
          <rect x="15" y="36" width="70" height="70" fill={`url(#coffeeGrad-${uniqueId})`} />
          {/* クレマ層 */}
          <rect x="15" y="28" width="70" height="12" fill={`url(#foamGrad-${uniqueId})`} />
          <ellipse cx="50" cy="28" rx="26" ry="3.5" fill="#FAF0DD" opacity="0.95" />
        </g>

        {/* 光沢 */}
        <path
          d="M 25 22 L 30 84"
          stroke="#FFFFFF"
          strokeWidth="2"
          strokeLinecap="round"
          opacity="0.6"
        />
      </svg>
    </div>
  );
};
