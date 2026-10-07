import React, { useMemo, useRef, useState, useEffect, useCallback } from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js';
import type { ChartOptions } from 'chart.js';
import annotationPlugin from 'chartjs-plugin-annotation';
import { Line, getElementAtEvent } from 'react-chartjs-2';
import type { ChartDataPoint, IntakeEvent } from '../types/caffeine';
import { Activity, Plus, X } from 'lucide-react';
import { format } from 'date-fns';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler,
  annotationPlugin
);

interface CaffeineChartProps {
  points: ChartDataPoint[];
  events: IntakeEvent[];
  currentTime: Date;
  bedTime: Date;
  onSelectEventToEdit: (event: IntakeEvent) => void;
  onSelectTimeToBrew: (time: Date) => void;
}

interface SelectedPointInfo {
  rawXPx: number;
  boxXPx: number;
  yPx: number;
  time: Date;
  timeLabel: string;
  caffeineMg: number;
  event?: IntakeEvent;
}

export const CaffeineChart: React.FC<CaffeineChartProps> = ({
  points,
  events,
  currentTime,
  bedTime,
  onSelectEventToEdit,
  onSelectTimeToBrew,
}) => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const chartRef = useRef<any>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const popupRef = useRef<HTMLDivElement>(null);
  const isDraggingRef = useRef(false);

  // グラフ上でタップ/ドラッグ選択された時間と残存量の情報（座標付き）
  const [selectedPointInfo, setSelectedPointInfo] = useState<SelectedPointInfo | null>(null);

  // 吹き出し外タップで吹き出し＆仮選択点を閉じる
  useEffect(() => {
    if (!selectedPointInfo) return;

    const handleOutsidePointer = (e: MouseEvent | TouchEvent) => {
      if (popupRef.current && !popupRef.current.contains(e.target as Node)) {
        // グラフ自体の操作中でなければ閉じる
        if (!chartRef.current?.canvas?.contains(e.target as Node)) {
          setSelectedPointInfo(null);
        }
      }
    };

    window.addEventListener('pointerdown', handleOutsidePointer);
    return () => {
      window.removeEventListener('pointerdown', handleOutsidePointer);
    };
  }, [selectedPointInfo]);

  const { labels, dataValues, eventAnnotations } = useMemo(() => {
    const lbls = points.map((p) => p.timeLabel);
    const vals = points.map((p) => p.caffeineMg);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const annotations: any = {};

    // 25mg 快眠安全ライン（文字は削除し点線のみ表示）
    annotations['safeLine'] = {
      type: 'line',
      yMin: 25,
      yMax: 25,
      borderColor: 'rgba(16, 185, 129, 0.75)',
      borderWidth: 1.5,
      borderDash: [4, 4],
    };

    // 50mg 覚醒リスクライン（文字は削除し点線のみ表示）
    annotations['warningLine'] = {
      type: 'line',
      yMin: 50,
      yMax: 50,
      borderColor: 'rgba(239, 68, 68, 0.75)',
      borderWidth: 1.5,
      borderDash: [4, 4],
    };

    // 現在時刻マーカー
    const curMs = currentTime.getTime();
    let closestCurIdx = -1;
    let minCurDiff = Infinity;
    points.forEach((p, idx) => {
      const diff = Math.abs(p.time.getTime() - curMs);
      if (diff < minCurDiff) {
        minCurDiff = diff;
        closestCurIdx = idx;
      }
    });

    if (closestCurIdx !== -1 && minCurDiff < 30 * 60 * 1000) {
      annotations['currentLine'] = {
        type: 'line',
        xMin: closestCurIdx,
        xMax: closestCurIdx,
        borderColor: 'rgba(59, 130, 246, 0.85)',
        borderWidth: 2,
        label: {
          display: true,
          content: '現在',
          position: 'top',
          backgroundColor: 'rgba(59, 130, 246, 0.9)',
          color: '#ffffff',
          font: { size: 10, weight: 'bold' },
          padding: 3,
          borderRadius: 4,
        },
      };
    }

    // 就寝時刻マーカー
    const bedMs = bedTime.getTime();
    let closestBedIdx = -1;
    let minBedDiff = Infinity;
    points.forEach((p, idx) => {
      const diff = Math.abs(p.time.getTime() - bedMs);
      if (diff < minBedDiff) {
        minBedDiff = diff;
        closestBedIdx = idx;
      }
    });

    if (closestBedIdx !== -1 && minBedDiff < 30 * 60 * 1000) {
      annotations['bedLine'] = {
        type: 'line',
        xMin: closestBedIdx,
        xMax: closestBedIdx,
        borderColor: 'rgba(109, 40, 217, 0.85)',
        borderWidth: 2,
        label: {
          display: true,
          content: `就寝 (${format(bedTime, 'HH:mm')})`,
          position: 'top',
          backgroundColor: 'rgba(109, 40, 217, 0.95)',
          color: '#ffffff',
          font: { size: 10, weight: 'bold' },
          padding: 3,
          borderRadius: 4,
        },
      };
    }

    return { labels: lbls, dataValues: vals, eventAnnotations: annotations };
  }, [points, currentTime, bedTime]);

  const maxVal = Math.max(...dataValues, 60);

  // グラフ上の座標から直感的にポイントを特定し、吹き出しを更新する関数（ドラッグ・タップ共通）
  const updatePointAtClientX = useCallback(
    (clientX: number) => {
      const chart = chartRef.current;
      if (!chart) return;

      const rect = chart.canvas.getBoundingClientRect();
      const clickX = clientX - rect.left;
      const xAxis = chart.scales.x;
      const yAxis = chart.scales.y;
      if (!xAxis || !yAxis) return;

      const val = xAxis.getValueForPixel(clickX);
      if (typeof val !== 'number') return;

      const targetIndex = Math.max(0, Math.min(points.length - 1, Math.round(val)));
      const targetPoint = points[targetIndex];
      if (!targetPoint) return;

      const pointMs = targetPoint.time.getTime();

      // 前後10分以内の既存摂取イベント
      const matchedEvent = events.find((e) => {
        const evMs = new Date(e.timestamp).getTime();
        return Math.abs(evMs - pointMs) <= 10 * 60 * 1000;
      });

      const rawXPx = xAxis.getPixelForValue(targetIndex);
      const rawYPx = yAxis.getPixelForValue(targetPoint.caffeineMg);
      const chartWidth = chart.width || 320;
      const boxXPx = Math.max(95, Math.min(rawXPx, chartWidth - 95));
      const yPx = Math.max(15, rawYPx);

      setSelectedPointInfo({
        rawXPx,
        boxXPx,
        yPx,
        time: targetPoint.time,
        timeLabel: format(targetPoint.time, 'M/d(E) HH:mm'),
        caffeineMg: targetPoint.caffeineMg,
        event: matchedEvent,
      });
    },
    [points, events]
  );

  // スマホでのスワイプ（ドラッグスクラブ）時に画面全体の縦スクロールを確実に防止するリスナー登録
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleTouchStart = (e: TouchEvent) => {
      if (e.touches.length > 0) {
        isDraggingRef.current = true;
        updatePointAtClientX(e.touches[0].clientX);
        if (e.cancelable) {
          e.preventDefault();
        }
      }
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (isDraggingRef.current && e.touches.length > 0) {
        updatePointAtClientX(e.touches[0].clientX);
        if (e.cancelable) {
          e.preventDefault();
        }
      }
    };

    const handleTouchEnd = () => {
      isDraggingRef.current = false;
    };

    container.addEventListener('touchstart', handleTouchStart, { passive: false });
    container.addEventListener('touchmove', handleTouchMove, { passive: false });
    container.addEventListener('touchend', handleTouchEnd);
    container.addEventListener('touchcancel', handleTouchEnd);

    return () => {
      container.removeEventListener('touchstart', handleTouchStart);
      container.removeEventListener('touchmove', handleTouchMove);
      container.removeEventListener('touchend', handleTouchEnd);
      container.removeEventListener('touchcancel', handleTouchEnd);
    };
  }, [updatePointAtClientX]);

  // グラフクリックハンドラ（要素判定対応）
  const handleChartClick = (event: React.MouseEvent<HTMLCanvasElement>) => {
    const chart = chartRef.current;
    if (!chart) return;

    // 1. 点要素（イベント点など）を直接クリックしたか判定
    const element = getElementAtEvent(chart, event);
    if (element && element.length > 0) {
      const idx = element[0].index;
      const clickedP = points[idx];
      if (clickedP) {
        const pointMs = clickedP.time.getTime();
        const matchedEvent = events.find((e) => {
          const evMs = new Date(e.timestamp).getTime();
          return Math.abs(evMs - pointMs) <= 10 * 60 * 1000;
        });

        const rawXPx = chart.scales.x.getPixelForValue(idx);
        const rawYPx = chart.scales.y.getPixelForValue(clickedP.caffeineMg);
        const chartWidth = chart.width || 320;
        const boxXPx = Math.max(95, Math.min(rawXPx, chartWidth - 95));
        const yPx = Math.max(15, rawYPx);

        setSelectedPointInfo({
          rawXPx,
          boxXPx,
          yPx,
          time: clickedP.time,
          timeLabel: format(clickedP.time, 'M/d(E) HH:mm'),
          caffeineMg: clickedP.caffeineMg,
          event: matchedEvent,
        });
        return;
      }
    }

    // 2. 通常クリック
    updatePointAtClientX(event.clientX);
  };

  const handleConfirmAddAtTime = () => {
    if (selectedPointInfo) {
      onSelectTimeToBrew(selectedPointInfo.time);
      setSelectedPointInfo(null);
    }
  };

  const chartData = {
    labels,
    datasets: [
      {
        label: '体内残存カフェイン',
        data: dataValues,
        fill: true,
        backgroundColor: (context: { chart: { ctx: CanvasRenderingContext2D } }) => {
          const ctx = context.chart.ctx;
          const gradient = ctx.createLinearGradient(0, 0, 0, 250);
          gradient.addColorStop(0, 'rgba(180, 83, 9, 0.3)');
          gradient.addColorStop(0.6, 'rgba(217, 119, 6, 0.08)');
          gradient.addColorStop(1, 'rgba(245, 158, 11, 0.0)');
          return gradient;
        },
        borderColor: '#92400E',
        borderWidth: 2.5,
        pointRadius: (ctx: { dataIndex: number }) => {
          const pointTime = points[ctx.dataIndex]?.time?.getTime();
          if (!pointTime) return 0;
          // 実際の摂取イベントがある点は常に大きくプロット
          const hasEvent = events.some((e) => {
            const evTime = new Date(e.timestamp).getTime();
            return Math.abs(evTime - pointTime) <= 10 * 60 * 1000;
          });
          if (hasEvent) return 6;

          // 吹き出しが表示されている間のみ、選択位置の点を一時的にハイライト
          if (selectedPointInfo) {
            const isSelected = Math.abs(selectedPointInfo.time.getTime() - pointTime) < 8 * 60 * 1000;
            if (isSelected) return 5;
          }

          // 吹き出しが消えているときは点は描画しない
          return 0;
        },
        pointBackgroundColor: '#F59E0B',
        pointBorderColor: '#78350F',
        pointBorderWidth: 2,
        pointHoverRadius: (ctx: { dataIndex: number }) => {
          const pointTime = points[ctx.dataIndex]?.time?.getTime();
          if (!pointTime) return 0;
          const hasEvent = events.some((e) => {
            const evTime = new Date(e.timestamp).getTime();
            return Math.abs(evTime - pointTime) <= 10 * 60 * 1000;
          });
          return hasEvent ? 8 : 0;
        },
        tension: 0.25,
      },
    ],
  };

  const options: ChartOptions<'line'> = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: {
      mode: 'index',
      intersect: false,
    },
    plugins: {
      legend: {
        display: false,
      },
      // 標準のキャンバスツールチップは無効化し、完全一体型のHTML吹き出しを使用
      tooltip: {
        enabled: false,
      },
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      annotation: {
        annotations: eventAnnotations,
      } as any,
    },
    scales: {
      x: {
        grid: {
          color: 'rgba(214, 211, 209, 0.25)',
        },
        ticks: {
          font: { size: 10, weight: 'bold' },
          color: '#78716C',
          maxRotation: 0,
          autoSkip: true,
          maxTicksLimit: 8,
        },
      },
      y: {
        min: 0,
        max: Math.ceil((maxVal * 1.15) / 10) * 10,
        grid: {
          color: 'rgba(214, 211, 209, 0.25)',
        },
        ticks: {
          font: { size: 10, weight: 'bold' },
          color: '#78716C',
          callback: (value) => `${value}mg`,
        },
      },
    },
  };

  const isNearTop = selectedPointInfo ? selectedPointInfo.yPx < 110 : false;

  return (
    <div className="bg-white rounded-3xl p-4 sm:p-5 shadow-xs border border-stone-200/90 space-y-2 relative">
      {/* 吹き出し表示時の画面外タップ検知バックドロップ */}
      {selectedPointInfo && (
        <div
          className="fixed inset-0 z-20 pointer-events-auto bg-transparent"
          onClick={(e) => {
            e.stopPropagation();
            setSelectedPointInfo(null);
          }}
        />
      )}

      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Activity className="w-4 h-4 text-amber-800" />
          <h3 className="text-xs font-black text-stone-900">体内カフェイン推移</h3>
        </div>
        <div className="flex items-center space-x-2.5 text-[10px] font-bold text-stone-500">
          <span className="flex items-center space-x-1">
            <span className="inline-block w-3 border-b-2 border-dashed border-emerald-500"></span>
            <span className="text-emerald-700">快眠安全域 (&lt;25mg)</span>
          </span>
          <span className="flex items-center space-x-1">
            <span className="inline-block w-3 border-b-2 border-dashed border-red-500"></span>
            <span className="text-red-600">覚醒警戒域 (&ge;50mg)</span>
          </span>
        </div>
      </div>

      {/* グラフキャンバス & 一体型フローティング吹き出し & ドラッグスクラブ */}
      <div
        ref={containerRef}
        className="h-56 sm:h-64 w-full cursor-pointer relative select-none touch-none"
        onPointerDown={(e) => {
          isDraggingRef.current = true;
          updatePointAtClientX(e.clientX);
        }}
        onPointerMove={(e) => {
          if (isDraggingRef.current) {
            updatePointAtClientX(e.clientX);
          }
        }}
        onPointerUp={() => {
          isDraggingRef.current = false;
        }}
        onPointerCancel={() => {
          isDraggingRef.current = false;
        }}
      >
        <Line ref={chartRef} data={chartData} options={options} onClick={handleChartClick} />

        {/* グラフ上の選択位置に確実に表示されるオレンジのハイライトピン（パルス波紋付き） */}
        {selectedPointInfo && (
          <div
            className="absolute rounded-full w-3.5 h-3.5 bg-amber-500 border-2 border-white shadow-md pointer-events-none z-20 transition-all duration-75 ease-out"
            style={{
              left: `${selectedPointInfo.rawXPx}px`,
              top: `${selectedPointInfo.yPx}px`,
              transform: 'translate(-50%, -50%)',
            }}
          >
            <span className="absolute -inset-1 rounded-full bg-amber-400/40 animate-ping" />
          </div>
        )}

        {/* グラフ内ピン留めインタラクティブ吹き出し（ドラッグ中リアルタイム追従 ＆ ボタン一体化 ＆ 先端オフセット補正） */}
        {selectedPointInfo && (
          <div
            ref={popupRef}
            className="absolute z-30 pointer-events-auto transition-transform duration-75 ease-out animate-fadeIn"
            style={{
              left: `${selectedPointInfo.boxXPx}px`,
              top: isNearTop
                ? `${selectedPointInfo.yPx + 12}px`
                : `${selectedPointInfo.yPx - 10}px`,
              transform: isNearTop ? 'translate(-50%, 0)' : 'translate(-50%, -100%)',
            }}
            onPointerDown={(e) => e.stopPropagation()}
            onPointerMove={(e) => e.stopPropagation()}
            onPointerUp={(e) => e.stopPropagation()}
            onTouchStart={(e) => e.stopPropagation()}
            onTouchMove={(e) => e.stopPropagation()}
            onTouchEnd={(e) => e.stopPropagation()}
          >
            <div className="bg-stone-900/95 text-white text-xs rounded-2xl p-2.5 shadow-2xl border border-stone-700 min-w-[170px] max-w-[210px] backdrop-blur-md space-y-1.5 relative">
              {/* 吹き出しのアロー：選択ポイントの exact X 座標へ先端を精密補正 */}
              {isNearTop ? (
                <div
                  className="absolute bottom-full w-0 h-0 border-x-6 border-x-transparent border-b-6 border-b-stone-900/95"
                  style={{
                    left: `calc(50% + ${Math.max(-75, Math.min(75, selectedPointInfo.rawXPx - selectedPointInfo.boxXPx))}px)`,
                    transform: 'translateX(-50%)',
                  }}
                />
              ) : (
                <div
                  className="absolute top-full w-0 h-0 border-x-6 border-x-transparent border-t-6 border-t-stone-900/95"
                  style={{
                    left: `calc(50% + ${Math.max(-75, Math.min(75, selectedPointInfo.rawXPx - selectedPointInfo.boxXPx))}px)`,
                    transform: 'translateX(-50%)',
                  }}
                />
              )}

              {/* ヘッダー：時刻 ＆ 閉じるボタン */}
              <div className="flex items-center justify-between border-b border-stone-800 pb-1">
                <span className="font-mono font-bold text-amber-400 text-[11px]">
                  {selectedPointInfo.timeLabel}
                </span>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedPointInfo(null);
                  }}
                  className="text-stone-400 hover:text-white p-0.5 rounded-full cursor-pointer"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>

              {/* 残存カフェイン量 */}
              <div className="flex items-baseline justify-between pt-0.5">
                <span className="text-[11px] text-stone-300">体内残存:</span>
                <span className="font-mono font-black text-sm text-white">
                  {selectedPointInfo.caffeineMg} <span className="text-[10px] font-normal text-stone-400">mg</span>
                </span>
              </div>

              {/* イベント情報がある場合 */}
              {selectedPointInfo.event && (
                <div className="bg-amber-950/60 border border-amber-800/40 rounded-lg px-2 py-1 text-[11px] text-amber-200 font-medium">
                  ☕ {selectedPointInfo.event.name} (+{selectedPointInfo.event.caffeineMg}mg)
                </div>
              )}

              {/* アクションボタン */}
              <div className="pt-1">
                {selectedPointInfo.event ? (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      if (selectedPointInfo.event) {
                        onSelectEventToEdit(selectedPointInfo.event);
                        setSelectedPointInfo(null);
                      }
                    }}
                    className="w-full py-1.5 bg-amber-600 hover:bg-amber-500 active:scale-95 text-white font-bold text-xs rounded-xl shadow-xs transition-all cursor-pointer text-center"
                  >
                    ✏️ 編集・削除
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleConfirmAddAtTime();
                    }}
                    className="w-full py-1.5 bg-sky-600 hover:bg-sky-500 active:scale-95 text-white font-black text-xs rounded-xl flex items-center justify-center space-x-1 shadow-xs transition-all cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>この時間に追加</span>
                  </button>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
