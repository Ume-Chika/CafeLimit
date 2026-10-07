import React from 'react';
import { X, Settings, Coffee, Clock, ShieldCheck, Check } from 'lucide-react';
import type { AppSettings, BeveragePreset } from '../types/caffeine';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: AppSettings;
  onChangeSettings: (settings: AppSettings) => void;
  presets: BeveragePreset[];
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  settings,
  onChangeSettings,
  presets,
}) => {
  if (!isOpen) return null;

  const unitOptions = [
    {
      id: 'powder' as const,
      label: '粉末量 (g)',
      desc: 'ネスカフェ粉末グラム数（例: 16.5g）で表示',
    },
    {
      id: 'caffeine' as const,
      label: 'カフェイン量 (mg)',
      desc: '純カフェインmg数（例: 660mg）で表示',
    },
    {
      id: 'preset' as const,
      label: '選択ドリンクの杯数・缶数',
      desc: '設定中の基準ドリンク換算（例: 約8.2杯 / 4.6缶）で表示',
    },
  ];

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

  const handleToggleConfirm = () => {
    onChangeSettings({
      ...settings,
      confirmBeforeAdd: !settings.confirmBeforeAdd,
    });
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
              <p className="text-[11px] text-stone-500">逆算インサイトや操作確認のカスタマイズ</p>
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
        <div className="p-4 sm:p-5 space-y-5 text-xs">
          {/* 1. 「今飲める最大量」の表示単位 */}
          <div className="space-y-2">
            <div className="flex items-center space-x-1.5 font-black text-stone-800">
              <Coffee className="w-4 h-4 text-amber-800" />
              <span>「今飲める最大量」の表示形式</span>
            </div>
            <div className="space-y-1.5">
              {unitOptions.map((opt) => {
                const isSelected = settings.maxIntakeUnit === opt.id;
                return (
                  <div
                    key={opt.id}
                    onClick={() => handleUnitChange(opt.id)}
                    className={`p-2.5 rounded-xl border transition-all cursor-pointer flex items-center justify-between ${
                      isSelected
                        ? 'bg-amber-50/80 border-amber-800/80 ring-1 ring-amber-700/30'
                        : 'bg-stone-50/60 border-stone-200/80 hover:bg-stone-100'
                    }`}
                  >
                    <div>
                      <span className="font-bold text-stone-900 block">{opt.label}</span>
                      <span className="text-[10px] text-stone-500">{opt.desc}</span>
                    </div>
                    {isSelected && (
                      <div className="w-4 h-4 rounded-full bg-amber-800 text-white flex items-center justify-center shrink-0">
                        <Check className="w-2.5 h-2.5" />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* 2. 「最終時刻」の対象ドリンク選択 */}
          <div className="space-y-2">
            <div className="flex items-center space-x-1.5 font-black text-stone-800">
              <Clock className="w-4 h-4 text-sky-700" />
              <span>「最終時刻」の計算対象ドリンク</span>
            </div>
            <p className="text-[11px] text-stone-500">
              カードに表示する「◯◯ 最終時刻」の対象プリセットを指定します。
            </p>
            <select
              value={settings.deadlinePresetId}
              onChange={(e) => handleDeadlinePresetChange(e.target.value)}
              className="w-full bg-stone-50 border border-stone-200 rounded-xl px-3 py-2 text-xs font-bold text-stone-900 focus:outline-none focus:ring-2 focus:ring-sky-500/20"
            >
              {presets.map((preset) => (
                <option key={preset.id} value={preset.id}>
                  {preset.name} ({preset.caffeineMg}mg)
                </option>
              ))}
            </select>
          </div>

          {/* 3. パネルタップ時の誤タップ防止確認 */}
          <div className="space-y-2 pt-2 border-t border-stone-100">
            <div
              onClick={handleToggleConfirm}
              className="flex items-center justify-between p-3 rounded-2xl bg-stone-50 border border-stone-200 cursor-pointer hover:bg-stone-100/80 transition-all"
            >
              <div>
                <span className="font-bold text-stone-900 block">パネルタップ時の確認ダイアログ</span>
                <span className="text-[10px] text-stone-500">誤タップによる即時追加を防ぎます</span>
              </div>
              <input
                type="checkbox"
                checked={settings.confirmBeforeAdd}
                onChange={handleToggleConfirm}
                className="w-4 h-4 accent-amber-800 cursor-pointer"
              />
            </div>
          </div>

          {/* 4. 商標表記・法的免責事項 */}
          <div className="p-3 bg-stone-100/70 rounded-2xl border border-stone-200/80 space-y-1.5 text-[10px] text-stone-500 leading-relaxed">
            <div className="flex items-center space-x-1 font-bold text-stone-700">
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
              ※ 本アプリは個人開発の非公式カフェイン代謝シミュレーションツールであり、各権利者様とは一切関係ありません。
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
