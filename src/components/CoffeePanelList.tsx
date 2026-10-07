import React, { useState } from 'react';
import { Plus, Check, Trash2 } from 'lucide-react';
import type { BeveragePreset } from '../types/caffeine';
import { NescafeCoffeeCup } from './NescafeCoffeeCup';

interface CoffeePanelListProps {
  presets: BeveragePreset[];
  onAddEvent: (preset: BeveragePreset) => void;
  onOpenAddModal: () => void;
  onDeleteCustomPreset?: (presetId: string) => void;
}

export const CoffeePanelList: React.FC<CoffeePanelListProps> = ({
  presets,
  onAddEvent,
  onOpenAddModal,
  onDeleteCustomPreset,
}) => {
  const [justAddedId, setJustAddedId] = useState<string | null>(null);

  const handleCardClick = (preset: BeveragePreset) => {
    onAddEvent(preset);
    setJustAddedId(preset.id);
    setTimeout(() => {
      setJustAddedId(null);
    }, 1000);
  };

  return (
    <div className="space-y-2.5">
      <div className="flex items-center justify-between px-1">
        <span className="text-xs font-black text-stone-700">
          タップして指定時刻に追加
        </span>
        <button
          type="button"
          onClick={onOpenAddModal}
          className="text-xs font-bold text-amber-900 hover:text-amber-700 flex items-center space-x-1"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>他ドリンク追加</span>
        </button>
      </div>

      {/* ネスカフェ風カードグリッド */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2.5">
        {presets.map((preset) => {
          const isAdded = justAddedId === preset.id;
          const isNative = preset.isNescafeNative;

          return (
            <div
              key={preset.id}
              onClick={() => handleCardClick(preset)}
              className={`relative flex flex-col items-center justify-between p-3.5 rounded-2xl bg-white border transition-all duration-150 cursor-pointer select-none group active:scale-95 ${
                isAdded
                  ? 'border-emerald-500 bg-emerald-50/40 ring-2 ring-emerald-500/30'
                  : 'border-stone-200/90 hover:border-amber-700 hover:shadow-md hover:-translate-y-0.5'
              }`}
            >
              {/* 削除ボタン（デフォルト以外） */}
              {!['heiwa-capuchi', 'choiusu-capuchi', 'second-cup'].includes(preset.id) &&
                onDeleteCustomPreset && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onDeleteCustomPreset(preset.id);
                    }}
                    className="absolute top-1.5 right-1.5 p-1 text-stone-300 hover:text-red-500 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                    title="削除"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                )}

              {/* カップグラフィック */}
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

              {/* カフェイン量・粉末g */}
              <div className="mt-1 flex items-center space-x-1">
                {isNative && preset.powderGrams && (
                  <span className="text-[11px] font-bold text-stone-500">
                    {preset.powderGrams}g
                  </span>
                )}
                <span className="text-xs font-black font-mono text-amber-900 bg-amber-50 px-1.5 py-0.5 rounded-md border border-amber-200/60">
                  {preset.caffeineMg}mg
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

        {/* 点線追加カード */}
        <div
          onClick={onOpenAddModal}
          className="flex flex-col items-center justify-center p-3 rounded-2xl border-2 border-dashed border-stone-300 hover:border-amber-700 bg-white/50 hover:bg-amber-50/30 cursor-pointer transition-all min-h-[120px] active:scale-95"
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
