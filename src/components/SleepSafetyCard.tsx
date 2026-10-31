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
        sub: '制限推奨',
      };
    }

    if (settings.maxIntakeUnit === 'powder') {
      return {
        main: `${maxSafePowderGrams}`,
        unit: 'g',
        sub: `約 ${Math.round(maxSafePowderGrams * 40)}mg`,
      };
    }

    if (settings.maxIntakeUnit === 'caffeine') {
      return {
        main: `${maxSafeCaffeineMg}`,
        unit: 'mg',
        sub: `粉末換算 約 ${(maxSafeCaffeineMg / 40).toFixed(1)}g`,
      };
    }

    // preset（選択中ドリンク換算）
    const targetMg = targetPreset ? targetPreset.caffeineMg : 80;
    const count = (maxSafeCaffeineMg / targetMg).toFixed(1);
    const unitLabel = targetPreset?.category === 'energy' ? '缶' : '杯';
    return {
      main: `約 ${count}`,
      unit: unitLabel,
      sub: `${targetPreset ? targetPreset.name : '標準2g'}換算`,
    };
  };

  const maxIntakeData = renderMaxIntakeText();

  return (
    <div id="sleep-safety-section" className="bg-white rounded-2xl shadow-xs border border-stone-200/80 overflow-hidden space-y-0">
      {/* 上部ヘッダー：設定コントロールバー */}
      <div className="bg-[#3E2718] text-stone-200 px-4 sm:px-5 py-2.5 flex items-center justify-between gap-2">
        {/* 就寝時刻 */}
        <label
          htmlFor="bedtime-picker-input"
          className="relative flex items-center space-x-1.5 bg-white/10 hover:bg-white/15 active:scale-98 text-white px-3 py-1.5 rounded-lg border border-white/10 transition-colors cursor-pointer group select-none shrink-0"
          title="タップして就寝時刻を変更"
        >
          <Moon className="w-3.5 h-3.5 text-amber-300 shrink-0" />
          <span className="text-xs text-stone-300 font-medium">就寝</span>
          <span className="font-mono font-semibold text-xs text-white tracking-wide tabular-nums">{bedTime}</span>
          <ChevronRight className="w-3.5 h-3.5 text-stone-400 shrink-0" />

          {/* ネイティブ input を前面に透明で重ね、タップを確実に検知 */}
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
          className="flex items-center space-x-1.5 bg-white/10 hover:bg-white/15 active:scale-98 text-white px-3 py-1.5 rounded-lg border border-white/10 text-xs font-medium transition-colors cursor-pointer select-none truncate"
          title="タップして体重・体質・シミュレーション設定を変更"
        >
          <Activity className="w-3.5 h-3.5 text-amber-300 shrink-0" />
          <span className="text-stone-300 font-medium hidden xs:inline">体質</span>
          <span className="font-mono font-semibold text-white tabular-nums">{settings.bodyWeightKg ?? 60}kg</span>
          <span className="text-stone-400 font-normal">/</span>
          <span className="text-stone-200 font-medium">
            {metabolicSpeed === 'custom' ? `${settings.customHalfLifeHours.toFixed(1)}h` : currentProfile.label.split('（')[0]}
          </span>
          <ChevronRight className="w-3.5 h-3.5 text-stone-400 shrink-0" />
        </button>
      </div>

      {/* メインステータスエリア */}
      <div className="p-4 sm:p-5 space-y-4">
        {/* 判定カード */}
        <div
          className="rounded-xl p-4 sm:p-4.5 border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3"
          style={{
            backgroundColor: evaluation.bgColor,
            borderColor: evaluation.borderColor,
          }}
        >
          <div>
            <div className="flex items-center space-x-2">
              <span
                className="font-semibold text-xs px-2 py-0.5 rounded-md tracking-wide text-white"
                style={{ backgroundColor: evaluation.color }}
              >
                {evaluation.status}
              </span>
              <h3 className="font-bold text-stone-900 text-base">
                {evaluation.label}
              </h3>
            </div>
            <p className="text-xs text-stone-600 mt-1 leading-relaxed">
              {evaluation.description}
            </p>
          </div>

          <div className="flex items-baseline space-x-1 sm:text-right shrink-0">
            <span className="text-xs text-stone-500 mr-1 sm:hidden">就寝時残存:</span>
            <span
              className="text-3xl font-bold font-mono tracking-tight tabular-nums"
              style={{ color: evaluation.color }}
            >
              {bedCaffeineMg}
            </span>
            <span className="text-xs font-semibold text-stone-500">mg</span>
          </div>
        </div>

        {/* ゲージメーター */}
        <div className="space-y-1.5">
          <div className="h-2 w-full bg-stone-100 rounded-full overflow-hidden flex">
            <div
              className="h-full rounded-full transition-[width] duration-300 ease-out"
              style={{
                width: `${gaugePercent}%`,
                backgroundColor: evaluation.color,
              }}
            />
          </div>
          <div className="flex justify-between text-[10px] font-mono tabular-nums text-stone-500 px-0.5">
            <span>0mg 快眠</span>
            <span>{safeTh}mg 閾値</span>
            <span>{Number((safeTh * 2).toFixed(1))}mg 警戒</span>
            <span>&ge;{Number((safeTh * 3).toFixed(1))}mg</span>
          </div>
        </div>

        {/* 2つの逆算インサイト */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-0.5">
          {/* 逆算①：今飲める最大量 */}
          <div className="bg-[#FAF7F2] rounded-xl p-3.5 border border-stone-200/70 flex items-center space-x-3">
            <div className="w-10 h-10 rounded-lg bg-[#3E2718] text-white flex items-center justify-center shrink-0 shadow-xs">
              <Coffee className="w-5 h-5 text-amber-200" />
            </div>
            <div className="min-w-0">
              <span className="text-xs text-stone-500 font-medium block">今飲める最大量</span>
              <div className="flex items-baseline space-x-1.5">
                <span className="text-lg font-bold font-mono tabular-nums text-stone-900">
                  {maxIntakeData.main} <span className="text-xs font-normal text-stone-600">{maxIntakeData.unit}</span>
                </span>
                <span className="text-xs text-stone-500 font-normal truncate">
                  {maxIntakeData.sub}
                </span>
              </div>
            </div>
          </div>

          {/* 逆算②：指定ドリンクの最終時刻 */}
          <div className={`${summary.isDeadlinePassed ? 'bg-stone-50 border-stone-200/70' : 'bg-[#FAF7F2] border-stone-200/70'} rounded-xl p-3.5 border flex items-center space-x-3 transition-colors`}>
            <div className={`w-10 h-10 rounded-lg ${summary.isDeadlinePassed ? 'bg-stone-300' : 'bg-[#3E2718]'} text-white flex items-center justify-center shrink-0 shadow-xs transition-colors`}>
              <Clock className="w-5 h-5 text-amber-200" />
            </div>
            <div className="min-w-0">
              <span className="text-xs text-stone-500 font-medium block truncate">
                {targetPresetName} 最終時刻
              </span>
              <div className="flex items-baseline space-x-1.5">
                <span className={`text-lg font-bold font-mono tabular-nums ${summary.isDeadlinePassed ? 'text-stone-400' : 'text-stone-900'}`}>
                  {summary.isDeadlinePassed ? '--:--' : format(deadlineForTarget, 'HH:mm')}
                </span>
                {!summary.isDeadlinePassed && (
                  <span className="text-xs text-stone-500 font-normal">まで</span>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
