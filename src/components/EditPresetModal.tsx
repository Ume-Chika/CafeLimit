import React, { useState } from 'react';
import { X, Trash2, Check, Sparkles } from 'lucide-react';
import type { BeveragePreset, BeverageCategory } from '../types/caffeine';
import { NescafeCoffeeCup } from './NescafeCoffeeCup';

interface EditPresetModalProps {
  isOpen: boolean;
  preset: BeveragePreset | null;
  onClose: () => void;
  onUpdatePreset: (updated: BeveragePreset) => void;
  onDeletePreset: (presetId: string) => void;
}

export const EditPresetModal: React.FC<EditPresetModalProps> = ({
  isOpen,
  preset,
  onClose,
  onUpdatePreset,
  onDeletePreset,
}) => {
  if (!isOpen || !preset) return null;

  return (
    <EditPresetModalContent
      key={preset.id}
      preset={preset}
      onClose={onClose}
      onUpdatePreset={onUpdatePreset}
      onDeletePreset={onDeletePreset}
    />
  );
};

interface EditPresetModalContentProps {
  preset: BeveragePreset;
  onClose: () => void;
  onUpdatePreset: (updated: BeveragePreset) => void;
  onDeletePreset: (presetId: string) => void;
}

const EditPresetModalContent: React.FC<EditPresetModalContentProps> = ({
  preset,
  onClose,
  onUpdatePreset,
  onDeletePreset,
}) => {
  const [name, setName] = useState(preset.name);
  const [category, setCategory] = useState<BeverageCategory>(preset.category);
  const [caffeineMg, setCaffeineMg] = useState(preset.caffeineMg);
  const [powderGrams, setPowderGrams] = useState(preset.powderGrams ?? 2.0);
  const [volumeMl, setVolumeMl] = useState(preset.volumeMl ?? 355);
  const [color, setColor] = useState(preset.color ?? '#5C3826');
  const [drinkingDurationMinutes, setDrinkingDurationMinutes] = useState<number>(preset.drinkingDurationMinutes ?? 10);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const updated: BeveragePreset = {
      ...preset,
      name,
      category,
      caffeineMg: Number(caffeineMg),
      powderGrams: category === 'nescafe' ? Number(powderGrams) : undefined,
      volumeMl: category !== 'nescafe' ? Number(volumeMl) : undefined,
      color,
      drinkingDurationMinutes: Number(drinkingDurationMinutes),
    };
    onUpdatePreset(updated);
    onClose();
  };

  const handleDelete = () => {
    if (window.confirm(`「${preset.name}」パネルを削除しますか？`)) {
      onDeletePreset(preset.id);
      onClose();
    }
  };

  const colors = [
    { label: 'ブラウン', value: '#5C3826' },
    { label: 'ダーク', value: '#3E2415' },
    { label: 'グリーン', value: '#10B981' },
    { label: 'ブルー', value: '#3B82F6' },
    { label: 'レッド', value: '#EF4444' },
    { label: 'ピンク', value: '#F43F5E' },
    { label: 'パープル', value: '#8B5CF6' },
  ];

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
              <Sparkles className="w-4 h-4 text-amber-800" />
            </div>
            <div>
              <h3 className="text-sm font-black text-stone-900">パネルの編集</h3>
              <p className="text-[11px] text-stone-500">{preset.name}</p>
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

        {/* フォーム */}
        <form onSubmit={handleSubmit} className="p-4 sm:p-5 space-y-4 text-xs">
          {/* アイコンプレビュー */}
          <div className="flex flex-col items-center justify-center py-2 bg-stone-50/80 rounded-2xl border border-stone-200/80">
            <NescafeCoffeeCup color={color} category={category} size="md" />
            <span className="text-[10px] text-stone-400 font-bold mt-1">アイコンプレビュー</span>
          </div>

          {/* ドリンク名 */}
          <div>
            <label className="block text-stone-700 font-bold mb-1">パネル表示名</label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full bg-stone-50 border border-stone-200 rounded-xl px-3 py-2 font-bold text-stone-900 focus:outline-none focus:ring-2 focus:ring-amber-500/20"
            />
          </div>

          {/* カテゴリ */}
          <div>
            <label className="block text-stone-700 font-bold mb-1">カテゴリ</label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value as BeverageCategory)}
              className="w-full bg-stone-50 border border-stone-200 rounded-xl px-3 py-2 font-bold text-stone-900 focus:outline-none"
            >
              <option value="nescafe">ネスカフェ（粉末g）</option>
              <option value="energy">エナジードリンク（缶）</option>
              <option value="coffee">レギュラーコーヒー</option>
              <option value="tea">お茶・緑茶</option>
              <option value="soda">炭酸飲料・その他</option>
            </select>
          </div>

          {/* カフェイン量 / 容量・粉末 */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-stone-700 font-bold mb-1">カフェイン (mg)</label>
              <input
                type="number"
                required
                min="0"
                max="500"
                value={caffeineMg}
                onChange={(e) => setCaffeineMg(Number(e.target.value))}
                className="w-full bg-stone-50 border border-stone-200 rounded-xl px-3 py-2 font-mono font-bold text-stone-900 focus:outline-none"
              />
            </div>

            {category === 'nescafe' ? (
              <div>
                <label className="block text-stone-700 font-bold mb-1">粉末量 (g)</label>
                <input
                  type="number"
                  step="0.1"
                  min="0.5"
                  max="10.0"
                  value={powderGrams}
                  onChange={(e) => {
                    const g = Number(e.target.value);
                    setPowderGrams(g);
                    setCaffeineMg(Math.round(g * 40));
                  }}
                  className="w-full bg-stone-50 border border-stone-200 rounded-xl px-3 py-2 font-mono font-bold text-stone-900 focus:outline-none"
                />
              </div>
            ) : (
              <div>
                <label className="block text-stone-700 font-bold mb-1">内容量 (ml)</label>
                <input
                  type="number"
                  step="5"
                  min="10"
                  max="2000"
                  value={volumeMl}
                  onChange={(e) => setVolumeMl(Number(e.target.value))}
                  className="w-full bg-stone-50 border border-stone-200 rounded-xl px-3 py-2 font-mono font-bold text-stone-900 focus:outline-none"
                />
              </div>
            )}
          </div>

          {/* 飲むのにかかる時間（10分〜24時間） */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-stone-700 font-bold">飲むのにかかる時間</label>
              <span className="text-[10px] text-amber-900 font-bold bg-amber-100/80 px-2 py-0.5 rounded">
                {drinkingDurationMinutes < 60 ? `${drinkingDurationMinutes}分` : `${Math.floor(drinkingDurationMinutes / 60)}時間${drinkingDurationMinutes % 60 ? (drinkingDurationMinutes % 60) + '分' : ''}`}
              </span>
            </div>
            <select
              value={drinkingDurationMinutes}
              onChange={(e) => setDrinkingDurationMinutes(Number(e.target.value))}
              className="w-full bg-stone-50 border border-stone-200 rounded-xl px-3 py-2 font-bold text-stone-900 focus:outline-none focus:ring-2 focus:ring-amber-500/20 cursor-pointer"
            >
              <option value={10}>10分（標準・マグカップ1杯）</option>
              <option value={20}>20分</option>
              <option value={30}>30分</option>
              <option value={45}>45分</option>
              <option value={60}>1時間（タンブラーなど）</option>
              <option value={90}>1.5時間</option>
              <option value={120}>2時間</option>
              <option value={180}>3時間</option>
              <option value={240}>4時間（午前／午後かけて）</option>
              <option value={360}>6時間</option>
              <option value={480}>8時間（勤務時間中）</option>
              <option value={720}>12時間（ラボ・デスク作業でチビチビ）</option>
              <option value={1440}>24時間（1日中かけて飲む）</option>
            </select>
          </div>

          {/* カラー選択 */}
          <div>
            <label className="block text-stone-700 font-bold mb-1.5">テーマカラー</label>
            <div className="flex flex-wrap gap-2">
              {colors.map((c) => (
                <button
                  key={c.value}
                  type="button"
                  onClick={() => setColor(c.value)}
                  className={`w-7 h-7 rounded-full border-2 transition-transform cursor-pointer ${
                    color === c.value ? 'scale-115 border-stone-900 shadow-xs' : 'border-white'
                  }`}
                  style={{ backgroundColor: c.value }}
                  title={c.label}
                />
              ))}
            </div>
          </div>

          {/* ボタングループ */}
          <div className="pt-3 border-t border-stone-100 flex items-center justify-between gap-3">
            <button
              type="button"
              onClick={handleDelete}
              className="flex items-center space-x-1 px-3 py-2 text-red-600 hover:bg-red-50 rounded-xl font-bold transition-all cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>パネル削除</span>
            </button>

            <div className="flex items-center space-x-2">
              <button
                type="button"
                onClick={onClose}
                className="px-3 py-2 border border-stone-200 rounded-xl font-bold text-stone-600 hover:bg-stone-50 transition-all cursor-pointer"
              >
                キャンセル
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-[#3E271E] hover:bg-stone-800 text-white rounded-xl font-black flex items-center space-x-1 shadow-xs transition-all cursor-pointer active:scale-95"
              >
                <Check className="w-4 h-4" />
                <span>保存する</span>
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
