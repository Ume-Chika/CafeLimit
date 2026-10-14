import React from 'react';

interface ScientificModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ScientificModal: React.FC<ScientificModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/60 backdrop-blur-xs animate-fadeIn"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-3xl shadow-xl border border-stone-200 w-full max-w-lg overflow-hidden flex flex-col max-h-[85vh]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="px-6 py-4 border-b border-stone-100 flex items-center justify-between bg-stone-50/50">
          <h3 className="text-base font-black text-stone-900">科学的計算モデルと医学的根拠</h3>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full hover:bg-stone-200 text-stone-400 hover:text-stone-700 flex items-center justify-center cursor-pointer"
          >
            ✕
          </button>
        </div>
        <div className="p-6 overflow-y-auto space-y-4 text-xs text-stone-700 leading-relaxed">
          <div className="space-y-1">
            <h4 className="font-bold text-stone-900 text-sm">1. 睡眠閾値と覚醒作用の医学的基準（EFSA 2015年見解）</h4>
            <p>
              欧州食品安全機関（EFSA）の2015年科学的意見書および睡眠薬理学の知見に基づき、就寝時の体内残存カフェイン量を評価しています。
            </p>
            <ul className="list-disc pl-5 space-y-1 text-[11px] text-stone-600">
              <li>
                <strong>EFSA公的基準</strong>: 健康成人において単回 <strong>200mg</strong>（約 3mg/kg体重）、1日総量 <strong>400mg</strong>（妊婦 200mg）までは安全とされています。また、就寝直前（2時間以内）に約 <strong>100mg</strong>（約 1.4mg/kg体重）を超えて摂取すると入眠潜時の延長や徐波睡眠の短縮が確認されています。
              </li>
              <li>
                <strong>就寝時 25mg 閾値の導出</strong>: 通常の1杯（80〜100mg）を夕方に摂取後、半減期を経て就寝時に体内残存が <strong>25mg以下（初期値の1/4以下）</strong> に達していれば、アデノシン受容体への拮抗作用が実質的に消失し、深い睡眠が守られます。
              </li>
            </ul>
            <div className="mt-2 grid grid-cols-3 gap-2 text-center text-[11px]">
              <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-2 text-emerald-900 font-bold">
                🟢 快眠 (&le;25mg)<br /><span className="text-[10px] font-normal text-emerald-700">深い睡眠を阻害しない</span>
              </div>
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-2 text-amber-900 font-bold">
                🟡 注意 (25〜50mg)<br /><span className="text-[10px] font-normal text-amber-700">入眠遅延・中途覚醒リスク</span>
              </div>
              <div className="bg-red-50 border border-red-200 rounded-xl p-2 text-red-900 font-bold">
                🔴 警戒 (&ge;50mg)<br /><span className="text-[10px] font-normal text-red-700">睡眠の質が大幅低下</span>
              </div>
            </div>
          </div>

          <div className="space-y-1">
            <h4 className="font-bold text-stone-900 text-sm">2. 代謝半減期と体重の薬物動態学</h4>
            <p>
              体重（分布容積 <em>V<sub>d</sub> ≈ 0.6〜0.7 L/kg</em>）は摂取直後の最高血中濃度（<em>C<sub>max</sub></em>）に影響しますが、カフェインが体内から抜けるスピード（消失速度定数 <em>k<sub>e</sub></em> および半減期 <em>t<sub>1/2</sub></em>）は主に肝臓の代謝酵素（<strong>CYP1A2</strong>）の活性に依存します。
            </p>
            <ul className="list-disc pl-5 space-y-0.5 text-[11px] text-stone-600">
              <li><strong>標準体質（成人平均）</strong>: 半減期 約4.0時間（3.0〜5.0h）</li>
              <li><strong>代謝迅速（喫煙等・CYP1A2誘導）</strong>: 半減期 約2.5時間（分解が速い）</li>
              <li><strong>代謝遅延（敏感体質・ピル服用等）</strong>: 半減期 約6.0時間以上（分解が遅い）</li>
            </ul>
          </div>

          <div className="space-y-1">
            <h4 className="font-bold text-stone-900 text-sm">3. 経口吸収Batemanモデル & 高精度逆算</h4>
            <p>
              常に経口吸収速度定数 <em>k<sub>a</sub> = 4.5 h<sup>-1</sup></em>（吸収半減期 約9分、ピーク約30〜40分）および飲用時間積分を適用。就寝前最終時刻や今飲める最大量の逆算にも漸近補正係数 <em>α</em> を組み込み、順方向シミュレーションと逆算値が理論的に完全整合します。
            </p>
          </div>

          <div className="space-y-1">
            <h4 className="font-bold text-stone-900 text-sm">4. ネスカフェ原単位モデル</h4>
            <p>
              ネスカフェ・ゴールドブレンドの公式基準（および日本食品標準成分表）に基づき、<strong>顆粒粉末 1.0g あたり 40mg</strong> のカフェイン含有モデルを採用しています。
            </p>
            <ul className="list-disc pl-5 space-y-0.5 text-[11px] text-stone-600">
              <li>ネスカフェ 軽め（1.0g）: 40mg</li>
              <li>ネスカフェ 標準（2.0g）: 80mg</li>
              <li>ネスカフェ 濃いめ（3.0g）: 120mg</li>
            </ul>
          </div>

          <div className="p-3 bg-stone-50 rounded-xl border border-stone-200 text-[10px] text-stone-500 space-y-1">
            <p>※ 本ツールは科学的文献に基づくシミュレーターであり、医療目的の診断やアドバイスを提供するものではありません。</p>
            <p>※「ネスカフェ」「ゴールドブレンド」「バリスタ」はネスレ日本株式会社、「モンスターエナジー」はMonster Energy Company、「レッドブル」はRed Bull GmbH、「ZONe」はサントリー食品インターナショナル株式会社、「コカ・コーラ」はThe Coca-Cola Company、「ペプシ」はPepsiCo, Inc.、「ドクターペッパー」はKeurig Dr Pepper Inc.の登録商標です。</p>
          </div>
        </div>
      </div>
    </div>
  );
};
