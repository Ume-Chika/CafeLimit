import { useState, useEffect, useMemo } from 'react';
import { Coffee, Info } from 'lucide-react';
import type { IntakeEvent, BeveragePreset, MetabolicSpeed } from './types/caffeine';
import { METABOLIC_PROFILES } from './types/caffeine';
import { DEFAULT_NESCAFE_PRESETS } from './data/presets';
import { runSimulation, cleanOldEvents } from './utils/caffeineEngine';
import { TimeSliderPicker } from './components/TimeSliderPicker';
import { CoffeePanelList } from './components/CoffeePanelList';
import { SleepSafetyCard } from './components/SleepSafetyCard';
import { CaffeineChart } from './components/CaffeineChart';
import { TimelineList } from './components/TimelineList';
import { AddPresetModal } from './components/AddPresetModal';

const STORAGE_KEY_EVENTS = 'cafelimit_events_v2';
const STORAGE_KEY_PRESETS = 'cafelimit_presets_v2';
const STORAGE_KEY_BEDTIME = 'cafelimit_bedtime_v2';
const STORAGE_KEY_SPEED = 'cafelimit_speed_v2';

export default function App() {
  // 1. 状態管理
  const [currentTime, setCurrentTime] = useState<Date>(() => new Date());
  const [selectedTime, setSelectedTime] = useState<Date>(() => {
    const d = new Date();
    // 直近15分にスナップ
    const mins = Math.round(d.getMinutes() / 15) * 15;
    d.setMinutes(mins, 0, 0);
    return d;
  });
  
  const [bedTimeStr, setBedTimeStr] = useState<string>(() => {
    return localStorage.getItem(STORAGE_KEY_BEDTIME) || '23:30';
  });
  
  const [metabolicSpeed, setMetabolicSpeed] = useState<MetabolicSpeed>(() => {
    return (localStorage.getItem(STORAGE_KEY_SPEED) as MetabolicSpeed) || 'standard';
  });

  const [presets, setPresets] = useState<BeveragePreset[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEY_PRESETS);
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error('Failed to parse presets', e);
      }
    }
    return DEFAULT_NESCAFE_PRESETS;
  });

  const [events, setEvents] = useState<IntakeEvent[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEY_EVENTS);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        // 一昨日以前のイベントを自動削除
        return cleanOldEvents(parsed, new Date());
      } catch (e) {
        console.error('Failed to parse events', e);
      }
    }
    // 初期サンプル（今日の朝8:00に平和カプチ2g）
    const sampleDate = new Date();
    sampleDate.setHours(8, 0, 0, 0);
    return [
      {
        id: 'sample-morning',
        timestamp: sampleDate.toISOString(),
        name: '平和カプチ',
        category: 'nescafe',
        powderGrams: 2.0,
        caffeineMg: 80,
        waterMl: 120,
        foamMl: 40,
      },
    ];
  });

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [showScientificModal, setShowScientificModal] = useState(false);

  // 1分ごとに現在時刻を更新 & 一昨日以前の古いイベントをクリーンアップ
  useEffect(() => {
    const timer = setInterval(() => {
      const now = new Date();
      setCurrentTime(now);
      setEvents((prev) => cleanOldEvents(prev, now));
    }, 60000);
    return () => clearInterval(timer);
  }, []);

  // LocalStorage 永続化
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_EVENTS, JSON.stringify(events));
  }, [events]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_PRESETS, JSON.stringify(presets));
  }, [presets]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_BEDTIME, bedTimeStr);
  }, [bedTimeStr]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_SPEED, metabolicSpeed);
  }, [metabolicSpeed]);

  // 就寝時刻 Date オブジェクトの算出
  const bedTimeDate = useMemo(() => {
    const [hStr, mStr] = bedTimeStr.split(':');
    const hours = parseInt(hStr, 10) || 23;
    const minutes = parseInt(mStr, 10) || 30;

    const bDate = new Date(currentTime);
    bDate.setHours(hours, minutes, 0, 0);

    // 深夜（例: 午前0時〜午前5時）の場合、就寝時刻が23:30なら「今日の夜23:30」
    if (currentTime.getHours() < 6 && hours >= 18) {
      // 本日の夜
      bDate.setHours(hours, minutes, 0, 0);
    } else if (bDate.getTime() < currentTime.getTime() - 6 * 60 * 60 * 1000) {
      bDate.setDate(bDate.getDate() + 1);
    }
    return bDate;
  }, [bedTimeStr, currentTime]);

  const halfLifeHours = METABOLIC_PROFILES[metabolicSpeed]?.halfLifeHours || 4.0;

  // シミュレーション計算
  const simulationSummary = useMemo(() => {
    return runSimulation(events, currentTime, bedTimeDate, halfLifeHours);
  }, [events, currentTime, bedTimeDate, halfLifeHours]);

  // 摂取イベント追加
  const handleAddIntakeEvent = (preset: BeveragePreset) => {
    const newEvent: IntakeEvent = {
      id: `intake-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      timestamp: selectedTime.toISOString(),
      name: preset.name,
      category: preset.category,
      powderGrams: preset.powderGrams,
      caffeineMg: preset.caffeineMg,
      presetId: preset.id,
      waterMl: preset.waterMl,
      foamMl: preset.foamMl,
    };

    setEvents((prev) => cleanOldEvents([...prev, newEvent], currentTime));
  };

  const handleDeleteEvent = (id: string) => {
    setEvents((prev) => prev.filter((e) => e.id !== id));
  };

  const handleClearAllEvents = () => {
    if (window.confirm('摂取タイムラインをクリアしますか？')) {
      setEvents([]);
    }
  };

  const handleAddPreset = (newPreset: BeveragePreset) => {
    setPresets((prev) => {
      if (prev.some((p) => p.id === newPreset.id)) return prev;
      return [...prev, newPreset];
    });
  };

  const handleDeleteCustomPreset = (presetId: string) => {
    setPresets((prev) => prev.filter((p) => p.id !== presetId));
  };

  return (
    <div className="min-h-screen bg-[#F8F5EE] text-stone-900 flex flex-col font-sans selection:bg-amber-200">
      {/* ヘッダー */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-stone-200/80 px-4 sm:px-8 py-3 shadow-xs">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <div className="w-9 h-9 rounded-2xl bg-[#3E271E] flex items-center justify-center text-white shadow-xs">
              <Coffee className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-1.5">
                <h1 className="text-base font-black tracking-tight text-stone-900">
                  CafeLimit
                </h1>
                <span className="text-[9px] font-bold bg-[#EADDC9] text-stone-900 px-2 py-0.5 rounded-full">
                  バリスタ対応
                </span>
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setShowScientificModal(true)}
            className="flex items-center space-x-1 px-2.5 py-1.5 rounded-xl text-stone-500 hover:text-stone-900 text-xs font-bold transition-all"
            title="科学的根拠"
          >
            <Info className="w-4 h-4 text-stone-400" />
            <span className="hidden sm:inline">科学モデル</span>
          </button>
        </div>
      </header>

      {/* メインコンテンツ */}
      <main className="flex-1 max-w-5xl w-full mx-auto p-3.5 sm:p-6 space-y-5">
        {/* 睡眠判定カード */}
        <section>
          <SleepSafetyCard
            summary={simulationSummary}
            bedTime={bedTimeStr}
            onChangeBedTime={setBedTimeStr}
            metabolicSpeed={metabolicSpeed}
            onChangeMetabolicSpeed={setMetabolicSpeed}
          />
        </section>

        {/* ネスカフェ バリスタ風 レシピパネル ＆ 淹れる */}
        <section>
          <CoffeePanelList
            presets={presets}
            onAddEvent={handleAddIntakeEvent}
            onOpenAddModal={() => setIsAddModalOpen(true)}
            onDeleteCustomPreset={handleDeleteCustomPreset}
          />
        </section>

        {/* 時系列グラフ */}
        <section>
          <CaffeineChart
            points={simulationSummary.hourlyPoints}
            events={events}
            currentTime={currentTime}
            bedTime={bedTimeDate}
          />
        </section>

        {/* 下部：時刻スライダー ＆ タイムライン履歴 */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-start">
          <TimeSliderPicker
            selectedTime={selectedTime}
            onChangeTime={setSelectedTime}
            baseTime={currentTime}
          />

          <TimelineList
            events={events}
            onDeleteEvent={handleDeleteEvent}
            onClearAll={handleClearAllEvents}
          />
        </div>
      </main>

      {/* フッター */}
      <footer className="border-t border-stone-200/80 bg-stone-100/50 py-4 px-4 text-center text-xs text-stone-400">
        <p className="font-semibold text-stone-500">CafeLimit — ネスカフェネイティブ カフェイン・睡眠シミュレーター</p>
      </footer>

      {/* ドリンク追加モーダル */}
      <AddPresetModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onAddPresetToList={handleAddPreset}
        existingPresetIds={presets.map((p) => p.id)}
      />

      {/* 科学的モデル・解説モーダル */}
      {showScientificModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/60 backdrop-blur-xs animate-fadeIn">
          <div
            className="bg-white rounded-3xl shadow-xl border border-stone-200 w-full max-w-md overflow-hidden flex flex-col max-h-[85vh]"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-5 border-b border-stone-100 flex items-center justify-between bg-stone-50">
              <h3 className="text-sm font-black text-stone-900">CafeLimit 科学的計算モデル</h3>
              <button
                type="button"
                onClick={() => setShowScientificModal(false)}
                className="w-7 h-7 rounded-full hover:bg-stone-200 flex items-center justify-center text-stone-500 font-bold"
              >
                ✕
              </button>
            </div>
            <div className="p-5 overflow-y-auto space-y-3.5 text-xs text-stone-700 leading-relaxed">
              <div>
                <h4 className="font-bold text-stone-900 mb-1">1. ネスカフェ原単位</h4>
                <p>
                  日本食品標準成分表（八訂）に基づき、粉末1gあたり <strong>40mg</strong>（標準2gで80mg）。
                </p>
              </div>
              <div>
                <h4 className="font-bold text-stone-900 mb-1">2. 薬物動態＆重ね合わせ</h4>
                <p>
                  一次消失速度論 C(t) = C₀ × (1/2)^(Δt / t_half)（標準半減期4.0時間）に従い、複数回の摂取量を線形合算。
                </p>
              </div>
              <div>
                <h4 className="font-bold text-stone-900 mb-1">3. EFSA 睡眠影響閾値</h4>
                <p>
                  就寝時 <strong>25mg未満</strong> で睡眠影響なし（快眠）、<strong>50mg以上</strong> で中途覚醒・徐波睡眠阻害リスク。
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
