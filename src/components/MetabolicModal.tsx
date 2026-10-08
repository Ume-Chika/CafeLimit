import React from 'react';
import { X, Activity, Moon, Weight, Clock, Sliders, ChevronRight } from 'lucide-react';
import type { MetabolicSpeed } from '../types/caffeine';
import { minutesToTimeString, timeStringToMinutes, formatDurationDisplay } from '../utils/caffeineEngine';

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

  const speedDescriptions: Record<MetabolicSpeed, string> = {
    standard: '成人平均の代謝速度です。一般的な体質の方に推奨されます。',
    fast: '分解速度が速い体質です。喫煙習慣がある方など。',
    slow: '分解速度が遅い体質です。カフェインで眠れなくなりやすい方など。',
    custom: '半減期を1.0〜12.0時間の間で自由に微調整します。',
  };

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
              <p className="text-[11px] text-stone-500">体重・代謝速度・快眠基準・飲用時間</p>
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

        {/* 設定フォーム（身体プロファイル順：体重 ➔ 代謝 ➔ 快眠基準 ➔ 飲用時間） */}
        <div className="p-4 sm:p-5 space-y-3.5 text-xs">
          {/* 1. 体重 */}
          <div className="p-3 bg-stone-50/70 rounded-2xl border border-stone-200/80 space-y-1.5">
            <div className="flex items-center space-x-1.5 font-black text-stone-800">
              <Weight className="w-4 h-4 text-sky-700" />
              <span>体重</span>
            </div>
            <p className="text-[10px] text-stone-500 leading-normal">
              体重に応じて血中濃度スケールと快眠・警戒・集中ラインが連動します。
            </p>
            <div className="flex items-center space-x-2 pt-0.5">
              <input
                type="range"
                min="35"
                max="120"
                step="1"
                value={bodyWeightKg}
                onChange={(e) => onChangeBodyWeight && onChangeBodyWeight(Number(e.target.value))}
                className="flex-1 h-1.5 bg-stone-200 rounded-lg appearance-none cursor-pointer accent-sky-700"
              />
              <div className="flex items-center space-x-1 bg-white border border-stone-200 rounded-xl px-2 py-1">
                <input
                  type="number"
                  min="30"
                  max="150"
                  value={bodyWeightKg}
                  onChange={(e) => onChangeBodyWeight && onChangeBodyWeight(Number(e.target.value))}
                  className="w-10 text-xs font-mono font-bold text-center text-stone-900 focus:outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                />
                <span className="text-[11px] font-mono font-bold text-stone-500">kg</span>
              </div>
            </div>
          </div>

          {/* 2. 代謝体質 */}
          <div className="p-3 bg-stone-50/70 rounded-2xl border border-stone-200/80 space-y-1.5">
            <div className="flex items-center space-x-1.5 font-black text-stone-800">
              <Activity className="w-4 h-4 text-amber-800" />
              <span>代謝体質</span>
            </div>
            <p className="text-[10px] text-stone-500">
              {speedDescriptions[selectedSpeed]}
            </p>
            <select
              value={selectedSpeed}
              onChange={(e) => onChangeSpeed(e.target.value as MetabolicSpeed)}
              className="w-full bg-white border border-stone-200 rounded-xl px-3 py-2 text-xs font-bold text-stone-900 focus:outline-none focus:ring-2 focus:ring-amber-500/20 cursor-pointer"
            >
              <option value="standard">標準 4.0時間</option>
              <option value="fast">速い 2.5時間</option>
              <option value="slow">遅い 6.0時間</option>
              <option value="custom">カスタム自由指定</option>
            </select>

            {/* カスタム指定時のスライダー */}
            {selectedSpeed === 'custom' && (
              <div className="pt-2 mt-1 border-t border-stone-200/60 space-y-1.5 animate-fadeIn">
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
                  <span>1.0h 速い</span>
                  <span>4.0h 平均</span>
                  <span>12.0h 遅い</span>
                </div>
              </div>
            )}
          </div>

          {/* 3. 快眠安全基準 */}
          <div className="p-3 bg-stone-50/70 rounded-2xl border border-stone-200/80 space-y-1.5">
            <div className="flex items-center space-x-1.5 font-black text-stone-800">
              <Moon className="w-4 h-4 text-emerald-700" />
              <span>快眠安全基準</span>
            </div>
            <p className="text-[10px] text-stone-500">
              就寝時に目指す体内残存カフェインの上限です。
            </p>
            <select
              value={safeSleepThresholdMg || 25}
              onChange={(e) => onChangeSafeSleepThreshold(Number(e.target.value))}
              className="w-full bg-white border border-stone-200 rounded-xl px-3 py-2 text-xs font-bold text-stone-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 cursor-pointer"
            >
              <option value={15}>厳格 15mg以下</option>
              <option value={25}>標準 25mg以下（推奨）</option>
              <option value={35}>寛容 35mg以下</option>
              <option value={50}>高耐性 50mg以下</option>
            </select>
          </div>

          {/* 4. 飲むのにかかる時間 */}
          <div className="p-3 bg-stone-50/70 rounded-2xl border border-stone-200/80 space-y-1.5">
            <div className="flex items-center space-x-1.5 font-black text-stone-800">
              <Clock className="w-4 h-4 text-amber-700" />
              <span>飲むのにかかる時間</span>
            </div>
            <p className="text-[10px] text-stone-500 leading-normal">
              ドリンク追加時の初期値です。個別パネルや記録編集で変更できます。
            </p>
            <label
              htmlFor="metabolic-drinking-duration-input"
              className="relative flex items-center justify-between w-full bg-white border border-stone-200 rounded-xl px-3 py-2.5 text-xs font-bold text-stone-900 cursor-pointer hover:bg-stone-50 active:scale-[0.99] transition-all group shadow-2xs"
            >
              <div className="flex items-center space-x-2">
                <Clock className="w-3.5 h-3.5 text-stone-400 group-hover:rotate-12 transition-transform shrink-0" />
                <span className="text-stone-600 font-bold">飲む時間</span>
              </div>
              <div className="flex items-center space-x-1.5">
                <span className="font-mono font-black text-stone-900 bg-amber-50 text-amber-900 px-2 py-0.5 rounded-lg border border-amber-200/60">
                  {formatDurationDisplay(drinkingDurationMinutes)}
                </span>
                <ChevronRight className="w-3.5 h-3.5 text-stone-400 group-hover:translate-x-0.5 transition-transform shrink-0" />
              </div>

              {/* 透明なネイティブ time input */}
              <input
                id="metabolic-drinking-duration-input"
                type="time"
                value={minutesToTimeString(drinkingDurationMinutes)}
                onChange={(e) => onChangeDrinkingDuration && onChangeDrinkingDuration(timeStringToMinutes(e.target.value))}
                className="absolute inset-0 opacity-0 w-full h-full cursor-pointer z-10 pointer-events-auto"
                aria-label="飲むのにかかる時間を変更"
              />
            </label>
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
