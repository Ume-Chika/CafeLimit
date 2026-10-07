import React, { useId } from 'react';

interface NescafeCoffeeCupProps {
  powderGrams?: number;
  waterMl?: number;
  foamMl?: number;
  color?: string;
  size?: 'sm' | 'md' | 'lg' | 'hero';
  category?: string;
}

export const NescafeCoffeeCup: React.FC<NescafeCoffeeCupProps> = ({
  waterMl = 120,
  foamMl = 0,
  color = '#5C3826',
  size = 'md',
  category = 'nescafe',
}) => {
  const uniqueId = useId().replace(/:/g, '');

  const sizeClasses = {
    sm: 'w-14 h-16',
    md: 'w-20 h-24',
    lg: 'w-28 h-32',
    hero: 'w-36 h-40',
  };

  const hasFoam = foamMl > 0;
  const isNescafe = category === 'nescafe' || category === 'coffee';

  if (!isNescafe) {
    let iconLetter = '⚡';
    if (category === 'tea') iconLetter = '🍵';
    else if (category === 'soda') iconLetter = '🥤';
    else if (category === 'energy') iconLetter = '⚡';

    return (
      <div className={`relative flex items-center justify-center ${sizeClasses[size]}`}>
        <div
          className="w-full h-full rounded-2xl flex flex-col items-center justify-center shadow-md text-white font-bold border border-white/20"
          style={{ backgroundColor: color || '#10B981' }}
        >
          <span className="text-2xl drop-shadow-sm">{iconLetter}</span>
        </div>
      </div>
    );
  }

  // 水量に応じた液面の高さ（基準: 90ml〜160ml）
  const liquidTopY = hasFoam ? 42 : waterMl < 100 ? 54 : 44;

  return (
    <div className={`relative flex flex-col items-center justify-end ${sizeClasses[size]}`}>
      <svg
        viewBox="0 0 120 120"
        className="w-full h-full drop-shadow-sm overflow-visible"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <clipPath id={`cupInnerClip-${uniqueId}`}>
            {/* バリスタグラスの内側形状 */}
            <path d="M 28 22 L 35 96 C 35 102, 75 102, 75 96 L 82 22 Z" />
          </clipPath>
          {/* クレマ・泡立ちグラデーション */}
          <linearGradient id={`foamGrad-${uniqueId}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#F5E5C8" />
            <stop offset="100%" stopColor="#DFCA9D" />
          </linearGradient>
          {/* コーヒー液グラデーション */}
          <linearGradient id={`coffeeGrad-${uniqueId}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity="0.9" />
            <stop offset="100%" stopColor="#3E2415" stopOpacity="1" />
          </linearGradient>
        </defs>

        {/* 底面のソフトシャドウ */}
        <ellipse cx="55" cy="106" rx="26" ry="3.5" fill="#000000" fillOpacity="0.08" />

        {/* グラスの取手（右側） */}
        <path
          d="M 80 40 C 98 40, 98 78, 77 78"
          stroke="#DDE3E6"
          strokeWidth="6"
          strokeLinecap="round"
          fill="none"
        />
        <path
          d="M 80 40 C 98 40, 98 78, 77 78"
          stroke="#EBF0F2"
          strokeWidth="3.5"
          strokeLinecap="round"
          fill="none"
        />

        {/* グラス本体外郭 */}
        <path
          d="M 24 18 L 32 98 C 33 106, 77 106, 78 98 L 86 18 Z"
          fill="#FFFFFF"
          fillOpacity="0.8"
          stroke="#D0D8DC"
          strokeWidth="3.5"
          strokeLinejoin="round"
        />

        {/* グラス内部コンテンツ（クリップ） */}
        <g clipPath={`url(#cupInnerClip-${uniqueId})`}>
          {/* コーヒー液 */}
          <rect
            x="20"
            y={liquidTopY}
            width="70"
            height="85"
            fill={`url(#coffeeGrad-${uniqueId})`}
          />

          {/* 泡立ち（クレマ）レイヤー */}
          {hasFoam && (
            <>
              {/* 波打つクレマ */}
              <path
                d={`M 20 ${liquidTopY} Q 38 ${liquidTopY - 6}, 55 ${liquidTopY} T 90 ${liquidTopY} L 90 ${liquidTopY + 16} L 20 ${liquidTopY + 16} Z`}
                fill={`url(#foamGrad-${uniqueId})`}
              />
              <ellipse
                cx="55"
                cy={liquidTopY - 2}
                rx="24"
                ry="4"
                fill="#FAF0DD"
                opacity="0.95"
              />
            </>
          )}

          {/* 泡なし時の液面 */}
          {!hasFoam && (
            <ellipse
              cx="55"
              cy={liquidTopY}
              rx="23"
              ry="3.5"
              fill="#6B3F24"
              opacity="0.9"
            />
          )}
        </g>

        {/* グラス前面のハイライト光沢線 */}
        <path
          d="M 29 24 L 35 92"
          stroke="#FFFFFF"
          strokeWidth="2.5"
          strokeLinecap="round"
          opacity="0.75"
        />
      </svg>
    </div>
  );
};
