import React, { useState } from 'react';
import { X, Trash2, Check, Coffee, Clock, ChevronRight } from 'lucide-react';
import type { IntakeEvent } from '../types/caffeine';
import { TimeSliderPicker } from './TimeSliderPicker';
import { minutesToTimeString, timeStringToMinutes, formatDurationDisplay } from '../utils/caffeineEngine';

interface EditEventModalProps {
  isOpen: boolean;
  event: IntakeEvent | null;
  onClose: () => void;
  onUpdateEvent: (updatedEvent: IntakeEvent) => void;
  onDeleteEvent: (id: string) => void;
  defaultDrinkingDuration?: number;
}

export const EditEventModal: React.FC<EditEventModalProps> = ({
  isOpen,
  event,
  onClose,
  onUpdateEvent,
  onDeleteEvent,
  defaultDrinkingDuration = 10,
}) => {
  if (!isOpen || !event) return null;

  return (
    <EditEventModalContent
      key={event.id}
      event={event}
      onClose={onClose}
      onUpdateEvent={onUpdateEvent}
      onDeleteEvent={onDeleteEvent}
      defaultDrinkingDuration={defaultDrinkingDuration}
    />
  );
};

interface EditEventModalContentProps {
  event: IntakeEvent;
  onClose: () => void;
  onUpdateEvent: (updatedEvent: IntakeEvent) => void;
  onDeleteEvent: (id: string) => void;
  defaultDrinkingDuration?: number;
}

const EditEventModalContent: React.FC<EditEventModalContentProps> = ({
  event,
  onClose,
  onUpdateEvent,
  onDeleteEvent,
  defaultDrinkingDuration = 10,
}) => {
  const [selectedTime, setSelectedTime] = useState<Date>(() => new Date(event.timestamp));
  const [caffeineMg, setCaffeineMg] = useState(() => event.caffeineMg);
  const [powderGrams, setPowderGrams] = useState(() => event.powderGrams ?? 2.0);
  const [name, setName] = useState(() => event.name);
  const [drinkingDurationMinutes, setDrinkingDurationMinutes] = useState<number>(
    () => event.drinkingDurationMinutes ?? defaultDrinkingDuration
  );

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();

    const updated: IntakeEvent = {
      ...event,
      name,
      timestamp: selectedTime.toISOString(),
      caffeineMg: Number(caffeineMg),
      powderGrams: event.category === 'nescafe' ? Number(powderGrams) : event.powderGrams,
      drinkingDurationMinutes: Number(drinkingDurationMinutes),
    };

    onUpdateEvent(updated);
    onClose();
  };

  const handleDelete = () => {
    onDeleteEvent(event.id);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-stone-900/60 backdrop-blur-xs animate-fadeIn">
      <div
        className="bg-white rounded-3xl shadow-xl border border-stone-200 w-full max-w-md max-h-[90vh] overflow-y-auto flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* ヘッダー */}
        <div className="p-4 border-b border-stone-100 flex items-center justify-between bg-stone-50/60 sticky top-0 bg-white/95 backdrop-blur-xs z-10">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 rounded-xl bg-amber-700 text-white flex items-center justify-center shadow-xs">
              <Coffee className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-black text-stone-900">摂取記録の編集</h3>
              <p className="text-[11px] text-stone-500">{event.name}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-7 h-7 rounded-full hover:bg-stone-200 text-stone-400 hover:text-stone-700 flex items-center justify-center cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* フォーム */}
        <form onSubmit={handleSave} className="p-4 sm:p-5 space-y-4 text-xs">
          {/* 摂取時刻スライダー（メイン画面と完全統一） */}
          <div className="space-y-1">
            <TimeSliderPicker
              selectedTime={selectedTime}
              onChangeTime={setSelectedTime}
              baseTime={new Date(event.timestamp)}
            />
          </div>

          {/* ドリンク名 */}
          <div>
            <label className="block text-stone-600 font-bold mb-1">飲料名</label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full bg-stone-50 border border-stone-200 rounded-xl px-3 py-2 font-bold text-stone-900 focus:outline-none focus:ring-2 focus:ring-amber-500/20"
            />
          </div>

          {/* カフェイン量 / 粉末量 */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-stone-600 font-bold mb-1">カフェイン (mg)</label>
              <input
                type="number"
                required
                min="0"
                max="500"
                value={caffeineMg}
                onChange={(e) => setCaffeineMg(Number(e.target.value))}
                className="w-full bg-stone-50 border border-stone-200 rounded-xl px-3 py-2 font-mono font-bold text-stone-900 focus:outline-none"
              />
            </div>
            {event.category === 'nescafe' && (
              <div>
                <label className="block text-stone-600 font-bold mb-1">粉末量 (g)</label>
                <input
                  type="number"
                  step="0.1"
                  min="0"
                  max="20"
                  value={powderGrams}
                  onChange={(e) => {
                    const g = Number(e.target.value);
                    setPowderGrams(g);
                    setCaffeineMg(Math.round(g * 40));
                  }}
                  className="w-full bg-stone-50 border border-stone-200 rounded-xl px-3 py-2 font-mono font-bold text-stone-900 focus:outline-none"
                />
              </div>
            )}
          </div>

          {/* 飲むのにかかる時間 */}
          <div>
            <label className="block text-stone-700 font-bold mb-1">飲むのにかかる時間</label>
            <label
              htmlFor="event-drinking-duration-input"
              className="relative flex items-center justify-between w-full bg-stone-50 border border-stone-200 rounded-xl px-3 py-2.5 font-bold text-stone-900 cursor-pointer hover:bg-stone-100/80 active:scale-[0.99] transition-all group shadow-2xs"
            >
              <div className="flex items-center space-x-2">
                <Clock className="w-3.5 h-3.5 text-stone-400 group-hover:rotate-12 transition-transform shrink-0" />
                <span className="text-stone-600 font-bold">飲む時間</span>
              </div>
              <div className="flex items-center space-x-1.5">
                <span className="font-mono font-black text-stone-900 bg-white px-2 py-0.5 rounded-lg border border-stone-200 shadow-2xs">
                  {formatDurationDisplay(drinkingDurationMinutes)}
                </span>
                <ChevronRight className="w-3.5 h-3.5 text-stone-400 group-hover:translate-x-0.5 transition-transform shrink-0" />
              </div>

              {/* 透明なネイティブ time input */}
              <input
                id="event-drinking-duration-input"
                type="time"
                value={minutesToTimeString(drinkingDurationMinutes)}
                onChange={(e) => setDrinkingDurationMinutes(timeStringToMinutes(e.target.value))}
                className="absolute inset-0 opacity-0 w-full h-full cursor-pointer z-10 pointer-events-auto"
                aria-label="飲むのにかかる時間を変更"
              />
            </label>
          </div>

          {/* ボタンエリア */}
          <div className="pt-2 flex items-center space-x-2">
            <button
              type="button"
              onClick={handleDelete}
              className="px-3 py-2.5 rounded-xl border border-red-200 bg-red-50 hover:bg-red-100 text-red-600 font-bold transition-all flex items-center justify-center cursor-pointer"
              title="削除"
            >
              <Trash2 className="w-4 h-4" />
            </button>
            <button
              type="submit"
              className="flex-1 py-2.5 rounded-xl bg-amber-800 hover:bg-amber-900 text-white font-bold transition-all shadow-xs flex items-center justify-center space-x-1 cursor-pointer"
            >
              <Check className="w-4 h-4" />
              <span>変更を保存</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
