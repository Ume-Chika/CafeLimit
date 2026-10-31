import React from 'react';
import type { IntakeEvent } from '../types/caffeine';
import { format, isToday, isYesterday } from 'date-fns';
import { ja } from 'date-fns/locale';
import { Trash2, History, Coffee, Zap, Droplets, Sparkles, Edit2 } from 'lucide-react';

interface TimelineListProps {
  events: IntakeEvent[];
  onDeleteEvent: (id: string) => void;
  onClearAll: () => void;
  onSelectEventToEdit?: (event: IntakeEvent) => void;
}

export const TimelineList: React.FC<TimelineListProps> = ({
  events,
  onDeleteEvent,
  onClearAll,
  onSelectEventToEdit,
}) => {
  // 時系列順（新しい順に表示）
  const sortedEvents = [...events].sort(
    (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
  );

  const formatEventDate = (dateStr: string) => {
    const date = new Date(dateStr);
    let dayPrefix = '';
    if (isToday(date)) {
      dayPrefix = '今日';
    } else if (isYesterday(date)) {
      dayPrefix = '昨日';
    } else {
      dayPrefix = format(date, 'M/d(E)', { locale: ja });
    }
    return `${dayPrefix} ${format(date, 'HH:mm')}`;
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'energy':
        return <Zap className="w-4 h-4 text-emerald-600" />;
      case 'tea':
        return <Droplets className="w-4 h-4 text-emerald-700" />;
      case 'soda':
        return <Sparkles className="w-4 h-4 text-red-600" />;
      default:
        return <Coffee className="w-4 h-4 text-amber-700" />;
    }
  };

  return (
    <div className="bg-white rounded-2xl p-4 sm:p-5 shadow-xs border border-stone-200/80 space-y-4">
      {/* ヘッダー */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <div className="w-7 h-7 rounded-lg bg-[#FAF7F2] text-[#3E2718] border border-stone-200/70 flex items-center justify-center">
            <History className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-xs font-semibold text-stone-900">摂取タイムライン</h3>
            <p className="text-[10px] text-stone-500 font-mono tabular-nums">登録件数: {events.length}件</p>
          </div>
        </div>

        {events.length > 0 && (
          <button
            type="button"
            onClick={onClearAll}
            className="text-xs text-stone-500 hover:text-red-600 transition-colors flex items-center space-x-1 hover:bg-stone-100 px-2 py-1 rounded-md cursor-pointer"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>全件クリア</span>
          </button>
        )}
      </div>

      {/* タイムライン一覧 */}
      {sortedEvents.length === 0 ? (
        <div className="text-center py-8 px-4 bg-stone-50/50 rounded-xl border border-dashed border-stone-200 space-y-2">
          <div className="w-9 h-9 rounded-full bg-stone-100 text-[#3E2718] flex items-center justify-center mx-auto">
            <Coffee className="w-4 h-4" />
          </div>
          <p className="text-xs font-medium text-stone-600">摂取イベントがありません</p>
          <p className="text-[11px] text-stone-400">
            上のパネルからドリンクを選択して記録すると、代謝推移が更新されます。
          </p>
        </div>
      ) : (
        <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
          {sortedEvents.map((event) => (
            <div
              key={event.id}
              onClick={() => onSelectEventToEdit && onSelectEventToEdit(event)}
              className="flex items-center justify-between p-3 rounded-xl bg-stone-50/60 hover:bg-stone-100/80 border border-stone-200/70 transition-all group cursor-pointer"
            >
              <div className="flex items-center space-x-3 min-w-0">
                <div className="w-8 h-8 rounded-lg bg-white border border-stone-200/80 flex items-center justify-center shadow-xs shrink-0">
                  {getCategoryIcon(event.category)}
                </div>
                <div className="min-w-0">
                  <h4 className="text-xs font-medium text-stone-900 group-hover:text-amber-900 transition-colors truncate">
                    {event.name}
                  </h4>
                  <span className="text-[11px] font-mono tabular-nums text-stone-500">
                    {formatEventDate(event.timestamp)}
                  </span>
                </div>
              </div>

              <div className="flex items-center space-x-2 shrink-0">
                <div className="flex flex-col items-end">
                  {event.powderGrams !== undefined && event.category === 'nescafe' && (
                    <span className="text-[10px] text-stone-400 font-mono tabular-nums leading-none mb-0.5">
                      {event.powderGrams}g
                    </span>
                  )}
                  {event.volumeMl !== undefined && (event.powderGrams === undefined || event.category !== 'nescafe') && (
                    <span className="text-[10px] text-stone-400 font-mono tabular-nums leading-none mb-0.5">
                      {event.volumeMl}ml
                    </span>
                  )}
                  <span className="text-xs font-semibold font-mono tabular-nums text-[#3E2718] bg-stone-100 px-1.5 py-0.5 rounded border border-stone-200/60 whitespace-nowrap shrink-0">
                    +{event.caffeineMg}mg
                  </span>
                </div>
                {onSelectEventToEdit && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onSelectEventToEdit(event);
                    }}
                    className="text-stone-400 hover:text-stone-700 p-1.5 rounded-md hover:bg-stone-200/60 transition-all cursor-pointer focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#3E2718]"
                    title="編集"
                    aria-label={`${event.name} を編集`}
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                )}
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onDeleteEvent(event.id);
                  }}
                  className="text-stone-400 hover:text-red-500 p-1.5 rounded-md hover:bg-stone-200/60 transition-all cursor-pointer focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-red-500"
                  title="削除"
                  aria-label={`${event.name} を削除`}
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
