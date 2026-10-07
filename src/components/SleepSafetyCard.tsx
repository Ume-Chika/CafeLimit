import React from 'react';
import { Moon, Coffee, Clock } from 'lucide-react';
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

export interface SleepSafetyCardHandle {
  openBedTimePicker: () => void;
}

export const SleepSafetyCard: React.FC<SleepSafetyCardProps> = ({
  summary,
  bedTime,
  onChangeBedTime,
  metabolicSpeed,
  onChangeMetabolicSpeed,
}) => {
  const { evaluation, bedCaffeineMg, maxSafePowderGrams, deadlineFor2g } = summary;
  const timeInputRef = React.useRef<HTMLInputElement>(null);

  // 0〜75mg を 0〜100% のゲージにマッピング
  const gaugePercent = Math.min(100, Math.max(0, (bedCaffeineMg / 75) * 100));

  const handleOpenBedTimePicker = () => {
    if (timeInputRef.current) {
      if (typeof timeInputRef.current.showPicker === 'function') {
        try {
          timeInputRef.current.showPicker();
        } catch {
          timeInputRef.current.focus();
        }
      } else {
        timeInputRef.current.focus();
      }
    }
  };

  return (
    <div id="sleep-safety-section" className="bg-white rounded-3xl shadow-sm border border-stone-200/90 overflow-hidden space-y-0">
      {/* 上部ヘッダー：設定コントロールバー */}
      <div className="bg-[#241C18] text-stone-200 px-4 sm:px-6 py-2.5 flex flex-wrap items-center justify-between gap-2.5">
        {/* 就寝時刻（タップでOS標準の直感的なタイムピッカーが起動） */}
        <div className="relative flex items-center">
          <button
            type="button"
            id="bedtime-picker-button"
            onClick={handleOpenBedTimePicker}
            className="flex items-center space-x-2 bg-stone-800/90 hover:bg-stone-700/90 active:scale-95 text-white px-3 py-1.5 rounded-xl border border-stone-700 transition-all cursor-pointer group shadow-xs"
            title="タップして就寝時刻を変更"
          >
            <Moon className="w-4 h-4 text-amber-400 group-hover:rotate-12 transition-transform" />
            <span className="text-xs text-stone-300 font-medium">就寝:</span>
            <span className="font-mono font-black text-sm text-amber-300 tracking-wide">{bedTime}</span>
            <span className="text-[10px] bg-stone-700 text-stone-300 px-1.5 py-0.5 rounded font-bold">変更</span>
          </button>

          {/* ネイティブ input (目立たないように配置しつつ確実にトリガー可能にする) */}
          <input
            ref={timeInputRef}
            type="time"
            value={bedTime}
            onChange={(e) => onChangeBedTime(e.target.value)}
            className="absolute inset-0 opacity-0 pointer-events-none w-full h-full"
            aria-label="就寝時刻"
          />
        </div>

        {/* 代謝体質 */}
        <div className="flex items-center space-x-2">
          <span className="text-xs font-medium text-stone-400">代謝:</span>
          <select
            value={metabolicSpeed}
            onChange={(e) => onChangeMetabolicSpeed(e.target.value as MetabolicSpeed)}
            className="bg-stone-800/90 hover:bg-stone-700/90 text-white text-xs font-bold px-2.5 py-1.5 rounded-xl border border-stone-700 focus:outline-none cursor-pointer transition-all"
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
