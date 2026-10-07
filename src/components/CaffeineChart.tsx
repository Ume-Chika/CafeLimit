import React, { useMemo, useRef, useState } from 'react';
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
  onFocusBedTime?: () => void;
}

export const CaffeineChart: React.FC<CaffeineChartProps> = ({
  points,
  events,
  currentTime,
  bedTime,
  onSelectEventToEdit,
  onSelectTimeToBrew,
  onFocusBedTime,
}) => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const chartRef = useRef<any>(null);

  // グラフ上でタップ選択された時間と残存量の情報
  const [selectedPointInfo, setSelectedPointInfo] = useState<{
    time: Date;
    timeLabel: string;
    caffeineMg: number;
    event?: IntakeEvent;
  } | null>(null);

  const { labels, dataValues, eventAnnotations } = useMemo(() => {
    const lbls = points.map((p) => p.timeLabel);
    const vals = points.map((p) => p.caffeineMg);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const annotations: any = {};

    // 25mg 安全ライン
    annotations['safeLine'] = {
      type: 'line',
      yMin: 25,
      yMax: 25,
      borderColor: 'rgba(16, 185, 129, 0.7)',
      borderWidth: 1.5,
      borderDash: [4, 4],
      label: {
        display: true,
        content: '安全閾値 (25mg)',
        position: 'start',
        backgroundColor: 'rgba(16, 185, 129, 0.85)',
        color: '#ffffff',
        font: { size: 10, weight: 'bold' },
        padding: 3,
        borderRadius: 4,
      },
    };

    // 50mg 覚醒リスクライン
    annotations['warningLine'] = {
      type: 'line',
      yMin: 50,
      yMax: 50,
      borderColor: 'rgba(239, 68, 68, 0.7)',
      borderWidth: 1.5,
      borderDash: [4, 4],
      label: {
        display: true,
        content: '覚醒リスク (50mg)',
        position: 'start',
        backgroundColor: 'rgba(239, 68, 68, 0.85)',
        color: '#ffffff',
        font: { size: 10, weight: 'bold' },
        padding: 3,
        borderRadius: 4,
      },
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
          backgroundColor: 'rgba(109, 40, 217, 0.9)',
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

  // グラフクリックハンドラ
  const handleChartClick = (event: React.MouseEvent<HTMLCanvasElement>) => {
    const chart = chartRef.current;
    if (!chart) return;

    // 1. 点要素を直接クリックしたか判定
    const element = getElementAtEvent(chart, event);
    if (element && element.length > 0) {
      const idx = element[0].index;
      const clickedP = points[idx];
      if (clickedP) {
        const pointMs = clickedP.time.getTime();
        // 厳密に一致するイベントを検索（前後5分以内）
        const matchedEvent = events.find((e) => {
          const evMs = new Date(e.timestamp).getTime();
          return Math.abs(evMs - pointMs) <= 5 * 60 * 1000;
        });

        if (matchedEvent) {
          onSelectEventToEdit(matchedEvent);
          return;
        }
      }
    }

    // 2. 線や空白エリアのクリック
    const rect = chart.canvas.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const xAxis = chart.scales.x;
    if (!xAxis) return;

    const val = xAxis.getValueForPixel(x);
    if (typeof val !== 'number') return;

    const targetIndex = Math.max(0, Math.min(points.length - 1, Math.round(val)));
    const clickedPoint = points[targetIndex];
    if (!clickedPoint) return;

    const pointMs = clickedPoint.time.getTime();

    // 就寝ライン近辺（10分以内）をクリックした場合
    const bedMs = bedTime.getTime();
    if (Math.abs(pointMs - bedMs) <= 10 * 60 * 1000 && onFocusBedTime) {
      onFocusBedTime();
      return;
    }

    // 正確に一致する既存イベントがあるか（前後5分）
    const matchedEvent = events.find((e) => {
      const evMs = new Date(e.timestamp).getTime();
      return Math.abs(evMs - pointMs) <= 5 * 60 * 1000;
    });

    // 選択情報ポップアップを表示（誤タップ防止：ボタンを押して初めて移動）
    setSelectedPointInfo({
      time: clickedPoint.time,
      timeLabel: format(clickedPoint.time, 'M/d(E) HH:mm'),
      caffeineMg: clickedPoint.caffeineMg,
      event: matchedEvent,
    });
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
          // イベント発生時刻の点のみ大きくプロット
          const hasEvent = events.some((e) => {
            const evTime = new Date(e.timestamp).getTime();
            return Math.abs(evTime - pointTime) <= 5 * 60 * 1000;
          });
          return hasEvent ? 6 : 0;
        },
        pointBackgroundColor: '#F59E0B',
        pointBorderColor: '#78350F',
        pointBorderWidth: 2,
        pointHoverRadius: 8,
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
      tooltip: {
        backgroundColor: 'rgba(28, 25, 23, 0.95)',
        titleColor: '#F59E0B',
        bodyColor: '#FFFFFF',
        titleFont: { size: 11, weight: 'bold' },
        bodyFont: { size: 11, weight: 'normal' },
        padding: 8,
        cornerRadius: 8,
        displayColors: false,
        callbacks: {
          title: (items) => {
            if (!items.length) return '';
            const idx = items[0].dataIndex;
            const pTime = points[idx]?.time;
            return pTime ? `${format(pTime, 'M/d(E) HH:mm')}` : `時刻: ${items[0].label}`;
          },
          label: (item) => {
            return `体内残存: ${item.parsed.y} mg`;
          },
          afterLabel: (item) => {
            const idx = item.dataIndex;
            const pTime = points[idx]?.time?.getTime();
            if (!pTime) return '';
            const matched = events.filter((e) => {
              const evTime = new Date(e.timestamp).getTime();
              return Math.abs(evTime - pTime) <= 5 * 60 * 1000;
            });
            if (matched.length > 0) {
              return matched.map((e) => `☕ ${e.name} (+${e.caffeineMg}mg) [タップで編集]`).join('\n');
            }
            return '';
          },
        },
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

  return (
    <div className="bg-white rounded-3xl p-4 sm:p-5 shadow-xs border border-stone-200/90 space-y-2 relative">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Activity className="w-4 h-4 text-amber-800" />
          <h3 className="text-xs font-black text-stone-900">体内カフェイン推移</h3>
        </div>
        <div className="flex items-center space-x-2 text-[10px] font-bold text-stone-500">
          <span className="flex items-center">
            <span className="w-2 h-2 rounded-full bg-emerald-500 mr-1"></span>
            快眠 (&lt;25mg)
          </span>
          <span className="flex items-center">
            <span className="w-2 h-2 rounded-full bg-red-500 mr-1"></span>
            覚醒 (&ge;50mg)
          </span>
        </div>
      </div>

      {/* グラフキャンバス */}
      <div className="h-56 sm:h-64 w-full cursor-pointer relative">
        <Line ref={chartRef} data={chartData} options={options} onClick={handleChartClick} />
      </div>

      {/* タップした位置のインタラクティブInfoバナー（誤タップ防止） */}
      {selectedPointInfo && (
        <div className="bg-stone-900/95 text-white p-2.5 sm:p-3 rounded-2xl flex items-center justify-between shadow-lg border border-stone-700 animate-fadeIn">
          <div className="flex items-center space-x-2 text-xs">
            <span className="font-mono font-black text-amber-400">{selectedPointInfo.timeLabel}</span>
            <span className="text-stone-300">残存: {selectedPointInfo.caffeineMg}mg</span>
            {selectedPointInfo.event && (
              <span className="text-amber-300 font-bold">（{selectedPointInfo.event.name}）</span>
            )}
          </div>

          <div className="flex items-center space-x-2">
            {selectedPointInfo.event ? (
              <button
                type="button"
                onClick={() => {
                  if (selectedPointInfo.event) {
                    onSelectEventToEdit(selectedPointInfo.event);
                    setSelectedPointInfo(null);
                  }
                }}
                className="px-2.5 py-1 bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs rounded-lg transition-all"
              >
                編集・削除
              </button>
            ) : (
              <button
                type="button"
                onClick={handleConfirmAddAtTime}
                className="px-3 py-1 bg-sky-600 hover:bg-sky-500 text-white font-black text-xs rounded-lg flex items-center space-x-1 shadow-xs transition-all active:scale-95 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>この時間に追加</span>
              </button>
            )}

            <button
              type="button"
              onClick={() => setSelectedPointInfo(null)}
              className="text-stone-400 hover:text-white p-1 rounded-full"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
