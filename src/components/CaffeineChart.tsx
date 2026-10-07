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

    // 最も近い現在時刻のインデックスをタイムスタンプで検索
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

    // 最も近い就寝時刻のインデックスを検索
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
          // 各イベントの時刻と7.5分以内なら点を表示
          const hasEvent = events.some((e) => {
            const evTime = new Date(e.timestamp).getTime();
            return Math.abs(evTime - pointTime) <= 7.5 * 60 * 1000;
          });
          return hasEvent ? 5 : 0;
        },
        pointBackgroundColor: '#F59E0B',
        pointBorderColor: '#78350F',
        pointBorderWidth: 2,
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
              return Math.abs(evTime - pTime) <= 7.5 * 60 * 1000;
            });
            if (matched.length > 0) {
              return matched.map((e) => `☕ 摂取: ${e.name} (+${e.caffeineMg}mg)`).join('\n');
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
    <div className="bg-white rounded-3xl p-4 sm:p-5 shadow-xs border border-stone-200/90 space-y-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Activity className="w-4 h-4 text-amber-800" />
          <h3 className="text-xs font-black text-stone-900">体内カフェイン推移</h3>
        </div>
        <div className="flex items-center space-x-2 text-[10px] font-bold text-stone-500">
          <span className="flex items-center">
            <span className="w-2 h-2 rounded-full bg-emerald-500 mr-1"></span>
            快眠域 (&lt;25mg)
          </span>
          <span className="flex items-center">
            <span className="w-2 h-2 rounded-full bg-red-500 mr-1"></span>
            覚醒域 (&ge;50mg)
          </span>
        </div>
      </div>

      <div className="h-56 sm:h-64 w-full">
        <Line data={chartData} options={options} />
      </div>
    </div>
  );
};
