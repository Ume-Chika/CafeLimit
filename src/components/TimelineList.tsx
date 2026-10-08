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
      default:
        return <Coffee className="w-4 h-4 text-amber-700" />;
    }
  };

  return (
    <div className="bg-white rounded-3xl p-5 shadow-sm border border-stone-200/90 space-y-4">
      {/* ヘッダー */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <div className="w-7 h-7 rounded-lg bg-stone-100 flex items-center justify-center text-stone-700">
            <History className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-extrabold text-stone-900">摂取タイムライン</h3>
            <p className="text-[11px] text-stone-600">登録件数: {events.length}件</p>
          </div>
        </div>

        {events.length > 0 && (
          <button
            type="button"
            onClick={onClearAll}
            className="text-[11px] font-semibold text-stone-600 hover:text-red-600 transition-colors flex items-center space-x-1 hover:bg-stone-100 px-2 py-1 rounded-lg cursor-pointer"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>全件クリア</span>
          </button>
        )}
      </div>

      {/* タイムライン一覧 */}
      {sortedEvents.length === 0 ? (
        <div className="text-center py-8 px-4 bg-stone-50/50 rounded-2xl border border-dashed border-stone-200 space-y-2">
          <div className="w-10 h-10 rounded-full bg-amber-50 text-amber-800 flex items-center justify-center mx-auto">
            <Coffee className="w-5 h-5" />
          </div>
          <p className="text-xs font-bold text-stone-600">摂取イベントがありません</p>
          <p className="text-[11px] text-stone-600">
            上のクイックパネルからコーヒーやドリンクを追加して、代謝シミュレーションを開始しましょう。
          </p>
        </div>
      ) : (
        <div className="space-y-2.5 max-h-72 overflow-y-auto pr-1">
          {sortedEvents.map((event) => (
            <div
              key={event.id}
              onClick={() => onSelectEventToEdit && onSelectEventToEdit(event)}
              className="flex items-center justify-between p-3 rounded-2xl bg-stone-50/80 hover:bg-stone-100/90 border border-stone-200/60 transition-all group cursor-pointer"
            >
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 rounded-xl bg-white border border-stone-200 flex items-center justify-center shadow-xs">
                  {getCategoryIcon(event.category)}
                </div>
                <div>
                  <div className="flex items-center space-x-2">
                    <h4 className="text-xs font-bold text-stone-800 group-hover:text-amber-900 transition-colors">
                      {event.name}
                    </h4>
                    {event.powderGrams !== undefined && (
                      <span className="text-[10px] text-amber-800 font-semibold bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200/60 flex items-center">
                        <Sparkles className="w-2.5 h-2.5 mr-0.5" />
                        {event.powderGrams}g
                      </span>
                    )}
                  </div>
                  <span className="text-[11px] font-mono text-stone-600">
                    {formatEventDate(event.timestamp)}
                  </span>
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <span className="text-xs font-black font-mono text-amber-900 bg-amber-100/90 px-2 py-1 rounded-lg whitespace-nowrap shrink-0">
                  +{event.caffeineMg} mg
                </span>
                {onSelectEventToEdit && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onSelectEventToEdit(event);
                    }}
                    className="text-stone-400 hover:text-amber-700 p-1.5 rounded-lg hover:bg-stone-200/70 transition-all opacity-70 group-hover:opacity-100 cursor-pointer"
                    title="編集"
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
                  className="text-stone-400 hover:text-red-500 p-1.5 rounded-lg hover:bg-stone-200/70 transition-all opacity-70 group-hover:opacity-100 cursor-pointer"
                  title="削除"
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
