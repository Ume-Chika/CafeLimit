import React from 'react';
import { X, Settings, Coffee, Clock, ShieldCheck, Moon, RefreshCw, Trash2, Zap } from 'lucide-react';
import type { AppSettings, BeveragePreset } from '../types/caffeine';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: AppSettings;
  onChangeSettings: (settings: AppSettings) => void;
  presets: BeveragePreset[];
  onResetPresets?: () => void;
  onResetAllData?: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  settings,
  onChangeSettings,
  presets,
  onResetPresets,
  onResetAllData,
}) => {
  if (!isOpen) return null;

  const handleUnitChange = (unit: AppSettings['maxIntakeUnit']) => {
    onChangeSettings({
      ...settings,
      maxIntakeUnit: unit,
    });
  };

  const handleDeadlinePresetChange = (presetId: string) => {
    onChangeSettings({
      ...settings,
      deadlinePresetId: presetId,
    });
  };

  const handleThresholdChange = (threshold: number) => {
    onChangeSettings({
      ...settings,
      safeSleepThresholdMg: threshold,
    });
  };

  const handleToggleConfirm = () => {
    onChangeSettings({
      ...settings,
      confirmBeforeAdd: !settings.confirmBeforeAdd,
    });
  };

  const handleToggleFocusZone = () => {
    onChangeSettings({
      ...settings,
      showFocusZone: !settings.showFocusZone,
    });
  };

  const handleResetPresetsClick = () => {
    if (window.confirm('ドリンクパネル一覧を初期状態（ネスカフェ3種）に復元しますか？\n※ご自身で追加・編集したパネルはリセットされます。')) {
      if (onResetPresets) onResetPresets();
    }
  };

  const handleResetAllDataClick = () => {
    if (window.confirm('⚠️ 【完全初期化】\nすべての摂取履歴、追加したパネル、表示設定をリセットして初期状態に戻しますか？')) {
      if (onResetAllData) onResetAllData();
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3.5 sm:p-4 bg-stone-900/60 backdrop-blur-xs animate-fadeIn">
      <div
        className="bg-white rounded-3xl shadow-xl border border-stone-200 w-full max-w-md max-h-[90vh] overflow-y-auto flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* ヘッダー */}
        <div className="p-4 border-b border-stone-100 flex items-center justify-between sticky top-0 bg-white/95 backdrop-blur-xs z-10">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 rounded-xl bg-stone-100 text-stone-700 flex items-center justify-center">
              <Settings className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-black text-stone-900">アプリ表示設定</h3>
              <p className="text-[11px] text-stone-500">逆算インサイト・睡眠基準・データ管理</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-7 h-7 rounded-full hover:bg-stone-100 text-stone-400 hover:text-stone-700 flex items-center justify-center cursor-pointer transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* 設定フォーム */}
        <div className="p-4 sm:p-5 space-y-4 text-xs">
          {/* 1. 「今飲める最大量」の表示単位（プルダウン統一） */}
          <div className="p-3 bg-stone-50/70 rounded-2xl border border-stone-200/80 space-y-1.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-1.5 font-black text-stone-800">
                <Coffee className="w-4 h-4 text-amber-800" />
                <span>「今飲める最大量」の表示形式</span>
              </div>
            </div>
            <p className="text-[10px] text-stone-500">
              カードに表示する最大許容量の単位を選択します。
            </p>
            <select
              value={settings.maxIntakeUnit}
              onChange={(e) => handleUnitChange(e.target.value as AppSettings['maxIntakeUnit'])}
              className="w-full bg-white border border-stone-200 rounded-xl px-3 py-2 text-xs font-bold text-stone-900 focus:outline-none focus:ring-2 focus:ring-amber-500/20"
            >
              <option value="powder">ネスカフェ粉末量 (g)</option>
              <option value="caffeine">純カフェイン量 (mg)</option>
              <option value="preset">選択ドリンクの杯数・缶数 (杯/缶)</option>
            </select>
          </div>

          {/* 2. 「最終時刻」の対象ドリンク選択（プルダウン） */}
          <div className="p-3 bg-stone-50/70 rounded-2xl border border-stone-200/80 space-y-1.5">
            <div className="flex items-center space-x-1.5 font-black text-stone-800">
              <Clock className="w-4 h-4 text-sky-700" />
              <span>「最終時刻」の計算対象ドリンク</span>
            </div>
            <p className="text-[10px] text-stone-500">
              就寝前デッドライン（◯◯ 最終時刻）を逆算する基準ドリンクを指定します。
            </p>
            <select
              value={settings.deadlinePresetId}
              onChange={(e) => handleDeadlinePresetChange(e.target.value)}
              className="w-full bg-white border border-stone-200 rounded-xl px-3 py-2 text-xs font-bold text-stone-900 focus:outline-none focus:ring-2 focus:ring-sky-500/20"
            >
              {presets.map((preset) => (
                <option key={preset.id} value={preset.id}>
                  {preset.name} ({preset.caffeineMg}mg)
                </option>
              ))}
            </select>
          </div>

          {/* 3. 快眠目標閾値（安全上限）の選択（プルダウン） */}
          <div className="p-3 bg-stone-50/70 rounded-2xl border border-stone-200/80 space-y-1.5">
            <div className="flex items-center space-x-1.5 font-black text-stone-800">
              <Moon className="w-4 h-4 text-emerald-700" />
              <span>快眠安全基準（就寝時残存上限）</span>
            </div>
            <p className="text-[10px] text-stone-500">
              就寝時に目指すカフェイン残存量の上限を指定します。
            </p>
            <select
              value={settings.safeSleepThresholdMg || 25}
              onChange={(e) => handleThresholdChange(Number(e.target.value))}
              className="w-full bg-white border border-stone-200 rounded-xl px-3 py-2 text-xs font-bold text-stone-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
            >
              <option value={15}>敏感・厳格 (15mg以下で快眠)</option>
              <option value={25}>標準・EFSA基準 (25mg以下で快眠 / 推奨)</option>
              <option value={35}>寛容・耐性あり (35mg以下で快眠)</option>
              <option value={50}>高耐性 (50mg以下で快眠)</option>
            </select>
          </div>

          {/* 4. 日中の集中ゾーン表示（≥75mg / デフォルトOFF） */}
          <div
            onClick={handleToggleFocusZone}
            className="p-3 bg-stone-50/70 rounded-2xl border border-stone-200/80 flex items-center justify-between cursor-pointer hover:bg-stone-100/80 transition-all select-none"
          >
            <div>
              <div className="flex items-center space-x-1.5 font-bold text-stone-900 text-xs">
                <Zap className="w-3.5 h-3.5 text-yellow-500 fill-yellow-400" />
                <span>日中の集中ゾーン表示 (≥75mg)</span>
              </div>
              <span className="text-[10px] text-stone-500">EFSA基準の覚醒・集中ブースト域（経口吸収プロセス連動）をグラフに表示</span>
            </div>
            <div
              className={`w-11 h-6 flex items-center rounded-full p-1 transition-colors duration-200 ease-in-out ${
                settings.showFocusZone ? 'bg-amber-800' : 'bg-stone-300'
              }`}
            >
              <div
                className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform duration-200 ease-in-out ${
                  settings.showFocusZone ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </div>
          </div>

          {/* 5. パネルタップ時の確認ダイアログ（スタイリッシュトグル） */}
          <div
            onClick={handleToggleConfirm}
            className="p-3 bg-stone-50/70 rounded-2xl border border-stone-200/80 flex items-center justify-between cursor-pointer hover:bg-stone-100/80 transition-all select-none"
          >
            <div>
              <span className="font-bold text-stone-900 block text-xs">パネルタップ時の確認ダイアログ</span>
              <span className="text-[10px] text-stone-500">誤タップによる即時追加を防ぎます</span>
            </div>
            <div
              className={`w-11 h-6 flex items-center rounded-full p-1 transition-colors duration-200 ease-in-out ${
                settings.confirmBeforeAdd ? 'bg-amber-800' : 'bg-stone-300'
              }`}
            >
              <div
                className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform duration-200 ease-in-out ${
                  settings.confirmBeforeAdd ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </div>
          </div>

          {/* 5. データ管理・リセット */}
          <div className="p-3.5 bg-stone-100/60 rounded-2xl border border-stone-200/80 space-y-2.5">
            <div className="font-black text-stone-800 flex items-center space-x-1.5 text-xs">
              <RefreshCw className="w-3.5 h-3.5 text-stone-600" />
              <span>データ管理・復元</span>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={handleResetPresetsClick}
                className="p-2 bg-white hover:bg-stone-50 border border-stone-200 rounded-xl font-bold text-[11px] text-stone-700 flex items-center justify-center space-x-1 transition-all active:scale-95 cursor-pointer shadow-2xs"
              >
                <RefreshCw className="w-3 h-3 text-stone-500" />
                <span>パネル初期化</span>
              </button>

              <button
                type="button"
                onClick={handleResetAllDataClick}
                className="p-2 bg-white hover:bg-red-50 border border-red-200 rounded-xl font-bold text-[11px] text-red-600 flex items-center justify-center space-x-1 transition-all active:scale-95 cursor-pointer shadow-2xs"
              >
                <Trash2 className="w-3 h-3 text-red-500" />
                <span>全データ初期化</span>
              </button>
            </div>
          </div>

          {/* 6. 商標表記・法的免責事項 */}
          <div className="p-3 bg-stone-100/70 rounded-2xl border border-stone-200/80 space-y-1 text-[10px] text-stone-500 leading-relaxed">
            <div className="flex items-center space-x-1 font-bold text-stone-700 mb-0.5">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>商標および免責事項</span>
            </div>
            <p>
              ※「ネスカフェ」「ゴールドブレンド」「バリスタ」はネスレ日本株式会社の登録商標です。
            </p>
            <p>
              ※「モンスターエナジー」はMonster Energy Companyの登録商標です。「レッドブル」はRed Bull GmbHの登録商標です。
            </p>
            <p>
              ※「コカ・コーラ」はThe Coca-Cola Companyの登録商標です。「ペプシ」はPepsiCo, Inc.の登録商標です。「ドクターペッパー」はKeurig Dr Pepper Inc.の登録商標です。
            </p>
            <p>
              ※ 本アプリは個人開発の非公式カフェイン代謝シミュレーションツールであり、各権利者様とは一切関係ありません。
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
