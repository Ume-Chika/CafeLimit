import React, { useState, useEffect } from 'react';
import { Clock, RotateCcw, ChevronLeft, ChevronRight } from 'lucide-react';
import { format, addMinutes, isToday, isTomorrow, isYesterday } from 'date-fns';

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
  // スライダーの中心となる基準時刻（15分刻み丸め）
  const [referenceTime, setReferenceTime] = useState<Date>(() => {
    const d = new Date(selectedTime);
    const mins = d.getMinutes();
    d.setMinutes(Math.round(mins / 15) * 15, 0, 0);
    return d;
  });

  const [isDirectTimeInput, setIsDirectTimeInput] = useState<boolean>(false);

  // 外部からの selectedTime 変更時に、referenceTime が大きく離れていたら追従
  useEffect(() => {
    const diff = (selectedTime.getTime() - referenceTime.getTime()) / (1000 * 60);
    if (diff < -60 || diff > 60) {
      const newRef = new Date(selectedTime);
      const mins = newRef.getMinutes();
      newRef.setMinutes(Math.round(mins / 15) * 15, 0, 0);
      setReferenceTime(newRef);
    }
  }, [selectedTime, referenceTime]);

  // 選択時刻と基準時刻の差分分数（-60〜+60分）
  const diffMinutes = Math.round((selectedTime.getTime() - referenceTime.getTime()) / (1000 * 60));
  const sliderOffsetMinutes = Math.max(-60, Math.min(60, Math.round(diffMinutes / 15) * 15));

  // スライダー変更
  const handleSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const offset = parseInt(e.target.value, 10);
    const newTime = addMinutes(referenceTime, offset);
    const minutes = newTime.getMinutes();
    const snappedMinutes = Math.round(minutes / 15) * 15;
    newTime.setMinutes(snappedMinutes, 0, 0);
    onChangeTime(newTime);
  };

  // 「現在時刻」リセット
  const handleResetToNow = () => {
    const now = new Date();
    const mins = now.getMinutes();
    const snappedMins = Math.round(mins / 15) * 15;
    const snappedTime = new Date(now);
    snappedTime.setMinutes(snappedMins, 0, 0);
    setReferenceTime(snappedTime);
    onChangeTime(snappedTime);
  };

  // 「◀ 1h前」シフト（スライダー上のつまみ位置＝オフセットを維持して1時間シフト）
  const handleShiftBack1Hour = () => {
    const newRef = addMinutes(referenceTime, -60);
    const newSelected = addMinutes(selectedTime, -60);
    setReferenceTime(newRef);
    onChangeTime(newSelected);
  };

  // 「1h先 ▶」シフト（スライダー上のつまみ位置＝オフセットを維持して1時間シフト）
  const handleShiftForward1Hour = () => {
    const newRef = addMinutes(referenceTime, 60);
    const newSelected = addMinutes(selectedTime, 60);
    setReferenceTime(newRef);
    onChangeTime(newSelected);
  };

  // 直接時刻入力
  const handleDirectTimeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const [hStr, mStr] = e.target.value.split(':');
    if (!hStr || !mStr) return;
    const newDate = new Date(selectedTime);
    newDate.setHours(parseInt(hStr, 10), parseInt(mStr, 10), 0, 0);
    const mins = newDate.getMinutes();
    const snappedMins = Math.round(mins / 15) * 15;
    newDate.setMinutes(snappedMins, 0, 0);
    setReferenceTime(newDate);
    onChangeTime(newDate);
    setIsDirectTimeInput(false);
  };

  const isNow = Math.abs(selectedTime.getTime() - baseTime.getTime()) < 8 * 60 * 1000;

  // 日付ラベル（今日/明日/昨日）の判定
  const getDateLabel = () => {
    if (isToday(selectedTime)) return '';
    if (isTomorrow(selectedTime)) return '(明日)';
    if (isYesterday(selectedTime)) return '(昨日)';
    return `(${format(selectedTime, 'M/d')})`;
  };

  const dateSuffix = getDateLabel();

  return (
    <div id="time-slider-section" className="bg-white rounded-3xl p-4 sm:p-5 border border-stone-200/90 shadow-xs space-y-3.5">
      {/* 上段：時刻表示 ＆ 現在時刻バッジ（曜日なし・シンプルグルーピング） */}
      <div className="flex items-center justify-between">
        {/* 摂取予定時刻（日付が今日以外なら横に(明日)/(昨日)を付与） */}
        <div className="flex items-center space-x-2.5">
          <div className="w-8 h-8 rounded-xl bg-amber-100/80 text-amber-900 flex items-center justify-center shrink-0">
            <Clock className="w-4 h-4" />
          </div>
          <div>
            <span className="text-[11px] font-bold text-stone-500 block">摂取予定時刻</span>
            <div className="flex items-baseline space-x-1.5">
              {isDirectTimeInput ? (
                <input
                  type="time"
                  autoFocus
                  defaultValue={format(selectedTime, 'HH:mm')}
                  onChange={handleDirectTimeChange}
                  onBlur={() => setIsDirectTimeInput(false)}
                  className="text-2xl font-black font-mono tracking-tight text-stone-900 bg-stone-100 px-1 py-0.5 rounded-lg border border-amber-500 focus:outline-none"
                />
              ) : (
                <button
                  type="button"
                  onClick={() => setIsDirectTimeInput(true)}
                  className="text-2xl font-black font-mono tracking-tight text-stone-900 hover:text-amber-800 transition-colors cursor-pointer text-left flex items-baseline"
                  title="タップして時刻を直接編集"
                >
                  <span>{format(selectedTime, 'HH:mm')}</span>
                  {dateSuffix && (
                    <span className="text-xs font-bold text-amber-800 ml-1.5 bg-amber-100/80 px-1.5 py-0.5 rounded-md">
                      {dateSuffix}
                    </span>
                  )}
                </button>
              )}
            </div>
          </div>
        </div>

        {/* 現在時刻バッジ：現在 03:22 */}
        <div className="text-xs font-bold text-stone-600 bg-stone-100 px-3 py-1.5 rounded-full border border-stone-200/80 flex items-center space-x-1">
          <span className="text-[10px] text-stone-600 font-semibold">現在</span>
          <span className="font-mono text-stone-800 font-bold">{format(baseTime, 'HH:mm')}</span>
        </div>
      </div>

      {/* 中段：3連シフトボタン（横幅いっぱいに3等分展開） */}
      <div className="grid grid-cols-3 gap-1 bg-stone-100/90 p-1 rounded-2xl border border-stone-200/70 w-full">
        <button
          type="button"
          onClick={handleShiftBack1Hour}
          className="flex items-center justify-center space-x-1 py-2 rounded-xl text-xs font-bold text-stone-700 hover:bg-white hover:shadow-xs active:scale-95 transition-all cursor-pointer"
          title="1時間前へシフト（つまみ位置維持）"
        >
          <ChevronLeft className="w-3.5 h-3.5 text-stone-500" />
          <span>1h前</span>
        </button>

        <button
          type="button"
          onClick={handleResetToNow}
          className={`flex items-center justify-center space-x-1 py-2 rounded-xl text-xs font-black transition-all cursor-pointer ${
            isNow
              ? 'bg-[#3E271E] text-white shadow-xs'
              : 'text-stone-800 hover:bg-white hover:shadow-xs active:scale-95'
          }`}
          title="現在時刻に合わせる"
        >
          <RotateCcw className="w-3 h-3" />
          <span>現在時刻</span>
        </button>

        <button
          type="button"
          onClick={handleShiftForward1Hour}
          className="flex items-center justify-center space-x-1 py-2 rounded-xl text-xs font-bold text-stone-700 hover:bg-white hover:shadow-xs active:scale-95 transition-all cursor-pointer"
          title="1時間先へシフト（つまみ位置維持）"
        >
          <span>1h先</span>
          <ChevronRight className="w-3.5 h-3.5 text-stone-500" />
        </button>
      </div>

      {/* 下段：-1h 〜 +1h 15分刻みスライダー（実時刻目盛り表示） */}
      <div className="pt-1">
        <input
          type="range"
          min="-60"
          max="60"
          step="15"
          value={sliderOffsetMinutes}
          onChange={handleSliderChange}
          className="w-full h-2 bg-stone-200 rounded-lg appearance-none cursor-pointer accent-[#3E271E]"
        />
        {/* 実時刻目盛り（-60m, -30m, 基準時, +30m, +60m） */}
        <div className="flex justify-between text-[11px] font-mono font-bold text-stone-500 mt-1.5 px-0.5">
          <span>{format(addMinutes(referenceTime, -60), 'HH:mm')}</span>
          <span className="text-stone-400">{format(addMinutes(referenceTime, -30), 'HH:mm')}</span>
          <span className="text-[#3E271E] font-black text-xs bg-amber-100 px-1.5 py-0.5 rounded-md">
            {format(referenceTime, 'HH:mm')}
          </span>
          <span className="text-stone-400">{format(addMinutes(referenceTime, 30), 'HH:mm')}</span>
          <span>{format(addMinutes(referenceTime, 60), 'HH:mm')}</span>
        </div>
      </div>
    </div>
  );
};
