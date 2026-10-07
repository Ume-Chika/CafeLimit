import { useState, useEffect, useMemo, useRef } from 'react';
import { Coffee, Info, Settings } from 'lucide-react';
import type { IntakeEvent, BeveragePreset, MetabolicSpeed, AppSettings } from './types/caffeine';
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
import { MetabolicModal } from './components/MetabolicModal';
import { SettingsModal } from './components/SettingsModal';
import { ConfirmAddModal } from './components/ConfirmAddModal';
import { EditPresetModal } from './components/EditPresetModal';

const STORAGE_KEY_EVENTS = 'cafelimit_events_v4';
const STORAGE_KEY_PRESETS = 'cafelimit_presets_v4';
const STORAGE_KEY_BEDTIME = 'cafelimit_bedtime_v4';
const STORAGE_KEY_SPEED = 'cafelimit_speed_v4';
const STORAGE_KEY_SETTINGS = 'cafelimit_settings_v4';

const DEFAULT_SETTINGS: AppSettings = {
  maxIntakeUnit: 'powder',
  deadlinePresetId: 'heiwa-capuchi',
  confirmBeforeAdd: true,
  customHalfLifeHours: 4.0,
};

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

  const [settings, setSettings] = useState<AppSettings>(() => {
    const saved = localStorage.getItem(STORAGE_KEY_SETTINGS);
    if (saved) {
      try {
        return { ...DEFAULT_SETTINGS, ...JSON.parse(saved) };
      } catch (e) {
        console.error('Failed to parse settings', e);
      }
    }
    return DEFAULT_SETTINGS;
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
    // 初期サンプル（本日の朝8:00にネスカフェ2.0g）
    const sampleDate = new Date();
    sampleDate.setHours(8, 0, 0, 0);
    return [
      {
        id: 'sample-morning',
        timestamp: sampleDate.toISOString(),
        name: 'ネスカフェ (2.0g)',
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
  const [isMetabolicModalOpen, setIsMetabolicModalOpen] = useState(false);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  const [confirmingPreset, setConfirmingPreset] = useState<BeveragePreset | null>(null);
  const [editingPreset, setEditingPreset] = useState<BeveragePreset | null>(null);

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

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_SETTINGS, JSON.stringify(settings));
  }, [settings]);

  // 就寝時刻 Date 算出
  const bedTimeDate = useMemo(() => {
    return getUpcomingBedTime(currentTime, bedTimeStr);
  }, [currentTime, bedTimeStr]);

  const halfLifeHours =
    metabolicSpeed === 'custom'
      ? settings.customHalfLifeHours
      : METABOLIC_PROFILES[metabolicSpeed]?.halfLifeHours || 4.0;

  // 設定された最終時刻の対象プリセット
  const targetPreset = useMemo(() => {
    return presets.find((p) => p.id === settings.deadlinePresetId) || presets[0] || DEFAULT_NESCAFE_PRESETS[0];
  }, [presets, settings.deadlinePresetId]);

  // シミュレーション計算
  const simulationSummary = useMemo(() => {
    return runSimulation(
      events,
      currentTime,
      bedTimeDate,
      halfLifeHours,
      targetPreset ? targetPreset.caffeineMg : 80,
      targetPreset ? targetPreset.name : '標準2g'
    );
  }, [events, currentTime, bedTimeDate, halfLifeHours, targetPreset]);

  // 摂取イベント追加
  const handleAddIntakeEvent = (preset: BeveragePreset) => {
    const newEvent: IntakeEvent = {
      id: `intake-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      timestamp: selectedTime.toISOString(),
      name: preset.name,
      category: preset.category,
      powderGrams: preset.powderGrams,
      caffeineMg: preset.caffeineMg,
      volumeMl: preset.volumeMl,
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
    if (window.confirm('摂取タイムラインを全件クリアしますか？')) {
      setEvents([]);
    }
  };

  const handleAddPresetToList = (newPreset: BeveragePreset) => {
    setPresets((prev) => {
      if (prev.some((p) => p.id === newPreset.id)) return prev;
      return [...prev, newPreset];
    });
  };

  const handleUpdatePreset = (updated: BeveragePreset) => {
    setPresets((prev) => prev.map((p) => (p.id === updated.id ? updated : p)));
  };

  const handleDeletePreset = (presetId: string) => {
    setPresets((prev) => prev.filter((p) => p.id !== presetId));
  };

  // グラフから空いている時間をタップ ➔ スライダーを合わせてパネルへスクロール
  const handleSelectTimeToBrew = (time: Date) => {
    setSelectedTime(time);
    if (panelSectionRef.current) {
      panelSectionRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
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
              ネスカフェ＆エナドリ対応*
            </span>
          </div>

          <div className="flex items-center space-x-1 sm:space-x-2">
            <button
              type="button"
              onClick={() => setShowScientificModal(true)}
              className="flex items-center space-x-1 px-2.5 py-1 rounded-xl text-stone-600 hover:text-stone-900 text-xs font-bold transition-all cursor-pointer"
              title="科学的根拠"
            >
              <Info className="w-4 h-4 text-stone-400" />
              <span className="text-[11px] hidden sm:inline">科学モデル</span>
            </button>

            <button
              type="button"
              onClick={() => setIsSettingsModalOpen(true)}
              className="p-1.5 rounded-xl text-stone-500 hover:text-stone-900 hover:bg-stone-100 transition-all cursor-pointer"
              title="アプリ設定"
            >
              <Settings className="w-4 h-4" />
            </button>
          </div>
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
            onOpenMetabolicModal={() => setIsMetabolicModalOpen(true)}
            settings={settings}
            targetPreset={targetPreset}
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
            onSelectPresetToEdit={(p) => setEditingPreset(p)}
            onSelectPresetToConfirm={(p) => setConfirmingPreset(p)}
            confirmBeforeAdd={settings.confirmBeforeAdd}
          />
        </section>

        {/* 4. 摂取タイムライン履歴 */}
        <section>
          <TimelineList
            events={events}
            onDeleteEvent={handleDeleteEvent}
            onClearAll={handleClearAllEvents}
            onSelectEventToEdit={(ev) => setEditingEvent(ev)}
          />
        </section>
      </main>

      {/* フッター（商標免責表記） */}
      <footer className="border-t border-stone-200/80 bg-stone-100/60 py-4 px-4 text-center text-[10px] text-stone-500 space-y-1.5">
        <p className="font-bold text-stone-700">CafeLimit — カフェイン動態・睡眠シミュレーター</p>
        <p className="text-stone-400 max-w-xl mx-auto leading-relaxed">
          ※「ネスカフェ」「ゴールドブレンド」「バリスタ」はネスレ日本株式会社の登録商標です。
          ※「モンスターエナジー」はMonster Energy Companyの登録商標です。「レッドブル」はRed Bull GmbHの登録商標です。
        </p>
        <p className="text-stone-400">
          ※ 本アプリは個人開発の非公式シミュレーションツールであり、各権利者様公式とは一切関係ありません。
        </p>
      </footer>

      {/* 摂取イベント編集モーダル */}
      <EditEventModal
        isOpen={editingEvent !== null}
        event={editingEvent}
        onClose={() => setEditingEvent(null)}
        onUpdateEvent={handleUpdateEvent}
        onDeleteEvent={handleDeleteEvent}
      />

      {/* パネル追加モーダル */}
      <AddPresetModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onAddPresetToList={handleAddPresetToList}
        existingPresetIds={presets.map((p) => p.id)}
      />

      {/* 代謝体質モーダル */}
      <MetabolicModal
        isOpen={isMetabolicModalOpen}
        onClose={() => setIsMetabolicModalOpen(false)}
        selectedSpeed={metabolicSpeed}
        onChangeSpeed={setMetabolicSpeed}
        customHalfLifeHours={settings.customHalfLifeHours}
        onChangeCustomHalfLife={(h) => setSettings((s) => ({ ...s, customHalfLifeHours: h }))}
      />

      {/* 設定モーダル */}
      <SettingsModal
        isOpen={isSettingsModalOpen}
        onClose={() => setIsSettingsModalOpen(false)}
        settings={settings}
        onChangeSettings={setSettings}
        presets={presets}
      />

      {/* パネルタップ時の誤タップ防止確認ダイアログ */}
      <ConfirmAddModal
        isOpen={confirmingPreset !== null}
        preset={confirmingPreset}
        selectedTime={selectedTime}
        onConfirm={() => {
          if (confirmingPreset) {
            handleAddIntakeEvent(confirmingPreset);
            setConfirmingPreset(null);
          }
        }}
        onClose={() => setConfirmingPreset(null)}
      />

      {/* パネル編集モーダル */}
      <EditPresetModal
        isOpen={editingPreset !== null}
        preset={editingPreset}
        onClose={() => setEditingPreset(null)}
        onUpdatePreset={handleUpdatePreset}
        onDeletePreset={handleDeletePreset}
      />

      {/* 科学的根拠モーダル */}
      {showScientificModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/60 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white rounded-3xl shadow-xl border border-stone-200 w-full max-w-lg overflow-hidden flex flex-col max-h-[85vh]">
            <div className="px-6 py-4 border-b border-stone-100 flex items-center justify-between bg-stone-50/50">
              <h3 className="text-base font-black text-stone-900">科学的計算モデルと医学的根拠</h3>
              <button
                type="button"
                onClick={() => setShowScientificModal(false)}
                className="w-8 h-8 rounded-full hover:bg-stone-200 text-stone-400 hover:text-stone-700 flex items-center justify-center cursor-pointer"
              >
                ✕
              </button>
            </div>
            <div className="p-6 overflow-y-auto space-y-4 text-xs text-stone-700 leading-relaxed">
              <div className="space-y-1">
                <h4 className="font-bold text-stone-900 text-sm">1. 睡眠閾値と覚醒作用の医学的基準</h4>
                <p>
                  欧州食品安全機関（EFSA）および睡眠医学の知見に基づき、就寝時の体内残存カフェイン量を評価しています。
                </p>
                <ul className="list-disc pl-5 space-y-0.5 text-[11px] text-stone-600">
                  <li><strong>快眠ゾーン (&lt; 25mg)</strong>: 覚醒作用が実質ゼロになり、深い徐波睡眠が阻害されません。</li>
                  <li><strong>注意ゾーン (25〜50mg)</strong>: 入眠潜時の延長や中途覚醒のリスクが生じます。</li>
                  <li><strong>覚醒警戒ゾーン (≥ 50mg)</strong>: アデノシン受容体がブロックされ、睡眠の質が著しく低下します。</li>
                </ul>
              </div>

              <div className="space-y-1">
                <h4 className="font-bold text-stone-900 text-sm">2. ネスカフェ原単位モデル</h4>
                <p>
                  ネスカフェ・ゴールドブレンドの公式基準に基づき、<strong>粉末 1.0g あたり 40mg</strong> のカフェインを含有するモデルを採用しています。
                </p>
                <ul className="list-disc pl-5 space-y-0.5 text-[11px] text-stone-600">
                  <li>ネスカフェ（標準 2.0g）: 80mg</li>
                  <li>ネスカフェ 軽め（1.0g）: 40mg</li>
                  <li>ネスカフェ 濃いめ（3.0g）: 120mg</li>
                </ul>
              </div>

              <div className="space-y-1">
                <h4 className="font-bold text-stone-900 text-sm">3. 代謝半減期モデル</h4>
                <p>
                  カフェインの血中濃度減衰は 1次反応速度論（指数関数的減衰）に従います。成人平均の半減期は約4.0時間ですが、CYP1A2酵素活性や喫煙習慣（速い・2.5h）、ピル服用等（遅い・6.0h）による個人差に対応しています。
                </p>
              </div>

              <div className="p-3 bg-stone-50 rounded-xl border border-stone-200 text-[10px] text-stone-500 space-y-1">
                <p>※ 本ツールは科学的文献に基づくシミュレーターであり、医療目的の診断やアドバイスを提供するものではありません。</p>
                <p>※「ネスカフェ」「ゴールドブレンド」はネスレ日本株式会社、「モンスターエナジー」はMonster Energy Company、「レッドブル」はRed Bull GmbHの登録商標です。</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
