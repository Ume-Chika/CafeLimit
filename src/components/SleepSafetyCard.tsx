import React, { useState } from 'react';
import { Moon, Coffee, Clock, ChevronDown } from 'lucide-react';
import type { SimulationSummary, MetabolicSpeed } from '../types/caffeine';
import { METABOLIC_PROFILES } from '../types/caffeine';
import { format } from 'date-fns';

interface SleepSafetyCardProps {
  summary: SimulationSummary;
  bedTime: string; // "23:30" 形式
  onChangeBedTime: (timeStr: string) => void;
  metabolicSpeed: MetabolicSpeed;
  onChangeMetabolicSpeed: (speed: MetabolicSpeed) => void;
}

const COMMON_BED_TIMES = ['22:00', '22:30', '23:00', '23:30', '00:00', '00:30', '01:00', '01:30', '02:00'];

export const SleepSafetyCard: React.FC<SleepSafetyCardProps> = ({
  summary,
  bedTime,
  onChangeBedTime,
  metabolicSpeed,
  onChangeMetabolicSpeed,
}) => {
  const { evaluation, bedCaffeineMg, maxSafePowderGrams, deadlineFor2g } = summary;
  const [showBedTimePicker, setShowBedTimePicker] = useState(false);

  // 0〜75mg を 0〜100% のゲージにマッピング
  const gaugePercent = Math.min(100, Math.max(0, (bedCaffeineMg / 75) * 100));

  const handleSelectQuickBedTime = (time: string) => {
    onChangeBedTime(time);
    setShowBedTimePicker(false);
  };

  return (
    <div id="sleep-safety-section" className="bg-white rounded-3xl shadow-sm border border-stone-200/90 overflow-hidden space-y-0">
      {/* 上部ヘッダー：設定コントロールバー */}
      <div className="bg-[#241C18] text-stone-200 px-4 sm:px-6 py-3 flex flex-wrap items-center justify-between gap-2.5">
        {/* 就寝時刻（タップでスマホ最適化クイックセレクターが開く） */}
        <div className="relative">
          <button
            type="button"
            onClick={() => setShowBedTimePicker(!showBedTimePicker)}
            className="flex items-center space-x-2 bg-stone-800/90 hover:bg-stone-800 text-white px-3 py-1.5 rounded-xl border border-stone-700 transition-all cursor-pointer active:scale-95"
          >
            <Moon className="w-3.5 h-3.5 text-amber-400" />
            <span className="text-xs text-stone-300">就寝:</span>
            <span className="font-mono font-bold text-sm text-white">{bedTime}</span>
            <ChevronDown className="w-3.5 h-3.5 text-stone-400" />
          </button>

          {/* スマホ最適化 就寝時刻クイックピッカー */}
          {showBedTimePicker && (
            <div className="absolute top-full left-0 mt-2 z-50 bg-stone-900 border border-stone-700 p-3 rounded-2xl shadow-xl w-64 space-y-2 animate-fadeIn">
              <div className="flex items-center justify-between text-xs text-stone-400 font-bold border-b border-stone-800 pb-1.5">
                <span>就寝予定時刻を選択</span>
                <button
                  type="button"
                  onClick={() => setShowBedTimePicker(false)}
                  className="text-stone-400 hover:text-white"
                >
                  ✕
                </button>
              </div>

              {/* よく使われる時刻のクイックピル */}
              <div className="grid grid-cols-3 gap-1.5">
                {COMMON_BED_TIMES.map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => handleSelectQuickBedTime(t)}
                    className={`py-1 text-xs font-mono font-bold rounded-lg border transition-all ${
                      bedTime === t
                        ? 'bg-amber-600 text-white border-amber-500 shadow-xs'
                        : 'bg-stone-800 text-stone-300 border-stone-700 hover:bg-stone-700'
                    }`}
                  >
                    {t}
                  </button>
                ))}
              </div>

              {/* カスタム時間入力 */}
              <div className="pt-1.5 border-t border-stone-800 flex items-center justify-between">
                <span className="text-[11px] text-stone-400">詳細指定:</span>
                <input
                  type="time"
                  value={bedTime}
                  onChange={(e) => onChangeBedTime(e.target.value)}
                  className="bg-stone-800 text-white text-xs font-mono font-bold px-2 py-1 rounded-lg border border-stone-700 focus:outline-none"
                />
              </div>
            </div>
          )}
        </div>

        {/* 代謝体質 */}
        <div className="flex items-center space-x-2">
          <select
            value={metabolicSpeed}
            onChange={(e) => onChangeMetabolicSpeed(e.target.value as MetabolicSpeed)}
            className="bg-stone-800/90 hover:bg-stone-800 text-white text-xs font-bold px-2.5 py-1.5 rounded-xl border border-stone-700 focus:outline-none cursor-pointer"
          >
            {Object.values(METABOLIC_PROFILES).map((profile) => (
              <option key={profile.type} value={profile.type}>
                {profile.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* メインステータスエリア */}
      <div className="p-4 sm:p-6 space-y-4">
        {/* 判定カード */}
        <div
          className="rounded-2xl p-4 sm:p-5 border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3"
          style={{
            backgroundColor: evaluation.bgColor,
            borderColor: evaluation.borderColor,
          }}
        >
          <div>
            <div className="flex items-center space-x-2">
              <span
                className="font-black text-[11px] px-2.5 py-0.5 rounded-full uppercase tracking-wider text-white"
                style={{ backgroundColor: evaluation.color }}
              >
                {evaluation.status}
              </span>
              <h3 className="font-black text-stone-900 text-base sm:text-lg">
                {evaluation.label}
              </h3>
            </div>
            <p className="text-xs text-stone-600 mt-1">
              {evaluation.description}
            </p>
          </div>

          <div className="flex items-baseline space-x-1 sm:text-right">
            <span className="text-xs font-bold text-stone-500 mr-1 sm:hidden">就寝時残存:</span>
            <span
              className="text-3xl font-black font-mono tracking-tight"
              style={{ color: evaluation.color }}
            >
              {bedCaffeineMg}
            </span>
            <span className="text-xs font-bold text-stone-600">mg</span>
          </div>
        </div>

        {/* ゲージメーター */}
        <div className="space-y-1">
          <div className="h-2 w-full bg-stone-100 rounded-full overflow-hidden flex">
            <div
              className="h-full rounded-full transition-all duration-500 ease-out"
              style={{
                width: `${gaugePercent}%`,
                backgroundColor: evaluation.color,
              }}
            />
          </div>
          <div className="flex justify-between text-[10px] font-bold text-stone-600 px-0.5">
            <span className="text-emerald-700">0mg (快眠)</span>
            <span className="text-emerald-700">25mg (安全上限)</span>
            <span className="text-amber-700">50mg (警告境界)</span>
            <span className="text-red-700">75mg+</span>
          </div>
        </div>

        {/* 2つの逆算インサイト */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
          {/* 逆算①：今飲める最大量 */}
          <div className="bg-[#FAF7F2] rounded-2xl p-3.5 border border-amber-900/10 flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-[#3E271E] text-white flex items-center justify-center shrink-0 shadow-xs">
              <Coffee className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[11px] font-bold text-stone-500 block">今飲める最大量</span>
              <div className="flex items-baseline space-x-1">
                <span className="text-xl font-black font-mono text-[#3E271E]">
                  {maxSafePowderGrams > 0 ? `${maxSafePowderGrams} g` : '0 g'}
                </span>
                <span className="text-[11px] font-semibold text-stone-600">
                  {maxSafePowderGrams > 0 ? `(約 ${Math.round(maxSafePowderGrams * 40)}mg)` : '（制限推奨）'}
                </span>
              </div>
            </div>
          </div>

          {/* 逆算②：標準2gのデッドライン */}
          <div className="bg-[#F0F5FA] rounded-2xl p-3.5 border border-sky-900/10 flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-sky-700 text-white flex items-center justify-center shrink-0 shadow-xs">
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[11px] font-bold text-stone-500 block">標準2g (80mg) 最終時刻</span>
              <div className="flex items-baseline space-x-1">
                <span className="text-xl font-black font-mono text-sky-950">
                  {format(deadlineFor2g, 'HH:mm')}
                </span>
                <span className="text-[11px] font-semibold text-stone-600">まで</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
