import React from 'react';
import { X, Activity, Zap, Shield, Sparkles, Check, Moon, Weight, Clock, Sliders } from 'lucide-react';
import type { MetabolicSpeed } from '../types/caffeine';

interface MetabolicModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedSpeed: MetabolicSpeed;
  onChangeSpeed: (speed: MetabolicSpeed) => void;
  customHalfLifeHours: number;
  onChangeCustomHalfLife: (hours: number) => void;
  safeSleepThresholdMg: number;
  onChangeSafeSleepThreshold: (threshold: number) => void;
  bodyWeightKg?: number;
  onChangeBodyWeight?: (weight: number) => void;
  drinkingDurationMinutes?: number;
  onChangeDrinkingDuration?: (minutes: number) => void;
}

export const MetabolicModal: React.FC<MetabolicModalProps> = ({
  isOpen,
  onClose,
  selectedSpeed,
  onChangeSpeed,
  customHalfLifeHours,
  onChangeCustomHalfLife,
  safeSleepThresholdMg,
  onChangeSafeSleepThreshold,
  bodyWeightKg = 60,
  onChangeBodyWeight,
  drinkingDurationMinutes = 10,
  onChangeDrinkingDuration,
}) => {
  if (!isOpen) return null;

  const profiles = [
    {
      type: 'standard' as const,
      icon: <Activity className="w-4 h-4 text-amber-700" />,
      title: '標準体質（成人平均）',
      halfLife: '4.0時間',
      desc: '健康な成人平均の代謝速度です。一般的な体質の方はこちらが推奨されます。',
    },
    {
      type: 'fast' as const,
      icon: <Zap className="w-4 h-4 text-emerald-600" />,
      title: '速い（喫煙者・高活性）',
      halfLife: '2.5時間',
      desc: '肝代謝酵素 CYP1A2 の活性が高い方、喫煙習慣がある方（分解が約1.5倍高速）。',
    },
    {
      type: 'slow' as const,
      icon: <Shield className="w-4 h-4 text-purple-600" />,
      title: '遅い（敏感・低活性）',
      halfLife: '6.0時間',
      desc: 'カフェインで眠れなくなりやすい方、ピル服用中、妊娠中、CYP1A2活性が低めの方。',
    },
    {
      type: 'custom' as const,
      icon: <Sparkles className="w-4 h-4 text-sky-600" />,
      title: 'カスタム設定',
      halfLife: `${customHalfLifeHours.toFixed(1)}時間`,
      desc: 'ご自身の体感に合わせて半減期を1.0〜12.0時間の間で自由に指定します。',
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
              <Sliders className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-black text-stone-900">シミュレーション・体質設定</h3>
              <p className="text-[11px] text-stone-500">快眠基準・代謝速度・体重・飲用時間</p>
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

        {/* 設定フォーム */}
        <div className="p-4 sm:p-5 space-y-4 text-xs">
          {/* 1. 快眠安全基準（就寝時残存上限） */}
          <div className="p-3.5 bg-stone-50/70 rounded-2xl border border-stone-200/80 space-y-1.5">
            <div className="flex items-center space-x-1.5 font-black text-stone-800">
              <Moon className="w-4 h-4 text-emerald-700" />
              <span>快眠安全基準（就寝時残存上限）</span>
            </div>
            <p className="text-[10px] text-stone-500">
              就寝時に目指すカフェイン残存量の上限を指定します。
            </p>
            <select
              value={safeSleepThresholdMg || 25}
              onChange={(e) => onChangeSafeSleepThreshold(Number(e.target.value))}
              className="w-full bg-white border border-stone-200 rounded-xl px-3 py-2 text-xs font-bold text-stone-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 cursor-pointer"
            >
              <option value={15}>敏感・厳格 (就寝時 15mg以下)</option>
              <option value={25}>標準バランス (就寝時 25mg以下 / 推奨)</option>
              <option value={35}>寛容・耐性あり (就寝時 35mg以下)</option>
              <option value={50}>高耐性 (就寝時 50mg以下)</option>
            </select>
          </div>

          {/* 2. 代謝速度（半減期）の選択 */}
          <div className="p-3.5 bg-stone-50/70 rounded-2xl border border-stone-200/80 space-y-2">
            <div className="flex items-center space-x-1.5 font-black text-stone-800">
              <Activity className="w-4 h-4 text-amber-800" />
              <span>代謝体質（カフェイン消失半減期）</span>
            </div>
            <div className="space-y-1.5">
              {profiles.map((p) => {
                const isSelected = selectedSpeed === p.type;
                return (
                  <div
                    key={p.type}
                    onClick={() => onChangeSpeed(p.type)}
                    className={`p-2.5 rounded-xl border transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-amber-50/90 border-amber-800/80 ring-1 ring-amber-700/20 shadow-2xs'
                        : 'bg-white border-stone-200/80 hover:bg-stone-50'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        {p.icon}
                        <span className="font-bold text-stone-900 text-xs">{p.title}</span>
                        <span className="text-[10px] font-mono font-bold text-amber-900 bg-amber-100/60 px-1.5 py-0.5 rounded">
                          {p.halfLife}
                        </span>
                      </div>
                      {isSelected && (
                        <div className="w-4 h-4 rounded-full bg-amber-800 text-white flex items-center justify-center shadow-xs">
                          <Check className="w-2.5 h-2.5" />
                        </div>
                      )}
                    </div>
                    <p className="text-[10px] text-stone-500 mt-1 leading-normal">{p.desc}</p>

                    {/* カスタムスライダー */}
                    {isSelected && p.type === 'custom' && (
                      <div className="mt-2 pt-2 border-t border-amber-200/60 space-y-1.5" onClick={(e) => e.stopPropagation()}>
                        <div className="flex justify-between text-[11px] font-bold text-stone-700">
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
                          className="w-full h-1.5 bg-stone-200 rounded-lg appearance-none cursor-pointer accent-amber-800"
                        />
                        <div className="flex justify-between text-[9px] font-mono text-stone-400">
                          <span>1.0h (超高速)</span>
                          <span>4.0h (平均)</span>
                          <span>12.0h (極遅)</span>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* 3. 体重設定（薬物動態希釈容量） */}
          <div className="p-3.5 bg-stone-50/70 rounded-2xl border border-stone-200/80 space-y-1.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-1.5 font-black text-stone-800">
                <Weight className="w-4 h-4 text-sky-700" />
                <span>体重（kg）</span>
              </div>
              <span className="text-[11px] font-mono font-black text-sky-900 bg-sky-100/80 px-2 py-0.5 rounded-md">
                {bodyWeightKg} kg
              </span>
            </div>
            <p className="text-[10px] text-stone-500 leading-normal">
              小柄な方ほど同じカフェイン摂取量で最高血中濃度（Cmax）が高くなります。
            </p>
            <div className="flex items-center space-x-2 pt-1">
              <input
                type="range"
                min="35"
                max="120"
                step="1"
                value={bodyWeightKg}
                onChange={(e) => onChangeBodyWeight && onChangeBodyWeight(Number(e.target.value))}
                className="flex-1 h-1.5 bg-stone-200 rounded-lg appearance-none cursor-pointer accent-sky-700"
              />
              <input
                type="number"
                min="30"
                max="150"
                value={bodyWeightKg}
                onChange={(e) => onChangeBodyWeight && onChangeBodyWeight(Number(e.target.value))}
                className="w-16 bg-white border border-stone-200 rounded-xl px-2 py-1 text-xs font-mono font-bold text-center text-stone-900 focus:outline-none focus:ring-2 focus:ring-sky-500/20"
              />
            </div>
          </div>

          {/* 4. 1杯を飲むのにかかる時間（デフォルト飲用時間） */}
          <div className="p-3.5 bg-stone-50/70 rounded-2xl border border-stone-200/80 space-y-1.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-1.5 font-black text-stone-800">
                <Clock className="w-4 h-4 text-amber-700" />
                <span>1杯を飲むのにかかる時間（デフォルト）</span>
              </div>
              <span className="text-[11px] font-mono font-black text-amber-900 bg-amber-100/80 px-2 py-0.5 rounded-md">
                {drinkingDurationMinutes} 分
              </span>
            </div>
            <p className="text-[10px] text-stone-500 leading-normal">
              ドリンク追加時の初期値です（個別パネル・記録の編集で10分〜24時間まで変更可能）。
            </p>
            <select
              value={drinkingDurationMinutes}
              onChange={(e) => onChangeDrinkingDuration && onChangeDrinkingDuration(Number(e.target.value))}
              className="w-full bg-white border border-stone-200 rounded-xl px-3 py-2 text-xs font-bold text-stone-900 focus:outline-none focus:ring-2 focus:ring-amber-500/20 cursor-pointer"
            >
              <option value={10}>10分（標準・マグカップ1杯）</option>
              <option value={20}>20分</option>
              <option value={30}>30分</option>
              <option value={40}>40分</option>
              <option value={50}>50分</option>
              <option value={60}>60分（1時間）</option>
            </select>
          </div>
        </div>

        {/* フッター */}
        <div className="p-4 border-t border-stone-100 bg-stone-50/50 flex items-center justify-end">
          <button
            type="button"
            onClick={onClose}
            className="w-full py-2.5 bg-[#3E271E] hover:bg-stone-800 active:scale-95 text-white text-xs font-bold rounded-xl shadow-xs transition-all cursor-pointer text-center"
          >
            設定を完了する
          </button>
        </div>
      </div>
    </div>
  );
};
