import React, { useMemo } from 'react';
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
import { Line } from 'react-chartjs-2';
import type { ChartDataPoint, IntakeEvent } from '../types/caffeine';
import { Activity } from 'lucide-react';
import { format } from 'date-fns';

// Chart.js プラグイン登録
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
}

export const CaffeineChart: React.FC<CaffeineChartProps> = ({
  points,
  events,
  currentTime,
  bedTime,
}) => {
  const currentFormatted = format(currentTime, 'HH:mm');
  const bedFormatted = format(bedTime, 'HH:mm');

  // 最も近いラベルのインデックスを特定
  const { labels, dataValues, eventAnnotations } = useMemo(() => {
    const lbls = points.map((p) => p.timeLabel);
    const vals = points.map((p) => p.caffeineMg);

    // イベント発生時刻のマーカーアノテーションを構築
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const annotations: any = {};

    // 25mg 安全ライン
    annotations['safeLine'] = {
      type: 'line',
      yMin: 25,
      yMax: 25,
      borderColor: 'rgba(16, 185, 129, 0.75)',
      borderWidth: 1.5,
      borderDash: [5, 4],
      label: {
        display: true,
        content: '安全閾値 (25mg)',
        position: 'start',
        backgroundColor: 'rgba(16, 185, 129, 0.9)',
        color: '#ffffff',
        font: { size: 10, weight: 'bold' },
        padding: 4,
        borderRadius: 4,
      },
    };

    // 50mg 覚醒リスクライン
    annotations['warningLine'] = {
      type: 'line',
      yMin: 50,
      yMax: 50,
      borderColor: 'rgba(239, 68, 68, 0.75)',
      borderWidth: 1.5,
      borderDash: [5, 4],
      label: {
        display: true,
        content: '覚醒リスク (50mg)',
        position: 'start',
        backgroundColor: 'rgba(239, 68, 68, 0.9)',
        color: '#ffffff',
        font: { size: 10, weight: 'bold' },
        padding: 4,
        borderRadius: 4,
      },
    };

    // 現在時刻マーカー
    const curIdx = lbls.findIndex((l) => l === currentFormatted);
    if (curIdx !== -1) {
      annotations['currentLine'] = {
        type: 'line',
        xMin: curIdx,
        xMax: curIdx,
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
    const bedIdx = lbls.findIndex((l) => l === bedFormatted);
    if (bedIdx !== -1) {
      annotations['bedLine'] = {
        type: 'line',
        xMin: bedIdx,
        xMax: bedIdx,
        borderColor: 'rgba(109, 40, 217, 0.85)',
        borderWidth: 2,
        label: {
          display: true,
          content: `就寝 (${bedFormatted})`,
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
  }, [points, currentFormatted, bedFormatted]);

  const maxVal = Math.max(...dataValues, 60);

  const chartData = {
    labels,
    datasets: [
      {
        label: '体内残存カフェイン (mg)',
        data: dataValues,
        fill: true,
        backgroundColor: (context: { chart: { ctx: CanvasRenderingContext2D } }) => {
          const ctx = context.chart.ctx;
          const gradient = ctx.createLinearGradient(0, 0, 0, 280);
          gradient.addColorStop(0, 'rgba(180, 83, 9, 0.35)');
          gradient.addColorStop(0.5, 'rgba(217, 119, 6, 0.15)');
          gradient.addColorStop(1, 'rgba(245, 158, 11, 0.01)');
          return gradient;
        },
        borderColor: '#B45309',
        borderWidth: 2.5,
        pointRadius: (ctx: { dataIndex: number }) => {
          // イベント発生時刻と一致する点にマーカーを付ける
          const pointLabel = labels[ctx.dataIndex];
          const hasEvent = events.some(
            (e) => format(new Date(e.timestamp), 'HH:mm') === pointLabel
          );
          return hasEvent ? 6 : 0;
        },
        pointBackgroundColor: '#F59E0B',
        pointBorderColor: '#78350F',
        pointBorderWidth: 2,
        tension: 0.3,
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
        titleFont: { size: 12, weight: 'bold' },
        bodyFont: { size: 12, weight: 'normal' },
        padding: 10,
        cornerRadius: 8,
        displayColors: false,
        callbacks: {
          title: (items) => {
            if (!items.length) return '';
            return `時刻: ${items[0].label}`;
          },
          label: (item) => {
            const mg = item.parsed.y;
            return `体内残存カフェイン: ${mg} mg`;
          },
          afterLabel: (item) => {
            const itemLabel = item.label;
            const matchedEvents = events.filter(
              (e) => format(new Date(e.timestamp), 'HH:mm') === itemLabel
            );
            if (matchedEvents.length > 0) {
              return matchedEvents.map((e) => `☕ 摂取: ${e.name} (+${e.caffeineMg}mg)`).join('\n');
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
          color: 'rgba(214, 211, 209, 0.3)',
        },
        ticks: {
          font: { size: 10, weight: 'bold' },
          color: '#57534E',
          maxRotation: 0,
          autoSkip: true,
          maxTicksLimit: 10,
        },
      },
      y: {
        min: 0,
        max: Math.ceil(maxVal * 1.15 / 10) * 10,
        grid: {
          color: 'rgba(214, 211, 209, 0.3)',
        },
        ticks: {
          font: { size: 10, weight: 'bold' },
          color: '#57534E',
          callback: (value) => `${value}mg`,
        },
      },
    },
  };

  return (
    <div className="bg-white rounded-3xl p-5 shadow-sm border border-stone-200/90 space-y-3">
      {/* グラフ上部ヘッダー */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <div className="w-7 h-7 rounded-lg bg-amber-100 flex items-center justify-center text-amber-800">
            <Activity className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-extrabold text-stone-900">体内カフェイン推移シミュレーション</h3>
            <p className="text-[11px] text-stone-700">線形重ね合わせ代謝モデルによる時系列予測</p>
          </div>
        </div>
        <div className="flex items-center space-x-3 text-[11px] font-semibold text-stone-600">
          <span className="flex items-center">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 mr-1 inline-block"></span>
            安全域(&lt;25mg)
          </span>
          <span className="flex items-center">
            <span className="w-2.5 h-2.5 rounded-full bg-red-500 mr-1 inline-block"></span>
            阻害域(&ge;50mg)
          </span>
        </div>
      </div>

      {/* グラフ描画領域 */}
      <div className="h-64 sm:h-72 w-full pt-1">
        <Line data={chartData} options={options} />
      </div>
    </div>
  );
};
