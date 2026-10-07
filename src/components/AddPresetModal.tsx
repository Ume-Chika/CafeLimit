import React, { useState } from 'react';
import { X, Plus, Sparkles, Check } from 'lucide-react';
import type { BeveragePreset, BeverageCategory } from '../types/caffeine';
import { EXPANDABLE_PRESETS } from '../data/presets';
import { NescafeCoffeeCup } from './NescafeCoffeeCup';

interface AddPresetModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddPresetToList: (preset: BeveragePreset) => void;
  existingPresetIds: string[];
}

export const AddPresetModal: React.FC<AddPresetModalProps> = ({
  isOpen,
  onClose,
  onAddPresetToList,
  existingPresetIds,
}) => {
  const [activeTab, setActiveTab] = useState<'presets' | 'custom'>('presets');

  // カスタムドリンクフォームの状態
  const [customName, setCustomName] = useState('');
  const [customCategory, setCustomCategory] = useState<BeverageCategory>('coffee');
  const [customCaffeineMg, setCustomCaffeineMg] = useState<number>(60);
  const [customPowderGrams, setCustomPowderGrams] = useState<number | undefined>(1.5);
  const [customWaterMl, setCustomWaterMl] = useState<number | undefined>(120);
  const [customColor, setCustomColor] = useState('#5C3317');

  if (!isOpen) return null;

  const handleAddExistingPreset = (preset: BeveragePreset) => {
    onAddPresetToList(preset);
  };

  const handleCreateCustom = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customName.trim() || customCaffeineMg <= 0) return;

    const newPreset: BeveragePreset = {
      id: `custom-${Date.now()}`,
      name: customName.trim(),
      category: customCategory,
      caffeineMg: Number(customCaffeineMg),
      powderGrams: customPowderGrams ? Number(customPowderGrams) : undefined,
      waterMl: customWaterMl ? Number(customWaterMl) : undefined,
      color: customColor,
      isNescafeNative: customCategory === 'nescafe',
      description: `カスタム登録 (${customCaffeineMg}mg)`,
    };

    onAddPresetToList(newPreset);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/60 backdrop-blur-xs animate-fadeIn">
      <div
        className="bg-white rounded-3xl shadow-xl border border-stone-200 w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* モーダルヘッダー */}
        <div className="px-6 py-4 border-b border-stone-100 flex items-center justify-between bg-stone-50/50">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 rounded-xl bg-amber-700 text-white flex items-center justify-center shadow-xs">
              <Plus className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-black text-stone-900">ドリンクパネルを追加</h3>
              <p className="text-xs text-stone-600">クイック摂取パネルに新しいドリンクを追加</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full hover:bg-stone-200 text-stone-400 hover:text-stone-700 flex items-center justify-center transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* タブ切り替え */}
        <div className="flex border-b border-stone-100 px-6 pt-2 bg-stone-50/30">
          <button
            type="button"
            onClick={() => setActiveTab('presets')}
            className={`pb-3 text-xs font-bold border-b-2 transition-all mr-6 ${
              activeTab === 'presets'
                ? 'border-amber-800 text-amber-900'
                : 'border-transparent text-stone-600 hover:text-stone-800'
            }`}
          >
            人気プリセットから選ぶ
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('custom')}
            className={`pb-3 text-xs font-bold border-b-2 transition-all ${
              activeTab === 'custom'
                ? 'border-amber-800 text-amber-900'
                : 'border-transparent text-stone-600 hover:text-stone-800'
            }`}
          >
            独自カスタム飲料を作成
          </button>
        </div>

        {/* モーダル本文 */}
        <div className="p-6 overflow-y-auto space-y-4">
          {activeTab === 'presets' ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {EXPANDABLE_PRESETS.map((preset) => {
                const isAlreadyAdded = existingPresetIds.includes(preset.id);
                return (
                  <div
                    key={preset.id}
                    className={`p-3.5 rounded-2xl border flex items-center justify-between transition-all ${
                      isAlreadyAdded
                        ? 'bg-stone-100/70 border-stone-200 opacity-60'
                        : 'bg-white border-stone-200 hover:border-amber-400 hover:shadow-sm'
                    }`}
                  >
                    <div className="flex items-center space-x-3">
                      <NescafeCoffeeCup
                        powderGrams={preset.powderGrams}
                        waterMl={preset.waterMl}
                        color={preset.color}
                        category={preset.category}
                        size="sm"
                      />
                      <div>
                        <h4 className="text-xs font-bold text-stone-800 leading-tight">
                          {preset.name}
                        </h4>
                        <p className="text-[10px] text-stone-600 line-clamp-1">
                          {preset.description}
                        </p>
                        <span className="text-[11px] font-mono font-bold text-amber-900">
                          {preset.caffeineMg} mg
                        </span>
                      </div>
                    </div>

                    <button
                      type="button"
                      disabled={isAlreadyAdded}
                      onClick={() => handleAddExistingPreset(preset)}
                      className={`p-2 rounded-xl text-xs font-bold transition-all ${
                        isAlreadyAdded
                          ? 'bg-stone-200 text-stone-500 cursor-not-allowed'
                          : 'bg-amber-100 text-amber-900 hover:bg-amber-700 hover:text-white active:scale-95'
                      }`}
                      title={isAlreadyAdded ? '追加済み' : 'パネルに追加'}
                    >
                      {isAlreadyAdded ? (
                        <Check className="w-4 h-4 text-stone-500" />
                      ) : (
                        <Plus className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                );
              })}
            </div>
          ) : (
            /* カスタム作成フォーム */
            <form onSubmit={handleCreateCustom} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">
                  ドリンク名 *
                </label>
                <input
                  type="text"
                  required
                  placeholder="例: マグカップ2杯目、特製ブレンド"
                  value={customName}
                  onChange={(e) => setCustomName(e.target.value)}
                  className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-xl text-xs font-medium text-stone-900 focus:outline-none focus:ring-2 focus:ring-amber-500/20"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1">
                    カテゴリー
                  </label>
                  <select
                    value={customCategory}
                    onChange={(e) => setCustomCategory(e.target.value as BeverageCategory)}
                    className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-xl text-xs font-medium text-stone-900 focus:outline-none focus:ring-2 focus:ring-amber-500/20"
                  >
                    <option value="coffee">コーヒー</option>
                    <option value="nescafe">ネスカフェ</option>
                    <option value="energy">エナジードリンク</option>
                    <option value="tea">お茶・紅茶</option>
                    <option value="soda">炭酸飲料・コーラ</option>
                    <option value="custom">その他</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1">
                    カフェイン量 (mg) *
                  </label>
                  <input
                    type="number"
                    required
                    min="0"
                    max="500"
                    value={customCaffeineMg}
                    onChange={(e) => setCustomCaffeineMg(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-xl text-xs font-mono font-bold text-stone-900 focus:outline-none focus:ring-2 focus:ring-amber-500/20"
                  />
                </div>
              </div>

              {/* ネスカフェ・コーヒー用詳細設定 */}
              {(customCategory === 'coffee' || customCategory === 'nescafe') && (
                <div className="p-3 bg-amber-50/50 rounded-2xl border border-amber-200/50 space-y-3">
                  <span className="text-[11px] font-bold text-amber-900 block">
                    コーヒー詳細パラメータ（任意）
                  </span>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-medium text-stone-600 mb-1">
                        粉末量 (g)
                      </label>
                      <input
                        type="number"
                        step="0.1"
                        min="0"
                        max="20"
                        placeholder="例: 2.0"
                        value={customPowderGrams || ''}
                        onChange={(e) => {
                          const val = e.target.value ? Number(e.target.value) : undefined;
                          setCustomPowderGrams(val);
                          // ネスカフェならカフェイン量(40mg/g)を自動同期提案
                          if (val && customCategory === 'nescafe') {
                            setCustomCaffeineMg(Math.round(val * 40));
                          }
                        }}
                        className="w-full px-2.5 py-1.5 bg-white border border-stone-200 rounded-lg text-xs font-mono"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-medium text-stone-600 mb-1">
                        湯量 (ml)
                      </label>
                      <input
                        type="number"
                        step="10"
                        min="0"
                        max="1000"
                        placeholder="例: 140"
                        value={customWaterMl || ''}
                        onChange={(e) =>
                          setCustomWaterMl(e.target.value ? Number(e.target.value) : undefined)
                        }
                        className="w-full px-2.5 py-1.5 bg-white border border-stone-200 rounded-lg text-xs font-mono"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* カラー選択 */}
              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">
                  テーマカラー
                </label>
                <div className="flex items-center space-x-2">
                  {['#5C3317', '#8B5A2B', '#10B981', '#3B82F6', '#EF4444', '#6D28D9'].map((c) => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setCustomColor(c)}
                      className={`w-7 h-7 rounded-full transition-transform ${
                        customColor === c ? 'ring-2 ring-stone-800 scale-110' : 'opacity-80 hover:opacity-100'
                      }`}
                      style={{ backgroundColor: c }}
                    />
                  ))}
                </div>
              </div>

              {/* 送信ボタン */}
              <div className="pt-2">
                <button
                  type="submit"
                  className="w-full py-2.5 bg-amber-700 hover:bg-amber-800 text-white text-xs font-black rounded-xl shadow-sm transition-all active:scale-[0.98] flex items-center justify-center space-x-1.5"
                >
                  <Sparkles className="w-4 h-4" />
                  <span>カスタムドリンクを登録</span>
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
