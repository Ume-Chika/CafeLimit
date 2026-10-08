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
  deadlinePresetId: 'nescafe-standard-2g',
  confirmBeforeAdd: true,
  customHalfLifeHours: 4.0,
  safeSleepThresholdMg: 25,
  showFocusZone: false,
  drinkingDurationMinutes: 10,
  bodyWeightKg: 60,
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

  // シミュレーション計算（常に厳密な経口吸収・連続飲用時間積分モデルを適用）
  const simulationSummary = useMemo(() => {
    return runSimulation(
      events,
      currentTime,
      bedTimeDate,
      halfLifeHours,
      targetPreset ? targetPreset.caffeineMg : 80,
      targetPreset ? targetPreset.name : '標準2g',
      settings.safeSleepThresholdMg || 25,
      settings.drinkingDurationMinutes || 10,
      targetPreset?.drinkingDurationMinutes || settings.drinkingDurationMinutes || 10
    );
  }, [events, currentTime, bedTimeDate, halfLifeHours, targetPreset, settings.safeSleepThresholdMg, settings.drinkingDurationMinutes]);

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
      drinkingDurationMinutes: preset.drinkingDurationMinutes || settings.drinkingDurationMinutes || 10,
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

  const handleResetPresets = () => {
    setPresets(DEFAULT_NESCAFE_PRESETS);
    localStorage.setItem(STORAGE_KEY_PRESETS, JSON.stringify(DEFAULT_NESCAFE_PRESETS));
  };

  const handleResetAllData = () => {
    localStorage.removeItem(STORAGE_KEY_EVENTS);
    localStorage.removeItem(STORAGE_KEY_PRESETS);
    localStorage.removeItem(STORAGE_KEY_BEDTIME);
    localStorage.removeItem(STORAGE_KEY_SPEED);
    localStorage.removeItem(STORAGE_KEY_SETTINGS);

    setSettings(DEFAULT_SETTINGS);
    setPresets(DEFAULT_NESCAFE_PRESETS);
    setBedTimeStr('23:30');
    setMetabolicSpeed('standard');
    const sampleDate = new Date();
    sampleDate.setHours(8, 0, 0, 0);
    setEvents([
      {
        id: 'sample-morning',
        timestamp: sampleDate.toISOString(),
        name: 'ネスカフェ (2.0g)',
        category: 'nescafe',
        powderGrams: 2.0,
        caffeineMg: 80,
      },
    ]);
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
              主要ドリンク対応*
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
            safeSleepThresholdMg={settings.safeSleepThresholdMg || 25}
            showFocusZone={settings.showFocusZone}
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
          ※「コカ・コーラ」はThe Coca-Cola Companyの登録商標です。「ペプシ」はPepsiCo, Inc.の登録商標です。「ドクターペッパー」はKeurig Dr Pepper Inc.の登録商標です。
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

      {/* 代謝体質・シミュレーション設定モーダル */}
      <MetabolicModal
        isOpen={isMetabolicModalOpen}
        onClose={() => setIsMetabolicModalOpen(false)}
        selectedSpeed={metabolicSpeed}
        onChangeSpeed={setMetabolicSpeed}
        customHalfLifeHours={settings.customHalfLifeHours}
        onChangeCustomHalfLife={(h) => setSettings((s) => ({ ...s, customHalfLifeHours: h }))}
        safeSleepThresholdMg={settings.safeSleepThresholdMg || 25}
        onChangeSafeSleepThreshold={(th) => setSettings((s) => ({ ...s, safeSleepThresholdMg: th }))}
        bodyWeightKg={settings.bodyWeightKg ?? 60}
        onChangeBodyWeight={(w) => setSettings((s) => ({ ...s, bodyWeightKg: w }))}
        drinkingDurationMinutes={settings.drinkingDurationMinutes ?? 10}
        onChangeDrinkingDuration={(d) => setSettings((s) => ({ ...s, drinkingDurationMinutes: d }))}
      />

      {/* 設定モーダル */}
      <SettingsModal
        isOpen={isSettingsModalOpen}
        onClose={() => setIsSettingsModalOpen(false)}
        settings={settings}
        onChangeSettings={setSettings}
        presets={presets}
        onResetPresets={handleResetPresets}
        onResetAllData={handleResetAllData}
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
                <h4 className="font-bold text-stone-900 text-sm">1. 睡眠閾値と覚醒作用の医学的基準（EFSA 2015年見解）</h4>
                <p>
                  欧州食品安全機関（EFSA）の2015年科学的意見書および睡眠薬理学の知見に基づき、就寝時の体内残存カフェイン量を評価しています。
                </p>
                <ul className="list-disc pl-5 space-y-1 text-[11px] text-stone-600">
                  <li>
                    <strong>EFSA公的基準</strong>: 健康成人において単回 <strong>200mg</strong>（約 3mg/kg体重）、1日総量 <strong>400mg</strong>（妊婦 200mg）までは安全とされています。また、就寝直前（2時間以内）に約 <strong>100mg</strong>（約 1.4mg/kg体重）を超えて摂取すると入眠潜時の延長や徐波睡眠の短縮が確認されています。
                  </li>
                  <li>
                    <strong>就寝時 25mg 閾値の導出</strong>: 通常の1杯（80〜100mg）を夕方に摂取後、半減期を経て就寝時に体内残存が <strong>25mg以下（初期値の1/4以下）</strong> に達していれば、アデノシン受容体への拮抗作用が実質的に消失し、深い睡眠が守られます。
                  </li>
                </ul>
                <div className="mt-2 grid grid-cols-3 gap-2 text-center text-[11px]">
                  <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-2 text-emerald-900 font-bold">
                    🟢 快眠 (&le;25mg)<br /><span className="text-[10px] font-normal text-emerald-700">深い睡眠を阻害しない</span>
                  </div>
                  <div className="bg-amber-50 border border-amber-200 rounded-xl p-2 text-amber-900 font-bold">
                    🟡 注意 (25〜50mg)<br /><span className="text-[10px] font-normal text-amber-700">入眠遅延・中途覚醒リスク</span>
                  </div>
                  <div className="bg-red-50 border border-red-200 rounded-xl p-2 text-red-900 font-bold">
                    🔴 警戒 (&ge;50mg)<br /><span className="text-[10px] font-normal text-red-700">睡眠の質が大幅低下</span>
                  </div>
                </div>
              </div>

              <div className="space-y-1">
                <h4 className="font-bold text-stone-900 text-sm">2. 代謝半減期と体重の薬物動態学</h4>
                <p>
                  体重（分布容積 <em>V<sub>d</sub> ≈ 0.6〜0.7 L/kg</em>）は摂取直後の最高血中濃度（<em>C<sub>max</sub></em>）に影響しますが、カフェインが体内から抜けるスピード（消失速度定数 <em>k<sub>e</sub></em> および半減期 <em>t<sub>1/2</sub></em>）は主に肝臓の代謝酵素（<strong>CYP1A2</strong>）の活性に依存します。
                </p>
                <ul className="list-disc pl-5 space-y-0.5 text-[11px] text-stone-600">
                  <li><strong>標準体質（成人平均）</strong>: 半減期 約4.0時間（3.0〜5.0h）</li>
                  <li><strong>代謝迅速（喫煙等・CYP1A2誘導）</strong>: 半減期 約2.5時間（分解が速い）</li>
                  <li><strong>代謝遅延（敏感体質・ピル服用等）</strong>: 半減期 約6.0時間以上（分解が遅い）</li>
                </ul>
              </div>

              <div className="space-y-1">
                <h4 className="font-bold text-stone-900 text-sm">3. 経口吸収Batemanモデル & 高精度逆算</h4>
                <p>
                  常に経口吸収速度定数 <em>k<sub>a</sub> = 4.5 h<sup>-1</sup></em>（吸収半減期 約9分、ピーク約30〜40分）および飲用時間積分を適用。就寝前最終時刻や今飲める最大量の逆算にも漸近補正係数 <em>α</em> を組み込み、順方向シミュレーションと逆算値が理論的に完全整合します。
                </p>
              </div>

              <div className="space-y-1">
                <h4 className="font-bold text-stone-900 text-sm">4. ネスカフェ原単位モデル</h4>
                <p>
                  ネスカフェ・ゴールドブレンドの公式基準（および日本食品標準成分表）に基づき、<strong>顆粒粉末 1.0g あたり 40mg</strong> のカフェイン含有モデルを採用しています。
                </p>
                <ul className="list-disc pl-5 space-y-0.5 text-[11px] text-stone-600">
                  <li>ネスカフェ 軽め（1.0g）: 40mg</li>
                  <li>ネスカフェ 標準（2.0g）: 80mg</li>
                  <li>ネスカフェ 濃いめ（3.0g）: 120mg</li>
                </ul>
              </div>

              <div className="p-3 bg-stone-50 rounded-xl border border-stone-200 text-[10px] text-stone-500 space-y-1">
                <p>※ 本ツールは科学的文献に基づくシミュレーターであり、医療目的の診断やアドバイスを提供するものではありません。</p>
                <p>※「ネスカフェ」「ゴールドブレンド」「バリスタ」はネスレ日本株式会社、「モンスターエナジー」はMonster Energy Company、「レッドブル」はRed Bull GmbH、「コカ・コーラ」はThe Coca-Cola Company、「ペプシ」はPepsiCo, Inc.、「ドクターペッパー」はKeurig Dr Pepper Inc.の登録商標です。</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
