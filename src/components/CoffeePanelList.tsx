import React, { useState } from 'react';
import { Plus, Check, Heart, Trash2 } from 'lucide-react';
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
  const [activeTab, setActiveTab] = useState<'standard' | 'myrecipes'>('myrecipes');
  const [selectedPresetId, setSelectedPresetId] = useState<string>(presets[0]?.id || 'heiwa-capuchi');
  const [justBrewedId, setJustBrewedId] = useState<string | null>(null);

  // 選択中プリセットの詳細調整用ローカルステート
  const currentPreset = presets.find((p) => p.id === selectedPresetId) || presets[0];
  const [customPowderLevel, setCustomPowderLevel] = useState<'few' | 'normal' | 'many'>('normal');
  const [customWaterMl, setCustomWaterMl] = useState<number>(currentPreset?.waterMl || 120);
  const [customFoamMl, setCustomFoamMl] = useState<number>(currentPreset?.foamMl ?? 40);

  // プリセット切り替え時に調整値を初期化
  const handleSelectCard = (preset: BeveragePreset) => {
    setSelectedPresetId(preset.id);
    if (preset.powderGrams === 1) setCustomPowderLevel('few');
    else if (preset.powderGrams === 3) setCustomPowderLevel('many');
    else setCustomPowderLevel('normal');

    setCustomWaterMl(preset.waterMl || 120);
    setCustomFoamMl(preset.foamMl ?? 0);
  };

  // 粉末レベル変更
  const handlePowderLevelChange = (level: 'few' | 'normal' | 'many') => {
    setCustomPowderLevel(level);
  };

  const getPowderGrams = () => {
    if (customPowderLevel === 'few') return 1.0;
    if (customPowderLevel === 'many') return 3.0;
    return 2.0;
  };

  const getCaffeineMg = () => {
    if (!currentPreset) return 80;
    if (currentPreset.isNescafeNative) {
      return getPowderGrams() * 40;
    }
    return currentPreset.caffeineMg;
  };

  // 「淹れる」ボタン押下
  const handleBrew = () => {
    if (!currentPreset) return;
    const brewedPreset: BeveragePreset = {
      ...currentPreset,
      powderGrams: currentPreset.isNescafeNative ? getPowderGrams() : currentPreset.powderGrams,
      caffeineMg: getCaffeineMg(),
      waterMl: customWaterMl,
      foamMl: customFoamMl,
    };

    onAddEvent(brewedPreset);
    setJustBrewedId(currentPreset.id);
    setTimeout(() => {
      setJustBrewedId(null);
    }, 1200);
  };

  return (
    <div className="bg-[#FAF7F0] rounded-3xl p-4 sm:p-6 border border-stone-200 shadow-sm space-y-5">
      {/* 上部：ネスカフェ公式アプリ風タブ切り替え */}
      <div className="flex items-center justify-between border-b border-stone-200/80 pb-3">
        <div className="flex space-x-2">
          <button
            type="button"
            onClick={() => setActiveTab('standard')}
            className={`px-4 py-2 rounded-xl text-xs font-black transition-all ${
              activeTab === 'standard'
                ? 'bg-white text-stone-900 shadow-xs'
                : 'text-stone-500 hover:text-stone-800'
            }`}
          >
            定番レシピ
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('myrecipes')}
            className={`px-4 py-2 rounded-xl text-xs font-black flex items-center space-x-1.5 transition-all ${
              activeTab === 'myrecipes'
                ? 'bg-[#EADDC9] text-stone-900 shadow-xs'
                : 'text-stone-500 hover:text-stone-800'
            }`}
          >
            <Heart className="w-3.5 h-3.5 fill-red-500 text-red-500" />
            <span>マイレシピ</span>
          </button>
        </div>

        <button
          type="button"
          onClick={onOpenAddModal}
          className="text-xs font-bold text-amber-900 hover:text-amber-700 flex items-center space-x-1 bg-amber-50 px-2.5 py-1.5 rounded-xl border border-amber-200/60"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>他ドリンク追加</span>
        </button>
      </div>

      {/* ネスカフェ風レシピカードカルーセル・グリッド */}
      <div className="grid grid-cols-3 sm:grid-cols-3 md:grid-cols-4 gap-2.5 sm:gap-3">
        {presets.map((preset) => {
          const isSelected = selectedPresetId === preset.id;
          const isNative = preset.isNescafeNative;

          return (
            <div
              key={preset.id}
              onClick={() => handleSelectCard(preset)}
              className={`relative flex flex-col items-center justify-between p-2.5 sm:p-3 rounded-2xl bg-white border transition-all cursor-pointer select-none ${
                isSelected
                  ? 'border-amber-700 shadow-md ring-2 ring-amber-600/30 -translate-y-0.5'
                  : 'border-stone-200 hover:border-stone-300 hover:shadow-xs'
              }`}
            >
              {/* 削除ボタン */}
              {!['heiwa-capuchi', 'choiusu-capuchi', 'second-cup'].includes(preset.id) &&
                onDeleteCustomPreset && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onDeleteCustomPreset(preset.id);
                    }}
                    className="absolute top-1.5 right-1.5 p-1 text-stone-300 hover:text-red-500 rounded-full"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                )}

              {/* カップグラフィック */}
              <div className="py-1">
                <NescafeCoffeeCup
                  powderGrams={preset.powderGrams}
                  waterMl={preset.waterMl}
                  foamMl={preset.foamMl}
                  color={preset.color}
                  category={preset.category}
                  size="sm"
                />
              </div>

              {/* レシピ名 */}
              <span className="text-[11px] sm:text-xs font-bold text-stone-800 text-center line-clamp-1 mt-1">
                {preset.name}
              </span>

              {/* カフェイン量表記 */}
              <span className="text-[10px] font-mono font-bold text-amber-900/80 mt-0.5">
                {isNative ? `${preset.powderGrams || 2}g (${preset.caffeineMg}mg)` : `${preset.caffeineMg}mg`}
              </span>
            </div>
          );
        })}

        {/* 点線追加カード（公式アプリ風プレースホルダー） */}
        <div
          onClick={onOpenAddModal}
          className="flex flex-col items-center justify-center p-3 rounded-2xl border-2 border-dashed border-stone-300 hover:border-amber-600 bg-white/40 cursor-pointer transition-colors min-h-[100px]"
        >
          <Plus className="w-5 h-5 text-stone-400 mb-1" />
          <span className="text-[10px] font-bold text-stone-500">追加</span>
        </div>
      </div>

      {/* 選択中レシピの詳細調整 ＆ 「淹れる」アクションバー（画像2, 3 の忠実再現） */}
      {currentPreset && (
        <div className="bg-white rounded-2xl p-4 sm:p-5 border border-stone-200/90 shadow-xs space-y-4 animate-fadeIn">
          {/* 上部：選択中カップとパラメータ（☕ 2g 💧 120ml 🥛 40ml） */}
          <div className="flex items-center justify-center space-x-6 py-2">
            <NescafeCoffeeCup
              powderGrams={getPowderGrams()}
              waterMl={customWaterMl}
              foamMl={customFoamMl}
              color={currentPreset.color}
              category={currentPreset.category}
              size="lg"
            />
            <div className="space-y-1.5 text-xs font-semibold text-stone-700">
              {currentPreset.isNescafeNative ? (
                <>
                  <div className="flex items-center space-x-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-amber-900 inline-block"></span>
                    <span className="font-mono font-bold text-stone-900">{getPowderGrams()} g</span>
                    <span className="text-[11px] text-stone-400">({getCaffeineMg()} mg)</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-sky-500 inline-block"></span>
                    <span className="font-mono">{customWaterMl} ml</span>
                  </div>
                  {customFoamMl > 0 && (
                    <div className="flex items-center space-x-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-amber-200 inline-block"></span>
                      <span className="font-mono">{customFoamMl} ml</span>
                    </div>
                  )}
                </>
              ) : (
                <div className="text-sm font-black font-mono text-amber-900">
                  カフェイン {currentPreset.caffeineMg} mg
                </div>
              )}
            </div>
          </div>

          {/* コーヒーの量：少ない (1g) / ふつう (2g) / 多い (3g) */}
          {currentPreset.isNescafeNative && (
            <div className="space-y-3 pt-2 border-t border-stone-100">
              <div className="flex items-center justify-between">
                <span className="text-xs font-extrabold text-stone-800">コーヒーの量</span>
                <div className="flex rounded-xl overflow-hidden border border-stone-300 p-0.5 bg-stone-100/60">
                  {(['few', 'normal', 'many'] as const).map((lvl) => {
                    const label = lvl === 'few' ? '少ない (1g)' : lvl === 'normal' ? 'ふつう (2g)' : '多い (3g)';
                    const isActive = customPowderLevel === lvl;
                    return (
                      <button
                        key={lvl}
                        type="button"
                        onClick={() => handlePowderLevelChange(lvl)}
                        className={`px-3 py-1.5 text-xs font-bold transition-all rounded-lg ${
                          isActive
                            ? 'bg-[#3E271E] text-white shadow-xs'
                            : 'text-stone-600 hover:text-stone-900'
                        }`}
                      >
                        {label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* 水の量スライダー */}
              <div className="space-y-1">
                <div className="flex justify-between text-[11px] font-bold text-stone-600">
                  <span>水の量</span>
                  <span className="font-mono text-sky-700">{customWaterMl} ml</span>
                </div>
                <input
                  type="range"
                  min="60"
                  max="200"
                  step="10"
                  value={customWaterMl}
                  onChange={(e) => setCustomWaterMl(Number(e.target.value))}
                  className="w-full h-2 bg-sky-100 rounded-lg appearance-none cursor-pointer accent-sky-600"
                />
              </div>

              {/* 泡立ちスライダー */}
              <div className="space-y-1">
                <div className="flex justify-between text-[11px] font-bold text-stone-600">
                  <span>泡立ち</span>
                  <span className="font-mono text-amber-700">{customFoamMl} ml</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="60"
                  step="10"
                  value={customFoamMl}
                  onChange={(e) => setCustomFoamMl(Number(e.target.value))}
                  className="w-full h-2 bg-amber-100 rounded-lg appearance-none cursor-pointer accent-amber-600"
                />
              </div>
            </div>
          )}

          {/* 公式バリスタ風「淹れる」赤いビッグアクションボタン */}
          <div className="pt-2">
            <button
              type="button"
              onClick={handleBrew}
              className={`w-full py-3.5 rounded-2xl font-black text-base tracking-wider transition-all shadow-md active:scale-[0.98] flex items-center justify-center space-x-2 ${
                justBrewedId
                  ? 'bg-emerald-600 text-white'
                  : 'bg-[#D92524] hover:bg-[#C01F1E] text-white'
              }`}
            >
              {justBrewedId ? (
                <>
                  <Check className="w-5 h-5" />
                  <span>記録に追加しました！</span>
                </>
              ) : (
                <span>淹れる（指定時刻に追加）</span>
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
