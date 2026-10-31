import React from 'react';

interface ScientificModalProps {
  isOpen: boolean;
  onClose: () => void;
  bodyWeightKg?: number;
}

export const ScientificModal: React.FC<ScientificModalProps> = ({
  isOpen,
  onClose,
  bodyWeightKg = 60,
}) => {
  if (!isOpen) return null;

  const weightScale = bodyWeightKg / 60;
  const safeTh = Number((25 * weightScale).toFixed(1));
  const cautionTh = Number((50 * weightScale).toFixed(1));
  const focusTh = Number((75 * weightScale).toFixed(1));

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-stone-900/60 backdrop-blur-xs animate-fadeIn overscroll-contain"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl shadow-xl border border-stone-200 w-full max-w-lg max-h-[85dvh] flex flex-col overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* ヘッダー（常に固定表示・タップしやすい×ボタン） */}
        <div className="shrink-0 px-4 sm:px-6 py-3.5 border-b border-stone-100 flex items-center justify-between bg-white z-10">
          <div className="flex items-center space-x-2">
            <span className="w-2 h-2 rounded-full bg-amber-500" />
            <h3 className="text-sm sm:text-base font-semibold text-stone-900">科学的計算モデルと医学的根拠</h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-lg hover:bg-stone-100 text-stone-400 hover:text-stone-700 flex items-center justify-center cursor-pointer transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#3E2718]"
            aria-label="閉じる"
          >
            ✕
          </button>
        </div>

        {/* スクロール可能な本文 */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-5 text-xs text-stone-700 leading-relaxed overscroll-contain">
          {/* 1. 集中と快眠の医学的基準 */}
          <section className="space-y-2">
            <h4 className="font-semibold text-stone-900 text-sm">1. 集中と快眠の医学的基準</h4>
            <p>
              カフェインは脳内の<strong>アデノシン受容体に競合結合</strong>して疲労シグナルを遮断し、覚醒を維持します。CafeLimitでは、日中のパフォーマンス向上と夜間の深い睡眠を両立するための体内残存ゾーンを定義しています。
            </p>
            <ul className="list-disc pl-5 space-y-1.5 text-[11px] text-stone-600">
              <li>
                <strong>EFSA公的基準</strong>: 欧州食品安全機関 EFSA の知見に基づき、健康成人では単回 <strong>200mg</strong>・1日総量 <strong>400mg</strong>、妊婦や授乳婦では1日 <strong>200mg</strong> までは安全とされています。就寝前2時間以内に <strong>100mg</strong> を超えて摂取すると、入眠潜時の延長や深い眠りの短縮が実証されています。
              </li>
              <li>
                <strong>集中閾値 75mg の根拠</strong>: EFSAの科学的見解に基づき、体内残存 <strong>75mg以上</strong> で注意力や認知警戒度の有意な向上が得られます。
              </li>
              <li>
                <strong>快眠閾値 25mg の根拠</strong>: 就寝時の残存が <strong>25mg以下</strong> まで抜けていれば受容体への拮抗作用が実質消失し、深い眠りが守られます。
              </li>
              <li>
                <strong>警戒閾値 50mg の根拠</strong>: 睡眠障害を招く摂取量 100mg の約1半減期後に相当し、睡眠の質が大幅に低下する危険水準です。
              </li>
            </ul>

            {/* ゾーン対比グリッド */}
            <div className="space-y-1.5 pt-1">
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-2 text-center text-[11px]">
                {/* 日中ゾーン */}
                <div className="bg-amber-50/90 border border-amber-200/80 rounded-xl p-2 text-amber-950">
                  <div className="text-[9px] uppercase tracking-wider font-semibold text-amber-700 mb-0.5">☀️ 日中の作業時</div>
                  <span className="font-bold block text-xs">⚡ 集中 ≥{focusTh}mg</span>
                  <span className="text-[10px] text-amber-800">覚醒・認知機能向上</span>
                </div>
                {/* 就寝時ゾーン */}
                <div className="bg-emerald-50/90 border border-emerald-200/80 rounded-xl p-2 text-emerald-950">
                  <div className="text-[9px] uppercase tracking-wider font-semibold text-emerald-700 mb-0.5">🌙 就寝時</div>
                  <span className="font-bold block text-xs">🟢 快眠 ≤{safeTh}mg</span>
                  <span className="text-[10px] text-emerald-800">深い眠りを守る</span>
                </div>
                <div className="bg-yellow-50/90 border border-yellow-200/80 rounded-xl p-2 text-yellow-950">
                  <div className="text-[9px] uppercase tracking-wider font-semibold text-yellow-700 mb-0.5">🌙 就寝時</div>
                  <span className="font-bold block text-xs">🟡 注意 {safeTh}〜{cautionTh}mg</span>
                  <span className="text-[10px] text-yellow-800">入眠遅延・中途覚醒</span>
                </div>
                <div className="bg-red-50/90 border border-red-200/80 rounded-xl p-2 text-red-950">
                  <div className="text-[9px] uppercase tracking-wider font-semibold text-red-700 mb-0.5">🌙 就寝時</div>
                  <span className="font-bold block text-xs">🔴 警戒 ≥{cautionTh}mg</span>
                  <span className="text-[10px] text-red-800">睡眠の質が大幅低下</span>
                </div>
              </div>
              <p className="text-[10px] text-stone-500 font-mono text-right">
                ※ 設定体重 {bodyWeightKg}kg に連動。基準60kg時: 集中 75mg · 快眠 25mg · 警戒 50mg
              </p>
            </div>
          </section>

          {/* 2. 体重連動スケーリングと肝代謝 */}
          <section className="space-y-1.5">
            <h4 className="font-semibold text-stone-900 text-sm">2. 体重連動スケーリングと代謝酵素 CYP1A2</h4>
            <p>
              脳のアデノシン受容体に作用する強さは、カフェインが<strong>全身の体液に分布した血中濃度</strong>で決まります。体重が重いほど体内水分量が多く薄まるため、安全許容量ラインも体重に正比例して自動調整されます。
            </p>
            <p className="text-[11px] text-stone-600">
              一方、体内からカフェインが消失する半減期は、主に肝臓の代謝酵素 <strong>CYP1A2</strong> の活性に依存し、体質や生活習慣で大きく異なります：
            </p>
            <ul className="list-disc pl-5 space-y-0.5 text-[11px] text-stone-600">
              <li><strong>標準体質</strong>: 半減期 約4.0時間。成人の標準域 3.0〜5.0時間</li>
              <li><strong>代謝迅速</strong>: 半減期 約2.5時間。喫煙習慣など酵素誘導で分解が早い体質</li>
              <li><strong>代謝遅延</strong>: 半減期 約6.0時間以上。敏感体質やピル服用など分解が遅い体質</li>
            </ul>
          </section>

          {/* 3. Batemanモデルと飲用時間積分 */}
          <section className="space-y-1.5">
            <h4 className="font-semibold text-stone-900 text-sm">3. 経口吸収Batemanモデル & 飲用時間積分</h4>
            <p>
              摂取直後に全量が血中へ移行する単純モデルではなく、胃腸からの吸収プロセスや摂取後約30〜45分の血中ピーク到達を考慮した<strong>1コンパートメントBatemanモデル</strong>を採用。さらにマグカップや缶を時間をかけて飲む連続飲用モデルを微積分計算しています。
            </p>
            <div className="text-[11px] text-stone-600 bg-stone-50/90 p-2.5 rounded-xl border border-stone-200/80 space-y-1">
              <span className="font-bold text-stone-800 block">💡 ゆっくり飲み・吸収遅延による残存補正</span>
              <p>
                時間をかけて飲んだり胃腸から緩やかに吸収される現実の体内では、数時間後の残存量が単純計算より約4〜6%高めに維持されます。CafeLimitはこの長時間残存補正を逆算ロジックに完全適用しているため、「今飲める最大量」や「最終飲用時刻」がシミュレーション結果と分単位・0.1mg単位で狂いなく合致します。
              </p>
            </div>
          </section>

          {/* 4. 多様な飲料プリセットと含有基準 */}
          <section className="space-y-1.5">
            <h4 className="font-semibold text-stone-900 text-sm">4. 多様な飲料プリセットと含有基準</h4>
            <p>
              日本食品標準成分表および各社公式公表値に基づき、正確な原単位を登録しています。
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px] text-stone-600 pt-0.5">
              <div className="bg-stone-50/80 p-2.5 rounded-xl border border-stone-200/70">
                <span className="font-bold text-stone-800">ネスカフェ・コーヒー</span>
                <ul className="list-disc pl-4 mt-1 space-y-0.5">
                  <li>ゴールドブレンド: 粉末 1.0g あたり 40mg</li>
                  <li>カフェインハーフ: 粉末 1.0g あたり 20mg</li>
                  <li>カフェインレス: 97%カット 粉末 1.0g あたり約1〜2mg</li>
                  <li>ドリップ・コンビニコーヒー: 1杯 90〜200mg</li>
                </ul>
              </div>
              <div className="bg-stone-50/80 p-2.5 rounded-xl border border-stone-200/70">
                <span className="font-bold text-stone-800">エナジー・お茶・炭酸</span>
                <ul className="list-disc pl-4 mt-1 space-y-0.5">
                  <li>モンスターエナジー: 355ml缶 142mg</li>
                  <li>レッドブル: 250ml缶 80mg</li>
                  <li>ZONe: HYPER缶 150mg · フルーツ系 75mg</li>
                  <li>緑茶・紅茶: 30〜100mg · 炭酸飲料: 34〜60mg</li>
                </ul>
              </div>
            </div>
          </section>

          {/* 5. 免責事項 */}
          <div className="p-3 bg-stone-50/70 rounded-xl border border-stone-200/70 text-[10px] text-stone-500 space-y-1">
            <p>※ 本ツールは科学的文献に基づくシミュレーターであり、医療目的の診断やアドバイスを提供するものではありません。</p>
            <p>※「ネスカフェ」「ゴールドブレンド」「バリスタ」はネスレ日本株式会社、「モンスターエナジー」はMonster Energy Company、「レッドブル」はRed Bull GmbH、「ZONe」はサントリー食品インターナショナル株式会社、「コカ・コーラ」はThe Coca-Cola Company、「ペプシ」はPepsiCo, Inc.、「ドクターペッパー」はKeurig Dr Pepper Inc.の登録商標です。</p>
          </div>
        </div>
      </div>
    </div>
  );
};
