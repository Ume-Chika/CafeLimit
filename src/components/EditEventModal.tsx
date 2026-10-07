import React, { useState } from 'react';
import { X, Trash2, Check, Clock, Coffee } from 'lucide-react';
import type { IntakeEvent } from '../types/caffeine';
import { format } from 'date-fns';

interface EditEventModalProps {
  isOpen: boolean;
  event: IntakeEvent | null;
  onClose: () => void;
  onUpdateEvent: (updatedEvent: IntakeEvent) => void;
  onDeleteEvent: (id: string) => void;
}

export const EditEventModal: React.FC<EditEventModalProps> = ({
  isOpen,
  event,
  onClose,
  onUpdateEvent,
  onDeleteEvent,
}) => {
  if (!isOpen || !event) return null;

  return (
    <EditEventModalContent
      key={event.id}
      event={event}
      onClose={onClose}
      onUpdateEvent={onUpdateEvent}
      onDeleteEvent={onDeleteEvent}
    />
  );
};

interface EditEventModalContentProps {
  event: IntakeEvent;
  onClose: () => void;
  onUpdateEvent: (updatedEvent: IntakeEvent) => void;
  onDeleteEvent: (id: string) => void;
}

const EditEventModalContent: React.FC<EditEventModalContentProps> = ({
  event,
  onClose,
  onUpdateEvent,
  onDeleteEvent,
}) => {
  const [timeStr, setTimeStr] = useState(() => format(new Date(event.timestamp), 'HH:mm'));
  const [caffeineMg, setCaffeineMg] = useState(() => event.caffeineMg);
  const [powderGrams, setPowderGrams] = useState(() => event.powderGrams ?? 2.0);
  const [name, setName] = useState(() => event.name);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    const [hStr, mStr] = timeStr.split(':');
    const updatedDate = new Date(event.timestamp);
    updatedDate.setHours(parseInt(hStr, 10), parseInt(mStr, 10), 0, 0);

    const updated: IntakeEvent = {
      ...event,
      name,
      timestamp: updatedDate.toISOString(),
      caffeineMg: Number(caffeineMg),
      powderGrams: event.category === 'nescafe' ? Number(powderGrams) : event.powderGrams,
    };

    onUpdateEvent(updated);
    onClose();
  };

  const handleDelete = () => {
    onDeleteEvent(event.id);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/60 backdrop-blur-xs animate-fadeIn">
      <div
        className="bg-white rounded-3xl shadow-xl border border-stone-200 w-full max-w-sm overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* ヘッダー */}
        <div className="p-4 border-b border-stone-100 flex items-center justify-between bg-stone-50/60">
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
        <form onSubmit={handleSave} className="p-5 space-y-4 text-xs">
          {/* 摂取時刻 */}
          <div>
            <label className="block text-stone-600 font-bold mb-1 flex items-center space-x-1">
              <Clock className="w-3.5 h-3.5 text-stone-400" />
              <span>摂取時刻</span>
            </label>
            <input
              type="time"
              required
              value={timeStr}
              onChange={(e) => setTimeStr(e.target.value)}
              className="w-full bg-stone-50 border border-stone-200 rounded-xl px-3 py-2 font-mono font-bold text-stone-900 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/20"
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
