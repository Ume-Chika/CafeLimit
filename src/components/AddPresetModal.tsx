import React, { useState } from 'react';
import { X, Plus, ChevronLeft, ChevronRight, Check, Sparkles } from 'lucide-react';
import type { BeveragePreset, BeverageCategory } from '../types/caffeine';
import { BEVERAGE_TYPE_GROUPS } from '../data/presets';
import type { BeverageTypeGroup, PresetOptionItem } from '../data/presets';
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
  const [selectedGroup, setSelectedGroup] = useState<BeverageTypeGroup | null>(null);
  const [isCustomMode, setIsCustomMode] = useState(false);

  // カスタム入力フォーム用
  const [customName, setCustomName] = useState('');
  const [customCaffeineMg, setCustomCaffeineMg] = useState(80);
  const [customCategory, setCustomCategory] = useState<BeverageCategory>('coffee');
  const [customColor, setCustomColor] = useState('#3E2415');

  if (!isOpen) return null;

  const handleSelectOption = (opt: PresetOptionItem) => {
    // ユーザーに名前の入力を求めず、即座に追加してモーダルを閉じる
    const newPreset: BeveragePreset = {
      id: `${opt.id}-${Date.now().toString().slice(-4)}`,
      name: opt.name,
      category: opt.category,
      caffeineMg: opt.caffeineMg,
      powderGrams: opt.powderGrams,
      volumeMl: opt.volumeMl,
      waterMl: opt.waterMl,
      foamMl: opt.foamMl,
      brand: opt.brand,
      description: opt.description,
      color: opt.color,
      isNescafeNative: opt.isNescafeNative,
    };

    onAddPresetToList(newPreset);
    handleClose();
  };

  const handleCreateCustom = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customName.trim() || customCaffeineMg <= 0) return;

    const newPreset: BeveragePreset = {
      id: `custom-${Date.now()}`,
      name: customName.trim(),
      category: customCategory,
      caffeineMg: Number(customCaffeineMg),
      color: customColor,
      isNescafeNative: customCategory === 'nescafe',
      description: `カスタム (${customCaffeineMg}mg)`,
    };

    onAddPresetToList(newPreset);
    handleClose();
  };

  const handleClose = () => {
    setSelectedGroup(null);
    setIsCustomMode(false);
    onClose();
  };

  // ネスカフェ等のサブグループ分け
  const renderGroupedOptions = (group: BeverageTypeGroup) => {
    // subGroup ごとにまとめる
    const subGroups: { [key: string]: PresetOptionItem[] } = {};
    const noSubGroup: PresetOptionItem[] = [];

    group.options.forEach((opt) => {
      if (opt.subGroup) {
        if (!subGroups[opt.subGroup]) {
          subGroups[opt.subGroup] = [];
        }
        subGroups[opt.subGroup].push(opt);
      } else {
        noSubGroup.push(opt);
      }
    });

    const hasSubGroups = Object.keys(subGroups).length > 0;

    return (
      <div className="space-y-4">
        {hasSubGroups ? (
          Object.entries(subGroups).map(([subTitle, items]) => (
            <div key={subTitle} className="space-y-2">
              <div className="text-[11px] font-black text-stone-500 uppercase tracking-wider px-1">
                {subTitle}
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {items.map((opt) => renderOptionCard(opt))}
              </div>
            </div>
          ))
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {noSubGroup.map((opt) => renderOptionCard(opt))}
          </div>
        )}
      </div>
    );
  };

  const renderOptionCard = (opt: PresetOptionItem) => {
    const isAlreadyAdded = existingPresetIds.some((id) => id.startsWith(opt.id) || id === opt.id);

    return (
      <button
        key={opt.id}
        type="button"
        onClick={() => handleSelectOption(opt)}
        className={`w-full text-left p-3 rounded-2xl border transition-all flex items-center justify-between cursor-pointer group ${
          isAlreadyAdded
            ? 'bg-amber-50/40 border-amber-300/80 hover:bg-amber-50/70'
            : 'bg-stone-50/80 hover:bg-white border-stone-200/90 hover:border-amber-700 hover:shadow-xs hover:scale-[1.01] active:scale-[0.99]'
        }`}
      >
        <div className="flex items-center space-x-2.5">
          <NescafeCoffeeCup
            color={opt.color}
            category={opt.category}
            size="sm"
          />
          <div>
            <div className="text-xs font-bold text-stone-900 group-hover:text-amber-900 transition-colors flex items-center space-x-1.5">
              <span>{opt.amountLabel}</span>
              {isAlreadyAdded && (
                <span className="text-[9px] font-bold text-amber-800 bg-amber-100/80 px-1 py-0.2 rounded">
                  登録中
                </span>
              )}
            </div>
            <div className="text-[10px] text-stone-500 line-clamp-1">
              {opt.description}
            </div>
          </div>
        </div>

        <div className="flex items-center space-x-1.5 shrink-0 pl-2">
          <span className="text-xs font-black font-mono text-amber-900 bg-amber-50 px-2 py-0.5 rounded-lg border border-amber-200/60 whitespace-nowrap shrink-0">
            {opt.caffeineMg} mg
          </span>
          <div
            className={`w-6 h-6 rounded-full flex items-center justify-center transition-colors ${
              isAlreadyAdded
                ? 'bg-amber-600 text-white'
                : 'bg-stone-200/70 group-hover:bg-[#3E271E] group-hover:text-white text-stone-600'
            }`}
          >
            {isAlreadyAdded ? <Check className="w-3.5 h-3.5" /> : <Plus className="w-3.5 h-3.5" />}
          </div>
        </div>
      </button>
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3.5 sm:p-4 bg-stone-900/60 backdrop-blur-xs animate-fadeIn">
      <div
        className="bg-white rounded-3xl shadow-xl border border-stone-200 w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* モーダルヘッダー */}
        <div className="px-5 py-3.5 border-b border-stone-100 flex items-center justify-between bg-stone-50/70 sticky top-0 z-10">
          <div className="flex items-center space-x-2">
            {(selectedGroup || isCustomMode) ? (
              <button
                type="button"
                onClick={() => {
                  setSelectedGroup(null);
                  setIsCustomMode(false);
                }}
                className="w-7 h-7 rounded-xl bg-stone-200 hover:bg-stone-300 text-stone-700 flex items-center justify-center transition-colors cursor-pointer mr-1"
                title="種類を選び直す"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
            ) : (
              <div className="w-7 h-7 rounded-xl bg-[#3E271E] text-white flex items-center justify-center shadow-xs">
                <Plus className="w-4 h-4" />
              </div>
            )}
            <div>
              <h3 className="text-sm font-black text-stone-900">
                {isCustomMode
                  ? '自由指定ドリンクを登録'
                  : selectedGroup
                  ? `${selectedGroup.name} の量を選択`
                  : 'ドリンクの種類を選択'}
              </h3>
              <p className="text-[11px] text-stone-500">
                {isCustomMode
                  ? '任意の名前とカフェイン量を登録'
                  : selectedGroup
                  ? 'タップすると即座にパネルに追加されます'
                  : '種類を選び、続けてサイズ・量を選択します'}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleClose}
            className="w-7 h-7 rounded-full hover:bg-stone-100 text-stone-400 hover:text-stone-700 flex items-center justify-center transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* モーダル本文 */}
        <div className="p-4 sm:p-5 overflow-y-auto max-h-[calc(90vh-70px)] text-xs">
          {/* Step 1: 種類選択 */}
          {!selectedGroup && !isCustomMode && (
            <div className="space-y-2.5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {BEVERAGE_TYPE_GROUPS.map((group) => (
                  <button
                    key={group.id}
                    type="button"
                    onClick={() => setSelectedGroup(group)}
                    className="w-full text-left p-3.5 rounded-2xl bg-stone-50 hover:bg-amber-50/40 border border-stone-200/90 hover:border-amber-700 hover:shadow-xs transition-all flex items-center justify-between cursor-pointer group active:scale-[0.99]"
                  >
                    <div className="flex items-center space-x-3">
                      <NescafeCoffeeCup
                        color={group.color}
                        category={group.category}
                        size="md"
                      />
                      <div>
                        <div className="text-xs font-black text-stone-900 group-hover:text-amber-900 transition-colors">
                          {group.name}
                        </div>
                        <div className="text-[10px] text-stone-500 line-clamp-1 mt-0.5">
                          {group.description}
                        </div>
                        <div className="text-[10px] font-mono font-bold text-amber-900 mt-1">
                          目安: {group.rangeLabel}
                        </div>
                      </div>
                    </div>

                    <div className="w-6 h-6 rounded-full bg-stone-200/70 group-hover:bg-[#3E271E] group-hover:text-white flex items-center justify-center text-stone-500 transition-colors shrink-0 ml-2">
                      <ChevronRight className="w-3.5 h-3.5" />
                    </div>
                  </button>
                ))}
              </div>

              {/* 自由指定（mg直接入力）のトリガー */}
              <div className="pt-1">
                <button
                  type="button"
                  onClick={() => setIsCustomMode(true)}
                  className="w-full p-2.5 rounded-xl border border-dashed border-stone-300 hover:border-stone-500 text-stone-600 hover:text-stone-900 text-center font-bold flex items-center justify-center space-x-1.5 transition-colors cursor-pointer"
                >
                  <Sparkles className="w-3.5 h-3.5 text-amber-700" />
                  <span>mgを直接入力して自由登録</span>
                </button>
              </div>
            </div>
          )}

          {/* Step 2: 量（サイズ）選択 */}
          {selectedGroup && !isCustomMode && (
            <div className="space-y-4">
              <div className="p-3 bg-amber-50/50 rounded-2xl border border-amber-200/60 flex items-center justify-between">
                <div className="flex items-center space-x-2.5">
                  <NescafeCoffeeCup
                    color={selectedGroup.color}
                    category={selectedGroup.category}
                    size="sm"
                  />
                  <div>
                    <span className="text-xs font-black text-amber-950">
                      {selectedGroup.name}
                    </span>
                    <p className="text-[10px] text-amber-900/80">
                      お好みの量・サイズをタップしてください
                    </p>
                  </div>
                </div>
                <span className="text-[11px] font-mono font-bold text-amber-900 bg-white/80 px-2 py-0.5 rounded-lg border border-amber-200">
                  {selectedGroup.options.length} 種類
                </span>
              </div>

              {renderGroupedOptions(selectedGroup)}
            </div>
          )}

          {/* 自由指定フォーム */}
          {isCustomMode && (
            <form onSubmit={handleCreateCustom} className="space-y-3.5">
              <div>
                <label className="block text-stone-700 font-bold mb-1">
                  ドリンク名 *
                </label>
                <input
                  type="text"
                  required
                  placeholder="例: 特製ブレンド、特大エナジー"
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
                    onChange={(e) => {
                      const cat = e.target.value as BeverageCategory;
                      setCustomCategory(cat);
                      if (cat === 'nescafe') setCustomColor('#5C3826');
                      else if (cat === 'energy') setCustomColor('#10B981');
                      else if (cat === 'coffee') setCustomColor('#3E2415');
                      else if (cat === 'tea') setCustomColor('#15803D');
                      else if (cat === 'soda') setCustomColor('#DC2626');
                    }}
                    className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-xl font-bold text-stone-900 focus:outline-none"
                  >
                    <option value="coffee">コーヒー</option>
                    <option value="nescafe">ネスカフェ</option>
                    <option value="energy">エナジードリンク</option>
                    <option value="tea">お茶・紅茶</option>
                    <option value="soda">コーラ・炭酸</option>
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
                    max="600"
                    value={customCaffeineMg}
                    onChange={(e) => setCustomCaffeineMg(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-xl font-mono font-bold text-stone-900 focus:outline-none"
                  />
                </div>
              </div>

              {/* カラー選択 */}
              <div>
                <label className="block text-stone-700 font-bold mb-1">
                  テーマカラー
                </label>
                <div className="flex items-center space-x-2">
                  {['#5C3826', '#3E2415', '#10B981', '#059669', '#3B82F6', '#2563EB', '#DC2626', '#15803D'].map((c) => (
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
                  <span>登録してパネルに追加</span>
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
