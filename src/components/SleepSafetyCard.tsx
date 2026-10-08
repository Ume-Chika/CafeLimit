import React from 'react';
import { Moon, Coffee, Clock, Activity, ChevronRight } from 'lucide-react';
import type { SimulationSummary, MetabolicSpeed, AppSettings, BeveragePreset } from '../types/caffeine';
import { METABOLIC_PROFILES } from '../types/caffeine';
import { format } from 'date-fns';

interface SleepSafetyCardProps {
  summary: SimulationSummary;
  bedTime: string; // "23:30" 形式
  onChangeBedTime: (timeStr: string) => void;
  metabolicSpeed: MetabolicSpeed;
  onOpenMetabolicModal: () => void;
  settings: AppSettings;
  targetPreset?: BeveragePreset;
}

export const SleepSafetyCard: React.FC<SleepSafetyCardProps> = ({
  summary,
  bedTime,
  onChangeBedTime,
  metabolicSpeed,
  onOpenMetabolicModal,
  settings,
  targetPreset,
}) => {
  const { evaluation, bedCaffeineMg, maxSafePowderGrams, maxSafeCaffeineMg, deadlineForTarget, targetPresetName } = summary;
  const currentProfile = METABOLIC_PROFILES[metabolicSpeed] || METABOLIC_PROFILES.standard;

  const safeTh = summary.safeSleepThresholdMg || 25;
  const maxScale = safeTh * 3;
  // 0〜maxScale を 0〜100% のゲージにマッピング
  const gaugePercent = Math.min(100, Math.max(0, (bedCaffeineMg / maxScale) * 100));

  // 「今飲める最大量」の表示文字列のフォーマット
  const renderMaxIntakeText = () => {
    if (maxSafeCaffeineMg <= 0) {
      return {
        main: '0',
        unit: settings.maxIntakeUnit === 'powder' ? 'g' : settings.maxIntakeUnit === 'caffeine' ? 'mg' : '杯/缶',
        sub: '（制限推奨）',
      };
    }

    if (settings.maxIntakeUnit === 'powder') {
      return {
        main: `${maxSafePowderGrams}`,
        unit: 'g',
        sub: `(約 ${Math.round(maxSafePowderGrams * 40)}mg)`,
      };
    }

    if (settings.maxIntakeUnit === 'caffeine') {
      return {
        main: `${maxSafeCaffeineMg}`,
        unit: 'mg',
        sub: `(粉末換算 約 ${(maxSafeCaffeineMg / 40).toFixed(1)}g)`,
      };
    }

    // preset（選択中ドリンク換算）
    const targetMg = targetPreset ? targetPreset.caffeineMg : 80;
    const count = (maxSafeCaffeineMg / targetMg).toFixed(1);
    const unitLabel = targetPreset?.category === 'energy' ? '缶' : '杯';
    return {
      main: `約 ${count}`,
      unit: unitLabel,
      sub: `(${targetPreset ? targetPreset.name : '標準2g'}換算)`,
    };
  };

  const maxIntakeData = renderMaxIntakeText();

  return (
    <div id="sleep-safety-section" className="bg-white rounded-3xl shadow-sm border border-stone-200/90 overflow-hidden space-y-0">
      {/* 上部ヘッダー：設定コントロールバー */}
      <div className="bg-[#241C18] text-stone-200 px-3.5 sm:px-6 py-2 flex items-center justify-between gap-2">
        {/* 就寝時刻（タップでOS標準の直感的なタイムピッカーが確実に起動） */}
        <label
          htmlFor="bedtime-picker-input"
          className="relative flex items-center space-x-1.5 bg-stone-800/90 hover:bg-stone-700/90 active:scale-95 text-white px-3 py-1.5 rounded-xl border border-stone-700 transition-all cursor-pointer group shadow-xs select-none shrink-0"
          title="タップして就寝時刻を変更"
        >
          <Moon className="w-3.5 h-3.5 text-amber-400 group-hover:rotate-12 transition-transform shrink-0" />
          <span className="text-[11px] text-stone-300 font-medium">就寝</span>
          <span className="font-mono font-black text-xs text-white tracking-wide">{bedTime}</span>
          <ChevronRight className="w-3.5 h-3.5 text-stone-400 group-hover:translate-x-0.5 transition-transform shrink-0" />

          {/* ネイティブ input を前面に透明で重ね、タップを100%直接検知 */}
          <input
            id="bedtime-picker-input"
            type="time"
            value={bedTime}
            onChange={(e) => onChangeBedTime(e.target.value)}
            className="absolute inset-0 opacity-0 w-full h-full cursor-pointer z-10 pointer-events-auto"
            aria-label="就寝時刻を変更"
          />
        </label>

        {/* シミュレーション・体質設定（体重・代謝速度） */}
        <button
          type="button"
          onClick={onOpenMetabolicModal}
          className="flex items-center space-x-1.5 bg-stone-800/90 hover:bg-stone-700/90 active:scale-95 text-white px-3 py-1.5 rounded-xl border border-stone-700 text-[11px] font-bold transition-all cursor-pointer group shadow-xs select-none truncate"
          title="タップして体重・体質・シミュレーション設定を変更"
        >
          <Activity className="w-3.5 h-3.5 text-amber-400 group-hover:rotate-12 transition-transform shrink-0" />
          <span className="text-stone-300 font-medium hidden xs:inline">体質・体重</span>
          <span className="font-mono font-bold text-white">{settings.bodyWeightKg ?? 60}kg</span>
          <span className="text-stone-500 font-normal">/</span>
          <span className="text-stone-200 font-bold">
            {metabolicSpeed === 'custom' ? `${settings.customHalfLifeHours.toFixed(1)}h` : currentProfile.label.split('（')[0]}
          </span>
          <ChevronRight className="w-3.5 h-3.5 text-stone-400 group-hover:translate-x-0.5 transition-transform shrink-0" />
        </button>
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
            <span className="text-emerald-700">{safeTh}mg (安全上限)</span>
            <span className="text-amber-700">{Number((safeTh * 2).toFixed(1))}mg (警戒)</span>
            <span className="text-red-700">&ge;{Number((safeTh * 3).toFixed(1))}mg</span>
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
                  {maxIntakeData.main} <span className="text-sm font-bold">{maxIntakeData.unit}</span>
                </span>
                <span className="text-[11px] font-semibold text-stone-600">
                  {maxIntakeData.sub}
                </span>
              </div>
            </div>
          </div>

          {/* 逆算②：指定ドリンクの最終時刻 */}
          <div className="bg-[#F0F5FA] rounded-2xl p-3.5 border border-sky-900/10 flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-sky-700 text-white flex items-center justify-center shrink-0 shadow-xs">
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[11px] font-bold text-stone-500 block line-clamp-1">
                {targetPresetName} 最終時刻
              </span>
              <div className="flex items-baseline space-x-1">
                <span className="text-xl font-black font-mono text-sky-950">
                  {format(deadlineForTarget, 'HH:mm')}
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
