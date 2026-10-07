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

  // 1. エナジードリンク（アルミ缶デザイン）
  if (category === 'energy') {
    return (
      <div className={`relative flex flex-col items-center justify-end ${sizeClasses[size]}`}>
        <svg
          viewBox="0 0 100 110"
          className="w-full h-full drop-shadow-xs overflow-visible"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <defs>
            <linearGradient id={`canGrad-${uniqueId}`} x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="#1E293B" />
              <stop offset="35%" stopColor={color || '#10B981'} />
              <stop offset="70%" stopColor="#334155" />
              <stop offset="100%" stopColor="#0F172A" />
            </linearGradient>
            <linearGradient id={`canTopGrad-${uniqueId}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#E2E8F0" />
              <stop offset="100%" stopColor="#94A3B8" />
            </linearGradient>
          </defs>

          {/* 影 */}
          <ellipse cx="50" cy="98" rx="20" ry="3" fill="#000000" fillOpacity="0.12" />

          {/* 缶トップ（シルバーリム） */}
          <ellipse cx="50" cy="22" rx="21" ry="5.5" fill={`url(#canTopGrad-${uniqueId})`} stroke="#64748B" strokeWidth="1" />
          <ellipse cx="50" cy="21" rx="17" ry="4" fill="#CBD5E1" />
          {/* プルタブ */}
          <rect x="46" y="19" width="8" height="4" rx="1.5" fill="#475569" />

          {/* 缶ボディ */}
          <path
            d="M 29 22 C 29 26, 27 28, 27 34 L 27 90 C 27 96, 73 96, 73 90 L 73 34 C 73 28, 71 26, 71 22 Z"
            fill={`url(#canGrad-${uniqueId})`}
            stroke="#475569"
            strokeWidth="1.5"
          />

          {/* エナジー雷シンボル */}
          <path
            d="M 52 38 L 41 57 L 49 57 L 46 76 L 60 53 L 52 53 Z"
            fill="#FACC15"
            stroke="#CA8A04"
            strokeWidth="1"
            className="drop-shadow-xs"
          />

          {/* 縦のハイライト光沢 */}
          <line x1="37" y1="32" x2="37" y2="88" stroke="#FFFFFF" strokeWidth="2.5" strokeLinecap="round" opacity="0.3" />
          <line x1="63" y1="32" x2="63" y2="88" stroke="#000000" strokeWidth="2" opacity="0.25" />
        </svg>
      </div>
    );
  }

  // 2. お茶・緑茶（湯呑み/グラス）
  if (category === 'tea') {
    return (
      <div className={`relative flex flex-col items-center justify-end ${sizeClasses[size]}`}>
        <svg
          viewBox="0 0 100 110"
          className="w-full h-full drop-shadow-xs overflow-visible"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <ellipse cx="50" cy="98" rx="22" ry="3" fill="#000000" fillOpacity="0.08" />
          {/* 陶器湯呑み */}
          <path
            d="M 26 26 L 31 90 C 31 96, 69 96, 69 90 L 74 26 Z"
            fill="#F1F5F9"
            stroke="#CBD5E1"
            strokeWidth="2"
          />
          {/* お茶液面 */}
          <path
            d="M 30 42 L 33 87 C 33 92, 67 92, 67 87 L 70 42 Z"
            fill={color || '#16A34A'}
            opacity="0.85"
          />
          <ellipse cx="50" cy="42" rx="20" ry="4" fill="#86EFAC" opacity="0.9" />
          {/* 茶葉シンボル */}
          <path
            d="M 46 62 C 46 54, 54 54, 54 62 C 54 70, 46 70, 46 62 Z"
            fill="#15803D"
          />
        </svg>
      </div>
    );
  }

  // 3. ソーダ・炭酸（カップ＆ストロー）
  if (category === 'soda') {
    return (
      <div className={`relative flex flex-col items-center justify-end ${sizeClasses[size]}`}>
        <svg
          viewBox="0 0 100 110"
          className="w-full h-full drop-shadow-xs overflow-visible"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <ellipse cx="50" cy="98" rx="22" ry="3" fill="#000000" fillOpacity="0.08" />
          {/* ストロー */}
          <line x1="56" y1="12" x2="68" y2="4" stroke="#DC2626" strokeWidth="4" strokeLinecap="round" />
          <line x1="48" y1="36" x2="56" y2="12" stroke="#DC2626" strokeWidth="4" strokeLinecap="round" />
          {/* リッド */}
          <ellipse cx="50" cy="30" rx="26" ry="5" fill="#F8FAFC" stroke="#CBD5E1" strokeWidth="1.5" />
          {/* カップ */}
          <path
            d="M 26 30 L 33 90 C 33 96, 67 96, 67 90 L 74 30 Z"
            fill={color || '#EF4444'}
            stroke="#B91C1C"
            strokeWidth="1.5"
          />
          {/* 光沢 */}
          <line x1="36" y1="36" x2="40" y2="86" stroke="#FFFFFF" strokeWidth="2.5" strokeLinecap="round" opacity="0.4" />
        </svg>
      </div>
    );
  }

  // 4. ネスカフェ / レギュラーコーヒー（ガラスマグ＆クレマ）
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
            <stop offset="0%" stopColor={color} stopOpacity="0.92" />
            <stop offset="100%" stopColor="#2A160A" stopOpacity="1" />
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
          fillOpacity="0.88"
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
