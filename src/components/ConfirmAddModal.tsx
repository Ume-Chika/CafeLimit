import React from 'react';
import { X, Check, Clock, Plus } from 'lucide-react';
import type { BeveragePreset } from '../types/caffeine';
import { NescafeCoffeeCup } from './NescafeCoffeeCup';
import { formatDurationDisplay } from '../utils/caffeineEngine';
import { format, isToday, isTomorrow, isYesterday } from 'date-fns';

interface ConfirmAddModalProps {
  isOpen: boolean;
  preset: BeveragePreset | null;
  selectedTime: Date;
  onConfirm: () => void;
  onClose: () => void;
  defaultDrinkingDuration?: number;
}

export const ConfirmAddModal: React.FC<ConfirmAddModalProps> = ({
  isOpen,
  preset,
  selectedTime,
  onConfirm,
  onClose,
  defaultDrinkingDuration = 10,
}) => {
  if (!isOpen || !preset) return null;

  const getDateLabel = () => {
    if (isToday(selectedTime)) return '今日';
    if (isTomorrow(selectedTime)) return '明日';
    if (isYesterday(selectedTime)) return '昨日';
    return format(selectedTime, 'M/d');
  };

  const duration = preset.drinkingDurationMinutes || defaultDrinkingDuration;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-stone-900/60 backdrop-blur-xs animate-fadeIn overscroll-contain"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl shadow-xl border border-stone-200 w-full max-w-sm max-h-[85dvh] flex flex-col overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* ヘッダー */}
        <div className="shrink-0 px-4 py-3 border-b border-stone-100 flex items-center justify-between bg-white z-10">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 rounded-lg bg-[#FAF7F2] text-[#3E2718] border border-stone-200/70 flex items-center justify-center">
              <Plus className="w-4 h-4" />
            </div>
            <h3 className="text-xs font-semibold text-stone-900">摂取記録の確認</h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-lg hover:bg-stone-100 text-stone-400 hover:text-stone-700 flex items-center justify-center cursor-pointer transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#3E2718]"
            aria-label="閉じる"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* コンテンツ */}
        <div className="flex-1 overflow-y-auto p-5 flex flex-col items-center text-center space-y-3.5 overscroll-contain">
          {/* ドリンクグラフィック */}
          <div className="py-2 scale-110">
            <NescafeCoffeeCup
              color={preset.color}
              category={preset.category}
              size="md"
            />
          </div>

          <div>
            <h4 className="text-sm font-bold text-stone-900">{preset.name}</h4>
            <div className="flex items-center justify-center space-x-1.5 mt-1 text-xs font-mono tabular-nums text-stone-500">
              {preset.isNescafeNative && preset.powderGrams && (
                <span className="bg-stone-100 px-1.5 py-0.5 rounded text-stone-600">
                  粉末 {preset.powderGrams}g
                </span>
              )}
              {preset.volumeMl && (
                <span className="bg-stone-100 px-1.5 py-0.5 rounded text-stone-600">
                  {preset.volumeMl}ml
                </span>
              )}
              <span className="font-semibold text-[#3E2718] bg-stone-100 px-2 py-0.5 rounded border border-stone-200/60">
                +{preset.caffeineMg} mg
              </span>
            </div>
          </div>

          {/* 摂取予定時刻 & 飲用時間 */}
          <div className="w-full bg-[#FAF7F2] border border-stone-200/70 rounded-xl p-3 space-y-2 text-xs">
            <div className="flex items-center justify-between px-1 text-stone-600">
              <span className="flex items-center space-x-1.5">
                <Clock className="w-3.5 h-3.5 text-stone-400" />
                <span className="font-medium">摂取開始</span>
              </span>
              <span className="font-mono font-bold text-stone-900 tabular-nums">
                {getDateLabel()} {format(selectedTime, 'HH:mm')}
              </span>
            </div>
            <div className="flex items-center justify-between px-1 text-stone-600 border-t border-stone-200/60 pt-2">
              <span className="font-medium">飲用ペース</span>
              <span className="font-medium text-stone-700 bg-white px-2 py-0.5 rounded border border-stone-200/60 text-[11px]">
                約 {formatDurationDisplay(duration)} かけて飲む
              </span>
            </div>
          </div>
        </div>

        {/* ボタンフッター：ネスカフェアプリ風の赤色CTA */}
        <div className="shrink-0 p-4 bg-stone-50/70 border-t border-stone-100 grid grid-cols-2 gap-2.5 z-10">
          <button
            type="button"
            onClick={onClose}
            className="py-2.5 rounded-xl border border-stone-200 hover:bg-stone-100 text-stone-700 font-medium text-xs active:scale-98 transition-all cursor-pointer"
          >
            キャンセル
          </button>
          <button
            type="button"
            onClick={() => {
              onConfirm();
              onClose();
            }}
            className="py-2.5 rounded-xl bg-[#D8232A] hover:bg-[#C01E24] text-white font-semibold text-xs active:scale-98 shadow-xs transition-all flex items-center justify-center space-x-1 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-600"
          >
            <Check className="w-4 h-4" />
            <span>記録を追加</span>
          </button>
        </div>
      </div>
    </div>
  );
};
