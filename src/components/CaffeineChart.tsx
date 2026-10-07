import React, { useMemo, useRef } from 'react';
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
import { Activity, Plus, Edit2 } from 'lucide-react';
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
  onEditBedTime?: () => void;
}

export const CaffeineChart: React.FC<CaffeineChartProps> = ({
  points,
  events,
  currentTime,
  bedTime,
  onSelectEventToEdit,
  onSelectTimeToBrew,
  onEditBedTime,
}) => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const chartRef = useRef<any>(null);

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

    // クリックされたデータ要素を取得
    const element = getElementAtEvent(chart, event);
    let targetIndex = -1;

    if (element && element.length > 0) {
      targetIndex = element[0].index;
    } else {
      // 要素直接でない場合、X座標から最も近いポイントを算出
      const rect = chart.canvas.getBoundingClientRect();
      const x = event.clientX - rect.left;
      const xAxis = chart.scales.x;
      if (xAxis) {
        const val = xAxis.getValueForPixel(x);
        if (typeof val === 'number') {
          targetIndex = Math.max(0, Math.min(points.length - 1, Math.round(val)));
        }
      }
    }

    if (targetIndex === -1 || !points[targetIndex]) return;

    const clickedPoint = points[targetIndex];
    const pointMs = clickedPoint.time.getTime();

    // 1. 就寝時刻マーカー近辺（15分以内）のクリック判定
    const bedMs = bedTime.getTime();
    if (Math.abs(pointMs - bedMs) <= 15 * 60 * 1000 && onEditBedTime) {
      onEditBedTime();
      return;
    }

    // 2. その時刻に一致する摂取イベントがあるか検索（前後15分以内）
    const matchedEvent = events.find((e) => {
      const evMs = new Date(e.timestamp).getTime();
      return Math.abs(evMs - pointMs) <= 15 * 60 * 1000;
    });

    if (matchedEvent) {
      // 既存イベントあり $\to$ 編集・削除モーダルを開く
      onSelectEventToEdit(matchedEvent);
    } else {
      // イベントなし $\to$ スライダーをこの時刻に合わせてパネルへすっとスクロール
      onSelectTimeToBrew(clickedPoint.time);
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
          const hasEvent = events.some((e) => {
            const evTime = new Date(e.timestamp).getTime();
            return Math.abs(evTime - pointTime) <= 7.5 * 60 * 1000;
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
              return Math.abs(evTime - pTime) <= 15 * 60 * 1000;
            });
            if (matched.length > 0) {
              return matched.map((e) => `☕ ${e.name} (+${e.caffeineMg}mg) [タップで編集]`).join('\n');
            }
            return '👉 タップしてこの時刻にコーヒーを追加';
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
    <div className="bg-white rounded-3xl p-4 sm:p-5 shadow-xs border border-stone-200/90 space-y-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Activity className="w-4 h-4 text-amber-800" />
          <h3 className="text-xs font-black text-stone-900">体内カフェイン推移</h3>
          <span className="text-[10px] text-stone-600 hidden sm:inline">（タップして編集・時間指定追加）</span>
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

      {/* グラフ下部ヘルプミニバー */}
      <div className="flex items-center justify-between text-[11px] text-stone-600 pt-1 border-t border-stone-100">
        <span className="flex items-center space-x-1">
          <Edit2 className="w-3 h-3 text-amber-700" />
          <span>丸い点をタップ：記録を編集・削除</span>
        </span>
        <span className="flex items-center space-x-1">
          <Plus className="w-3 h-3 text-sky-700" />
          <span>線をタップ：その時刻にドリンク追加</span>
        </span>
      </div>
    </div>
  );
};
