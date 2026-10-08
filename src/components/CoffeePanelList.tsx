import React, { useState } from 'react';
import { Plus, Check, MoreVertical } from 'lucide-react';
import type { BeveragePreset } from '../types/caffeine';
import { NescafeCoffeeCup } from './NescafeCoffeeCup';

interface CoffeePanelListProps {
  presets: BeveragePreset[];
  onAddEvent: (preset: BeveragePreset) => void;
  onOpenAddModal: () => void;
  onSelectPresetToEdit?: (preset: BeveragePreset) => void;
  onSelectPresetToConfirm?: (preset: BeveragePreset) => void;
  confirmBeforeAdd?: boolean;
  defaultDrinkingDuration?: number;
}

export const CoffeePanelList: React.FC<CoffeePanelListProps> = ({
  presets,
  onAddEvent,
  onOpenAddModal,
  onSelectPresetToEdit,
  onSelectPresetToConfirm,
  confirmBeforeAdd = true,
  defaultDrinkingDuration = 10,
}) => {
  const [justAddedId, setJustAddedId] = useState<string | null>(null);

  const formatDurationShort = (minutes: number = 10): string => {
    if (minutes < 60) return `${minutes}分`;
    const hours = Math.floor(minutes / 60);
    const rem = minutes % 60;
    if (rem === 0) return `${hours}時間`;
    return `${hours}.${Math.round((rem / 60) * 10)}時間`;
  };

  const handleCardClick = (preset: BeveragePreset) => {
    if (confirmBeforeAdd && onSelectPresetToConfirm) {
      onSelectPresetToConfirm(preset);
      return;
    }

    onAddEvent(preset);
    setJustAddedId(preset.id);
    setTimeout(() => {
      setJustAddedId(null);
    }, 1000);
  };

  return (
    <div className="space-y-2.5">
      {/* ヘッダー（右上の重複ボタンは削除し、末尾カードに一本化） */}
      <div className="flex items-center justify-between px-1">
        <span className="text-xs font-black text-stone-700">
          タップして指定時刻に追加
        </span>
        <span className="flex items-center space-x-0.5 text-[11px] text-stone-400 font-medium">
          <MoreVertical className="w-3 h-3 inline-block" />
          <span>で編集</span>
        </span>
      </div>

      {/* ネスカフェ＆エナドリ対応カードグリッド */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2.5">
        {presets.map((preset) => {
          const isAdded = justAddedId === preset.id;
          const isNative = preset.isNescafeNative;
          const duration = preset.drinkingDurationMinutes || defaultDrinkingDuration;

          return (
            <div
              key={preset.id}
              onClick={() => handleCardClick(preset)}
              className={`relative flex flex-col items-center justify-between p-3.5 rounded-2xl bg-white border transition-all duration-150 cursor-pointer select-none group active:scale-95 ${
                isAdded
                  ? 'border-emerald-500 bg-emerald-50/40 ring-2 ring-emerald-500/30'
                  : 'border-stone-200/90 hover:border-amber-800 hover:shadow-md hover:-translate-y-0.5'
              }`}
            >
              {/* パネル編集ボタン */}
              {onSelectPresetToEdit && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onSelectPresetToEdit(preset);
                  }}
                  className="absolute top-1.5 right-1.5 p-1 text-stone-400 hover:text-stone-800 hover:bg-stone-100 rounded-full opacity-60 group-hover:opacity-100 transition-opacity cursor-pointer"
                  title="パネルを編集・削除"
                >
                  <MoreVertical className="w-3.5 h-3.5" />
                </button>
              )}

              {/* カップ／缶／ボトル グラフィック */}
              <div className="py-1">
                <NescafeCoffeeCup
                  color={preset.color}
                  category={preset.category}
                  size="md"
                />
              </div>

              {/* レシピ名 */}
              <span className="text-xs font-bold text-stone-900 text-center line-clamp-1 mt-2">
                {preset.name}
              </span>

              {/* カフェイン量・粉末g / 内容量ml / 飲用時間 */}
              <div className="mt-1 flex items-center justify-center space-x-1 text-[10px] font-bold text-stone-500">
                {isNative && preset.powderGrams && (
                  <span>{preset.powderGrams}g</span>
                )}
                {preset.volumeMl && (
                  <span>{preset.volumeMl}ml</span>
                )}
                <span className="text-stone-300">/</span>
                <span className="text-stone-600 font-medium">{formatDurationShort(duration)}</span>
                <span className="text-xs font-black font-mono text-amber-900 bg-amber-50 px-1.5 py-0.5 rounded-md border border-amber-200/60 whitespace-nowrap shrink-0">
                  +{preset.caffeineMg}mg
                </span>
              </div>

              {/* 追加完了ポップアップ */}
              {isAdded && (
                <div className="absolute inset-0 flex items-center justify-center bg-emerald-600/95 rounded-2xl text-white font-bold text-xs shadow-lg animate-fadeIn">
                  <Check className="w-4 h-4 mr-1" /> 追加しました
                </div>
              )}
            </div>
          );
        })}

        {/* ドリンク追加 点線カード（一本化） */}
        <div
          onClick={onOpenAddModal}
          className="flex flex-col items-center justify-center p-3 rounded-2xl border-2 border-dashed border-stone-300 hover:border-amber-800 bg-white/50 hover:bg-amber-50/30 cursor-pointer transition-all min-h-[120px] active:scale-95"
        >
          <div className="w-8 h-8 rounded-full bg-stone-100 flex items-center justify-center text-stone-500 mb-1">
            <Plus className="w-4 h-4" />
          </div>
          <span className="text-xs font-bold text-stone-600">ドリンク追加</span>
        </div>
      </div>
    </div>
  );
};
