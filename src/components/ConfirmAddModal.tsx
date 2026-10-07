import React from 'react';
import { X, Check, Clock, Plus } from 'lucide-react';
import type { BeveragePreset } from '../types/caffeine';
import { NescafeCoffeeCup } from './NescafeCoffeeCup';
import { format, isToday, isTomorrow, isYesterday } from 'date-fns';

interface ConfirmAddModalProps {
  isOpen: boolean;
  preset: BeveragePreset | null;
  selectedTime: Date;
  onConfirm: () => void;
  onClose: () => void;
}

export const ConfirmAddModal: React.FC<ConfirmAddModalProps> = ({
  isOpen,
  preset,
  selectedTime,
  onConfirm,
  onClose,
}) => {
  if (!isOpen || !preset) return null;

  const getDateLabel = () => {
    if (isToday(selectedTime)) return '今日';
    if (isTomorrow(selectedTime)) return '明日';
    if (isYesterday(selectedTime)) return '昨日';
    return format(selectedTime, 'M/d');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/60 backdrop-blur-xs animate-fadeIn">
      <div
        className="bg-white rounded-3xl shadow-xl border border-stone-200 w-full max-w-sm overflow-hidden flex flex-col animate-scaleUp"
        onClick={(e) => e.stopPropagation()}
      >
        {/* ヘッダー */}
        <div className="p-4 border-b border-stone-100 flex items-center justify-between bg-stone-50/60">
          <div className="flex items-center space-x-2">
            <div className="w-7 h-7 rounded-xl bg-amber-100 text-amber-900 flex items-center justify-center">
              <Plus className="w-4 h-4" />
            </div>
            <h3 className="text-xs font-black text-stone-900">摂取記録の確認</h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-7 h-7 rounded-full hover:bg-stone-200 text-stone-400 hover:text-stone-700 flex items-center justify-center cursor-pointer transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* コンテンツ */}
        <div className="p-5 flex flex-col items-center text-center space-y-3">
          {/* ドリンクグラフィック */}
          <div className="py-2 scale-110">
            <NescafeCoffeeCup
              color={preset.color}
              category={preset.category}
              size="md"
            />
          </div>

          <div>
            <h4 className="text-sm font-black text-stone-900">{preset.name}</h4>
            <div className="flex items-center justify-center space-x-1.5 mt-1">
              {preset.isNescafeNative && preset.powderGrams && (
                <span className="text-[11px] font-bold text-stone-500">
                  粉末 {preset.powderGrams}g
                </span>
              )}
              {preset.volumeMl && (
                <span className="text-[11px] font-bold text-stone-500">
                  {preset.volumeMl}ml
                </span>
              )}
              <span className="text-xs font-black font-mono text-amber-900 bg-amber-100 px-2 py-0.5 rounded-lg border border-amber-200/60">
                +{preset.caffeineMg} mg
              </span>
            </div>
          </div>

          {/* 摂取予定時刻バッジ */}
          <div className="w-full bg-stone-50 border border-stone-200 rounded-2xl p-2.5 flex items-center justify-center space-x-2 text-xs">
            <Clock className="w-3.5 h-3.5 text-stone-400" />
            <span className="text-stone-500 font-bold">摂取時刻:</span>
            <span className="font-mono font-black text-stone-900">
              {getDateLabel()} {format(selectedTime, 'HH:mm')}
            </span>
          </div>
        </div>

        {/* ボタンフッター */}
        <div className="p-4 bg-stone-50 border-t border-stone-100 grid grid-cols-2 gap-2.5">
          <button
            type="button"
            onClick={onClose}
            className="py-2.5 rounded-xl border border-stone-300 hover:bg-stone-200/60 text-stone-700 font-bold text-xs active:scale-95 transition-all cursor-pointer"
          >
            キャンセル
          </button>
          <button
            type="button"
            onClick={() => {
              onConfirm();
              onClose();
            }}
            className="py-2.5 rounded-xl bg-[#3E271E] hover:bg-stone-800 text-white font-black text-xs active:scale-95 shadow-xs transition-all flex items-center justify-center space-x-1 cursor-pointer"
          >
            <Check className="w-4 h-4" />
            <span>記録を追加</span>
          </button>
        </div>
      </div>
    </div>
  );
};
