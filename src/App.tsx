import { useState, useEffect, useMemo, useRef } from 'react';
import { Coffee, Info } from 'lucide-react';
import type { IntakeEvent, BeveragePreset, MetabolicSpeed } from './types/caffeine';
import { METABOLIC_PROFILES } from './types/caffeine';
import { DEFAULT_NESCAFE_PRESETS } from './data/presets';
import { runSimulation, cleanOldEvents, getUpcomingBedTime } from './utils/caffeineEngine';
import { TimeSliderPicker } from './components/TimeSliderPicker';
import { CoffeePanelList } from './components/CoffeePanelList';
import { SleepSafetyCard } from './components/SleepSafetyCard';
import { CaffeineChart } from './components/CaffeineChart';
import { TimelineList } from './components/TimelineList';
import { AddPresetModal } from './components/AddPresetModal';
import { EditEventModal } from './components/EditEventModal';

const STORAGE_KEY_EVENTS = 'cafelimit_events_v3';
const STORAGE_KEY_PRESETS = 'cafelimit_presets_v3';
const STORAGE_KEY_BEDTIME = 'cafelimit_bedtime_v3';
const STORAGE_KEY_SPEED = 'cafelimit_speed_v3';

export default function App() {
  const panelSectionRef = useRef<HTMLDivElement>(null);
  const sleepSectionRef = useRef<HTMLDivElement>(null);

  // 1. 状態管理
  const [currentTime, setCurrentTime] = useState<Date>(() => new Date());
  const [selectedTime, setSelectedTime] = useState<Date>(() => {
    const d = new Date();
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
        return cleanOldEvents(parsed, new Date());
      } catch (e) {
        console.error('Failed to parse events', e);
      }
    }
    // 初期サンプル（本日の朝8:00に平和カプチ2g）
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
      },
    ];
  });

  // モーダル状態
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState<IntakeEvent | null>(null);
  const [showScientificModal, setShowScientificModal] = useState(false);

  // 1分ごとに現在時刻更新 & 一昨日以前のイベント削除
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

  // 就寝時刻 Date 算出
  const bedTimeDate = useMemo(() => {
    return getUpcomingBedTime(currentTime, bedTimeStr);
  }, [currentTime, bedTimeStr]);

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
    };

    setEvents((prev) => cleanOldEvents([...prev, newEvent], currentTime));
  };

  // イベント更新
  const handleUpdateEvent = (updated: IntakeEvent) => {
    setEvents((prev) => prev.map((e) => (e.id === updated.id ? updated : e)));
  };

  // イベント削除
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

  // グラフから空いている時間をタップ ➔ スライダーを合わせてパネルへスクロール
  const handleSelectTimeToBrew = (time: Date) => {
    setSelectedTime(time);
    if (panelSectionRef.current) {
      panelSectionRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  };

  // グラフから就寝線をタップ ➔ 上部就寝設定へスクロール
  const handleFocusBedTime = () => {
    const el = document.getElementById('sleep-safety-section');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  return (
    <div className="min-h-screen bg-[#F8F5EE] text-stone-900 flex flex-col font-sans selection:bg-amber-200">
      {/* ヘッダー */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-stone-200/80 px-4 sm:px-6 py-2.5 shadow-xs">
        <div className="max-w-3xl mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 rounded-xl bg-[#3E271E] flex items-center justify-center text-white shadow-xs">
              <Coffee className="w-4 h-4" />
            </div>
            <h1 className="text-base font-black tracking-tight text-stone-900">
              CafeLimit
            </h1>
            <span className="text-[10px] font-bold bg-[#EADDC9] text-stone-900 px-2 py-0.5 rounded-full">
              ネスカフェ
            </span>
          </div>

          <button
            type="button"
            onClick={() => setShowScientificModal(true)}
            className="flex items-center space-x-1 px-2.5 py-1 rounded-xl text-stone-500 hover:text-stone-900 text-xs font-bold transition-all"
            title="科学的根拠"
          >
            <Info className="w-4 h-4 text-stone-400" />
            <span className="text-[11px]">科学モデル</span>
          </button>
        </div>
      </header>

      {/* メインコンテンツ（流れるような縦動線） */}
      <main className="flex-1 max-w-3xl w-full mx-auto p-3.5 sm:p-5 space-y-4">
        {/* 1. 睡眠判定 ＆ 逆算カード */}
        <section ref={sleepSectionRef}>
          <SleepSafetyCard
            summary={simulationSummary}
            bedTime={bedTimeStr}
            onChangeBedTime={setBedTimeStr}
            metabolicSpeed={metabolicSpeed}
            onChangeMetabolicSpeed={setMetabolicSpeed}
          />
        </section>

        {/* 2. 時系列グラフ（タップでイベント編集・追加・就寝変更） */}
        <section>
          <CaffeineChart
            points={simulationSummary.hourlyPoints}
            events={events}
            currentTime={currentTime}
            bedTime={bedTimeDate}
            onSelectEventToEdit={(ev) => setEditingEvent(ev)}
            onSelectTimeToBrew={handleSelectTimeToBrew}
            onFocusBedTime={handleFocusBedTime}
          />
        </section>

        {/* 3. 時間指定スライダー ＆ 真下にクイック追加パネル */}
        <section ref={panelSectionRef} className="space-y-3 bg-white/60 p-4 rounded-3xl border border-stone-200/80 scroll-mt-20">
          {/* 時間指定スライダー */}
          <TimeSliderPicker
            selectedTime={selectedTime}
            onChangeTime={setSelectedTime}
            baseTime={currentTime}
          />

          {/* スライダーの真下に配置されたクイック摂取パネル */}
          <CoffeePanelList
            presets={presets}
            onAddEvent={handleAddIntakeEvent}
            onOpenAddModal={() => setIsAddModalOpen(true)}
            onDeleteCustomPreset={handleDeleteCustomPreset}
          />
        </section>

        {/* 4. 摂取タイムライン履歴 */}
        <section>
          <TimelineList
            events={events}
            onDeleteEvent={handleDeleteEvent}
            onClearAll={handleClearAllEvents}
          />
        </section>
      </main>

      {/* フッター */}
      <footer className="border-t border-stone-200/80 bg-stone-100/50 py-3.5 px-4 text-center text-[11px] text-stone-400">
        <p className="font-semibold text-stone-500">CafeLimit — カフェイン・睡眠シミュレーター</p>
      </footer>

      {/* イベント編集モーダル */}
      <EditEventModal
        isOpen={editingEvent !== null}
        event={editingEvent}
        onClose={() => setEditingEvent(null)}
        onUpdateEvent={handleUpdateEvent}
        onDeleteEvent={handleDeleteEvent}
      />

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
            <div className="p-4 border-b border-stone-100 flex items-center justify-between bg-stone-50">
              <h3 className="text-sm font-black text-stone-900">CafeLimit 科学的計算モデル</h3>
              <button
                type="button"
                onClick={() => setShowScientificModal(false)}
                className="w-7 h-7 rounded-full hover:bg-stone-200 flex items-center justify-center text-stone-500 font-bold"
              >
                ✕
              </button>
            </div>
            <div className="p-5 overflow-y-auto space-y-3 text-xs text-stone-700 leading-relaxed">
              <div>
                <h4 className="font-bold text-stone-900 mb-0.5">1. ネスカフェ原単位</h4>
                <p>
                  日本食品標準成分表（八訂）に基づき、粉末1gあたり <strong>40mg</strong>（標準2gで80mg）。
                </p>
              </div>
              <div>
                <h4 className="font-bold text-stone-900 mb-0.5">2. 薬物動態＆重ね合わせ</h4>
                <p>
                  一次消失速度論 C(t) = C₀ × (1/2)^(Δt / t_half)（標準半減期4.0時間）に従い、複数回の摂取量を線形合算。
                </p>
              </div>
              <div>
                <h4 className="font-bold text-stone-900 mb-0.5">3. EFSA 睡眠影響閾値</h4>
                <p>
                  就寝時 <strong>25mg未満</strong> で睡眠影響なし（快眠）、<strong>50mg以上</strong> で中途覚醒・深睡眠阻害リスク。
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
