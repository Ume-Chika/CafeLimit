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
  const [customCategory, setCustomCategory] = useState<BeverageCategory>('energy');
  const [customCaffeineMg, setCustomCaffeineMg] = useState<number>(142);
  const [customPowderGrams, setCustomPowderGrams] = useState<number | undefined>(2.0);
  const [customVolumeMl, setCustomVolumeMl] = useState<number | undefined>(355);
  const [customColor, setCustomColor] = useState('#10B981');

  if (!isOpen) return null;

  const handleAddExistingPreset = (preset: BeveragePreset) => {
    onAddPresetToList(preset);
  };

  const handleCategoryChange = (cat: BeverageCategory) => {
    setCustomCategory(cat);
    if (cat === 'nescafe') {
      setCustomColor('#5C3826');
      setCustomPowderGrams(2.0);
      setCustomCaffeineMg(80);
    } else if (cat === 'energy') {
      setCustomColor('#10B981');
      setCustomVolumeMl(355);
      setCustomCaffeineMg(142);
    } else if (cat === 'coffee') {
      setCustomColor('#3E2415');
      setCustomVolumeMl(150);
      setCustomCaffeineMg(90);
    } else if (cat === 'tea') {
      setCustomColor('#15803D');
      setCustomVolumeMl(500);
      setCustomCaffeineMg(100);
    } else if (cat === 'soda') {
      setCustomColor('#DC2626');
      setCustomVolumeMl(350);
      setCustomCaffeineMg(35);
    }
  };

  const handleCreateCustom = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customName.trim() || customCaffeineMg <= 0) return;

    const newPreset: BeveragePreset = {
      id: `custom-${Date.now()}`,
      name: customName.trim(),
      category: customCategory,
      caffeineMg: Number(customCaffeineMg),
      powderGrams: customCategory === 'nescafe' ? customPowderGrams : undefined,
      volumeMl: customCategory !== 'nescafe' ? customVolumeMl : undefined,
      color: customColor,
      isNescafeNative: customCategory === 'nescafe',
      description: `カスタム登録 (${customCaffeineMg}mg)`,
    };

    onAddPresetToList(newPreset);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3.5 sm:p-4 bg-stone-900/60 backdrop-blur-xs animate-fadeIn">
      <div
        className="bg-white rounded-3xl shadow-xl border border-stone-200 w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* モーダルヘッダー */}
        <div className="px-5 py-4 border-b border-stone-100 flex items-center justify-between bg-stone-50/50 sticky top-0 bg-white/95 backdrop-blur-xs z-10">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 rounded-xl bg-[#3E271E] text-white flex items-center justify-center shadow-xs">
              <Plus className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-black text-stone-900">ドリンクパネルを追加</h3>
              <p className="text-[11px] text-stone-500">人気商品から選ぶか、カスタム登録</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-7 h-7 rounded-full hover:bg-stone-100 text-stone-400 hover:text-stone-700 flex items-center justify-center transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* タブ切り替え */}
        <div className="flex border-b border-stone-100 px-5 pt-2 bg-stone-50/30">
          <button
            type="button"
            onClick={() => setActiveTab('presets')}
            className={`pb-2.5 text-xs font-bold border-b-2 transition-all mr-5 cursor-pointer ${
              activeTab === 'presets'
                ? 'border-[#3E271E] text-[#3E271E]'
                : 'border-transparent text-stone-500 hover:text-stone-800'
            }`}
          >
            人気プリセット（モンエナ・エナドリ等）
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('custom')}
            className={`pb-2.5 text-xs font-bold border-b-2 transition-all cursor-pointer ${
              activeTab === 'custom'
                ? 'border-[#3E271E] text-[#3E271E]'
                : 'border-transparent text-stone-500 hover:text-stone-800'
            }`}
          >
            独自カスタム飲料を作成
          </button>
        </div>

        {/* モーダル本文 */}
        <div className="p-5 overflow-y-auto space-y-3.5 text-xs">
          {activeTab === 'presets' ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {EXPANDABLE_PRESETS.map((preset) => {
                const isAlreadyAdded = existingPresetIds.includes(preset.id);
                return (
                  <div
                    key={preset.id}
                    className={`p-3 rounded-2xl border flex items-center justify-between transition-all ${
                      isAlreadyAdded
                        ? 'bg-stone-50/80 border-stone-200 opacity-60'
                        : 'bg-white border-stone-200 hover:border-amber-700 hover:shadow-xs'
                    }`}
                  >
                    <div className="flex items-center space-x-2.5">
                      <NescafeCoffeeCup
                        color={preset.color}
                        category={preset.category}
                        size="sm"
                      />
                      <div>
                        <h4 className="text-xs font-bold text-stone-900 leading-tight">
                          {preset.name}
                        </h4>
                        <p className="text-[10px] text-stone-500 line-clamp-1">
                          {preset.description}
                        </p>
                        <span className="text-[11px] font-mono font-black text-amber-900">
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
                          ? 'bg-stone-200 text-stone-400 cursor-not-allowed'
                          : 'bg-stone-100 text-stone-800 hover:bg-[#3E271E] hover:text-white active:scale-95 cursor-pointer'
                      }`}
                      title={isAlreadyAdded ? '追加済み' : 'パネルに追加'}
                    >
                      {isAlreadyAdded ? (
                        <Check className="w-3.5 h-3.5 text-stone-500" />
                      ) : (
                        <Plus className="w-3.5 h-3.5" />
                      )}
                    </button>
                  </div>
                );
              })}
            </div>
          ) : (
            /* カスタム作成フォーム */
            <form onSubmit={handleCreateCustom} className="space-y-3.5">
              <div>
                <label className="block text-stone-700 font-bold mb-1">
                  ドリンク名 *
                </label>
                <input
                  type="text"
                  required
                  placeholder="例: モンエナ 500ml、特製ブレンド"
                  value={customName}
                  onChange={(e) => setCustomName(e.target.value)}
                  className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-xl font-bold text-stone-900 focus:outline-none focus:ring-2 focus:ring-amber-500/20"
                />
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="block text-stone-700 font-bold mb-1">
                    カテゴリー
                  </label>
                  <select
                    value={customCategory}
                    onChange={(e) => handleCategoryChange(e.target.value as BeverageCategory)}
                    className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-xl font-bold text-stone-900 focus:outline-none"
                  >
                    <option value="energy">エナジードリンク</option>
                    <option value="nescafe">ネスカフェ</option>
                    <option value="coffee">レギュラーコーヒー</option>
                    <option value="tea">お茶・緑茶</option>
                    <option value="soda">炭酸・コーラ</option>
                    <option value="custom">その他</option>
                  </select>
                </div>

                <div>
                  <label className="block text-stone-700 font-bold mb-1">
                    カフェイン量 (mg) *
                  </label>
                  <input
                    type="number"
                    required
                    min="0"
                    max="500"
                    value={customCaffeineMg}
                    onChange={(e) => setCustomCaffeineMg(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-xl font-mono font-bold text-stone-900 focus:outline-none"
                  />
                </div>
              </div>

              {/* ネスカフェ / エナドリ詳細設定 */}
              {customCategory === 'nescafe' ? (
                <div className="p-3 bg-amber-50/60 rounded-2xl border border-amber-200/60 space-y-1">
                  <label className="block text-[11px] font-bold text-amber-900 mb-1">
                    粉末量 (g) — 1gあたり約40mg
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    min="0.5"
                    max="10"
                    value={customPowderGrams || 2.0}
                    onChange={(e) => {
                      const val = Number(e.target.value);
                      setCustomPowderGrams(val);
                      setCustomCaffeineMg(Math.round(val * 40));
                    }}
                    className="w-full px-2.5 py-1.5 bg-white border border-stone-200 rounded-xl font-mono font-bold"
                  />
                </div>
              ) : (
                <div className="p-3 bg-stone-50 rounded-2xl border border-stone-200 space-y-1">
                  <label className="block text-[11px] font-bold text-stone-600 mb-1">
                    内容量 (ml)
                  </label>
                  <input
                    type="number"
                    step="5"
                    min="10"
                    max="2000"
                    value={customVolumeMl || 355}
                    onChange={(e) => setCustomVolumeMl(Number(e.target.value))}
                    className="w-full px-2.5 py-1.5 bg-white border border-stone-200 rounded-xl font-mono font-bold"
                  />
                </div>
              )}

              {/* カラー選択 */}
              <div>
                <label className="block text-stone-700 font-bold mb-1">
                  テーマカラー
                </label>
                <div className="flex items-center space-x-2">
                  {['#10B981', '#059669', '#3B82F6', '#2563EB', '#EF4444', '#F43F5E', '#5C3826', '#3E2415'].map((c) => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setCustomColor(c)}
                      className={`w-7 h-7 rounded-full border-2 transition-transform cursor-pointer ${
                        customColor === c ? 'scale-115 border-stone-900 shadow-xs' : 'border-white'
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
                  className="w-full py-2.5 bg-[#3E271E] hover:bg-stone-800 text-white font-black rounded-xl shadow-xs transition-all active:scale-[0.98] flex items-center justify-center space-x-1.5 cursor-pointer"
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
