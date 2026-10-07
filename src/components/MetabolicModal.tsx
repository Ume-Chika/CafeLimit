import React from 'react';
import { X, Activity, Zap, Shield, Sparkles, Check } from 'lucide-react';
import type { MetabolicSpeed } from '../types/caffeine';

interface MetabolicModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedSpeed: MetabolicSpeed;
  onChangeSpeed: (speed: MetabolicSpeed) => void;
  customHalfLifeHours: number;
  onChangeCustomHalfLife: (hours: number) => void;
}

export const MetabolicModal: React.FC<MetabolicModalProps> = ({
  isOpen,
  onClose,
  selectedSpeed,
  onChangeSpeed,
  customHalfLifeHours,
  onChangeCustomHalfLife,
}) => {
  if (!isOpen) return null;

  const profiles = [
    {
      type: 'standard' as const,
      icon: <Activity className="w-5 h-5 text-amber-700" />,
      title: '標準体質（成人平均）',
      halfLife: '4.0時間',
      desc: '健康な成人平均の代謝速度です。一般的な体質の方はこちらが推奨されます。',
      bg: 'hover:bg-amber-50/60',
    },
    {
      type: 'fast' as const,
      icon: <Zap className="w-5 h-5 text-emerald-600" />,
      title: '速い（喫煙者・高活性）',
      halfLife: '2.5時間',
      desc: '肝臓の代謝酵素 CYP1A2 の活性が高い方、喫煙習慣がある方（分解が約1.5倍高速）。',
      bg: 'hover:bg-emerald-50/60',
    },
    {
      type: 'slow' as const,
      icon: <Shield className="w-5 h-5 text-purple-600" />,
      title: '遅い（敏感・低活性）',
      halfLife: '6.0時間',
      desc: 'カフェインで眠れなくなりやすい方、ピル服用中、妊娠中、CYP1A2活性が低めの方。',
      bg: 'hover:bg-purple-50/60',
    },
    {
      type: 'custom' as const,
      icon: <Sparkles className="w-5 h-5 text-sky-600" />,
      title: 'カスタム設定',
      halfLife: `${customHalfLifeHours.toFixed(1)}時間`,
      desc: 'ご自身の体感に合わせて半減期を1.0〜12.0時間の間で自由に設定します。',
      bg: 'hover:bg-sky-50/60',
    },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3.5 sm:p-4 bg-stone-900/60 backdrop-blur-xs animate-fadeIn">
      <div
        className="bg-white rounded-3xl shadow-xl border border-stone-200 w-full max-w-md max-h-[90vh] overflow-y-auto flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* ヘッダー */}
        <div className="p-4 border-b border-stone-100 flex items-center justify-between sticky top-0 bg-white/95 backdrop-blur-xs z-10">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 rounded-xl bg-amber-100/80 text-amber-900 flex items-center justify-center">
              <Activity className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-black text-stone-900">代謝体質（半減期）の設定</h3>
              <p className="text-[11px] text-stone-500">あなたのカフェイン分解スピードを選択</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-7 h-7 rounded-full hover:bg-stone-100 text-stone-400 hover:text-stone-700 flex items-center justify-center cursor-pointer transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* リスト */}
        <div className="p-4 space-y-2.5">
          {profiles.map((p) => {
            const isSelected = selectedSpeed === p.type;
            return (
              <div
                key={p.type}
                onClick={() => {
                  onChangeSpeed(p.type);
                  if (p.type !== 'custom') {
                    onClose();
                  }
                }}
                className={`p-3.5 rounded-2xl border transition-all cursor-pointer ${p.bg} ${
                  isSelected
                    ? 'bg-amber-50/80 border-amber-800/80 ring-2 ring-amber-700/20 shadow-xs'
                    : 'bg-stone-50/60 border-stone-200/80'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center space-x-2.5">
                    <div className="w-8 h-8 rounded-xl bg-white border border-stone-200 flex items-center justify-center shadow-xs">
                      {p.icon}
                    </div>
                    <div>
                      <h4 className="text-xs font-black text-stone-900">{p.title}</h4>
                      <span className="text-[11px] font-mono font-bold text-amber-900 bg-white px-1.5 py-0.5 rounded border border-amber-200/60">
                        半減期 {p.halfLife}
                      </span>
                    </div>
                  </div>
                  {isSelected && (
                    <div className="w-5 h-5 rounded-full bg-amber-800 text-white flex items-center justify-center shadow-xs">
                      <Check className="w-3 h-3" />
                    </div>
                  )}
                </div>
                <p className="text-[11px] text-stone-600 mt-2 leading-relaxed">{p.desc}</p>

                {/* カスタムスライダー */}
                {isSelected && p.type === 'custom' && (
                  <div className="mt-3 pt-3 border-t border-amber-200/60 space-y-2" onClick={(e) => e.stopPropagation()}>
                    <div className="flex justify-between text-xs font-bold text-stone-700">
                      <span>半減期の指定:</span>
                      <span className="font-mono text-amber-900 font-black">{customHalfLifeHours.toFixed(1)} 時間</span>
                    </div>
                    <input
                      type="range"
                      min="1.0"
                      max="12.0"
                      step="0.5"
                      value={customHalfLifeHours}
                      onChange={(e) => onChangeCustomHalfLife(parseFloat(e.target.value))}
                      className="w-full h-2 bg-stone-200 rounded-lg appearance-none cursor-pointer accent-amber-800"
                    />
                    <div className="flex justify-between text-[10px] font-mono text-stone-400">
                      <span>1.0h (超高速)</span>
                      <span>4.0h (平均)</span>
                      <span>12.0h (極遅)</span>
                    </div>
                    <button
                      type="button"
                      onClick={onClose}
                      className="w-full mt-2 py-1.5 bg-[#3E271E] text-white text-xs font-bold rounded-xl active:scale-95 transition-all shadow-xs"
                    >
                      この半減期で決定
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
