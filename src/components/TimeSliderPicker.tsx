import React, { useState } from 'react';
import { Clock, RotateCcw, Calendar, ChevronDown, ChevronUp } from 'lucide-react';
import { format, addMinutes, startOfDay, addDays, isSameDay } from 'date-fns';
import { ja } from 'date-fns/locale';

interface TimeSliderPickerProps {
  selectedTime: Date;
  onChangeTime: (time: Date) => void;
  baseTime: Date;
}

export const TimeSliderPicker: React.FC<TimeSliderPickerProps> = ({
  selectedTime,
  onChangeTime,
  baseTime,
}) => {
  const [showAdvancedPicker, setShowAdvancedPicker] = useState<boolean>(false);

  // 選択時刻と基準時刻の差分分数を直接計算
  const diffMinutes = Math.round((selectedTime.getTime() - baseTime.getTime()) / (1000 * 60));
  const sliderOffsetMinutes = Math.max(-120, Math.min(120, diffMinutes));

  const handleSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const offset = parseInt(e.target.value, 10);
    const newTime = addMinutes(baseTime, offset);
    const minutes = newTime.getMinutes();
    const snappedMinutes = Math.round(minutes / 15) * 15;
    newTime.setMinutes(snappedMinutes, 0, 0);
    onChangeTime(newTime);
  };

  const handleResetToNow = () => {
    const now = new Date();
    const mins = now.getMinutes();
    const snappedMins = Math.round(mins / 15) * 15;
    const snappedTime = new Date(now);
    snappedTime.setMinutes(snappedMins, 0, 0);
    onChangeTime(snappedTime);
  };

  const selectedDayDiff = Math.round(
    (startOfDay(selectedTime).getTime() - startOfDay(baseTime).getTime()) / (1000 * 60 * 60 * 24)
  );

  const handleDaySelect = (dayOffset: number) => {
    const newDate = addDays(baseTime, dayOffset);
    newDate.setHours(selectedTime.getHours(), selectedTime.getMinutes(), 0, 0);
    onChangeTime(newDate);
  };

  const handleHourSelect = (hour: number) => {
    const newDate = new Date(selectedTime);
    newDate.setHours(hour);
    onChangeTime(newDate);
  };

  const handleMinuteSelect = (minute: number) => {
    const newDate = new Date(selectedTime);
    newDate.setMinutes(minute, 0, 0);
    onChangeTime(newDate);
  };

  const getOffsetLabel = (offset: number) => {
    if (offset === 0) return '今すぐ (±0h)';
    const hours = Math.floor(Math.abs(offset) / 60);
    const mins = Math.abs(offset) % 60;
    const sign = offset > 0 ? '+' : '-';
    if (hours > 0 && mins > 0) return `${sign}${hours}時間${mins}分`;
    if (hours > 0) return `${sign}${hours}時間`;
    return `${sign}${mins}分`;
  };

  const isNow = Math.abs(selectedTime.getTime() - baseTime.getTime()) < 5 * 60 * 1000;

  return (
    <div className="bg-white rounded-3xl p-4 sm:p-5 border border-stone-200/90 shadow-xs space-y-3">
      {/* ヘッダー：時刻と今すぐボタン */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2.5">
          <div className="w-8 h-8 rounded-xl bg-amber-100/80 text-amber-900 flex items-center justify-center">
            <Clock className="w-4 h-4" />
          </div>
          <div>
            <span className="text-[11px] font-bold text-stone-600 block">摂取予定時刻</span>
            <div className="flex items-baseline space-x-2">
              <span className="text-2xl font-black font-mono tracking-tight text-stone-900">
                {format(selectedTime, 'HH:mm')}
              </span>
              <span className="text-[11px] font-bold text-amber-900 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200/60">
                {isSameDay(selectedTime, baseTime)
                  ? '今日'
                  : isSameDay(selectedTime, addDays(baseTime, -1))
                  ? '昨日'
                  : format(selectedTime, 'M/d(E)', { locale: ja })}
                {' · '}
                {getOffsetLabel(diffMinutes >= -120 && diffMinutes <= 120 ? diffMinutes : sliderOffsetMinutes)}
              </span>
            </div>
          </div>
        </div>

        <button
          type="button"
          onClick={handleResetToNow}
          disabled={isNow}
          className={`flex items-center space-x-1 px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
            isNow
              ? 'bg-stone-100 text-stone-400 cursor-not-allowed'
              : 'bg-amber-100 text-amber-900 hover:bg-amber-200 active:scale-95'
          }`}
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>今すぐ</span>
        </button>
      </div>

      {/* スライダー */}
      <div className="pt-1">
        <input
          type="range"
          min="-120"
          max="120"
          step="15"
          value={sliderOffsetMinutes}
          onChange={handleSliderChange}
          className="w-full h-2 bg-stone-200 rounded-lg appearance-none cursor-pointer accent-amber-800"
        />
        <div className="flex justify-between text-[10px] font-bold text-stone-600 mt-1 px-0.5">
          <span>-2h</span>
          <span>-1h</span>
          <span className="text-amber-900 font-black">現在</span>
          <span>+1h</span>
          <span>+2h</span>
        </div>
      </div>

      {/* 詳細日時セレクタートグル */}
      <div className="pt-1">
        <button
          type="button"
          onClick={() => setShowAdvancedPicker(!showAdvancedPicker)}
          className="flex items-center justify-between w-full text-[11px] font-bold text-stone-600 hover:text-stone-800 py-1"
        >
          <span className="flex items-center space-x-1.5">
            <Calendar className="w-3.5 h-3.5 text-stone-400" />
            <span>朝の記録や過去・未来の日時を指定</span>
          </span>
          {showAdvancedPicker ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
        </button>

        {showAdvancedPicker && (
          <div className="mt-2.5 p-3 bg-stone-50 rounded-2xl border border-stone-200/80 space-y-2.5 animate-fadeIn">
            {/* 日付選択 */}
            <div className="grid grid-cols-3 gap-2">
              {[
                { label: '昨日', offset: -1 },
                { label: '今日', offset: 0 },
                { label: '明日', offset: 1 },
              ].map(({ label, offset }) => (
                <button
                  key={offset}
                  type="button"
                  onClick={() => handleDaySelect(offset)}
                  className={`py-1.5 text-xs font-bold rounded-xl border transition-all ${
                    selectedDayDiff === offset
                      ? 'bg-amber-800 text-white border-amber-800'
                      : 'bg-white text-stone-700 border-stone-200 hover:bg-stone-100'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>

            {/* 時・分 */}
            <div className="grid grid-cols-2 gap-2">
              <select
                value={selectedTime.getHours()}
                onChange={(e) => handleHourSelect(parseInt(e.target.value, 10))}
                className="bg-white border border-stone-200 rounded-xl px-2.5 py-1.5 text-xs font-mono font-bold text-stone-800"
              >
                {Array.from({ length: 24 }).map((_, h) => (
                  <option key={h} value={h}>
                    {h.toString().padStart(2, '0')} 時
                  </option>
                ))}
              </select>

              <select
                value={Math.round(selectedTime.getMinutes() / 15) * 15 % 60}
                onChange={(e) => handleMinuteSelect(parseInt(e.target.value, 10))}
                className="bg-white border border-stone-200 rounded-xl px-2.5 py-1.5 text-xs font-mono font-bold text-stone-800"
              >
                {[0, 15, 30, 45].map((m) => (
                  <option key={m} value={m}>
                    {m.toString().padStart(2, '0')} 分
                  </option>
                ))}
              </select>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
