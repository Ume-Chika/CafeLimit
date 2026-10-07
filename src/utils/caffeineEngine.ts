import type { IntakeEvent, SleepEvaluation, SimulationSummary, ChartDataPoint } from '../types/caffeine';
import { startOfDay, addDays, format } from 'date-fns';

/**
 * 昨日の00:00以前（一昨日以前）のイベントを自動削除し、昨日・今日・未来のみ保持する
 */
export function cleanOldEvents(events: IntakeEvent[], baseDate: Date = new Date()): IntakeEvent[] {
  const yesterdayStart = startOfDay(addDays(baseDate, -1));
  return events.filter((e) => new Date(e.timestamp).getTime() >= yesterdayStart.getTime());
}

/**
 * 睡眠影響の判定区分（EFSA / 睡眠医学基準）
 */
export function evaluateSleepImpact(caffeineMg: number): SleepEvaluation {
  if (caffeineMg < 25) {
    return {
      status: 'SAFE',
      label: '快眠ゾーン',
      color: '#10B981', // green-500
      bgColor: '#ECFDF5', // green-50
      borderColor: '#A7F3D0', // green-200
      description: '睡眠への影響はありません。深い徐波睡眠を維持できます。',
    };
  }
  if (caffeineMg < 50) {
    return {
      status: 'CAUTION',
      label: '注意ゾーン',
      color: '#F59E0B', // amber-500
      bgColor: '#FFFBEB', // amber-50
      borderColor: '#FDE68A', // amber-200
      description: '高感受性者で入眠遅延や眠りの浅さのリスクがあります。',
    };
  }
  return {
    status: 'WARNING',
    label: '覚醒・睡眠阻害リスク',
    color: '#EF4444', // red-500
    bgColor: '#FEF2F2', // red-50
    borderColor: '#FECACA', // red-200
    description: '中途覚醒や深睡眠の短縮リスクが高まります。摂取を控えてください。',
  };
}

/**
 * 単一摂取の経過時間後における残存カフェイン量（mg）
 */
export function calculateRemainingCaffeine(
  initialMg: number,
  elapsedHours: number,
  halfLifeHours: number
): number {
  if (elapsedHours <= 0) return 0;
  return initialMg * Math.pow(0.5, elapsedHours / halfLifeHours);
}

/**
 * 指定時刻（targetTime）における全摂取イベントの合算体内カフェイン残存量（mg）
 */
export function calculateTotalCaffeineAt(
  events: IntakeEvent[],
  targetTime: Date,
  halfLifeHours: number
): number {
  let total = 0;
  const targetMs = targetTime.getTime();

  for (const event of events) {
    const eventMs = new Date(event.timestamp).getTime();
    if (targetMs >= eventMs) {
      const elapsedHours = (targetMs - eventMs) / (1000 * 60 * 60);
      total += calculateRemainingCaffeine(event.caffeineMg, elapsedHours, halfLifeHours);
    }
  }

  return total;
}

/**
 * 今（currentTime）飲んだ場合に、就寝時刻（bedTime）で安全閾値（25mg）以下に収まる最大粉末量（g）
 * ネスカフェ原単位 40mg/g
 */
export function calculateMaxSafePowderGrams(
  currentEvents: IntakeEvent[],
  currentTime: Date,
  bedTime: Date,
  halfLifeHours: number,
  safeThresholdMg: number = 25,
  caffeinePerGram: number = 40
): number {
  const existingAtBed = calculateTotalCaffeineAt(currentEvents, bedTime, halfLifeHours);
  const remainingAllowanceAtBed = Math.max(0, safeThresholdMg - existingAtBed);

  const hoursToBed = Math.max(0, (bedTime.getTime() - currentTime.getTime()) / (1000 * 60 * 60));
  if (hoursToBed <= 0) return 0;

  // C_bed = C_0 * 0.5^(hours / halfLife) => C_0 = C_bed * 2^(hours / halfLife)
  const maxInitialMg = remainingAllowanceAtBed * Math.pow(2, hoursToBed / halfLifeHours);
  const maxGrams = maxInitialMg / caffeinePerGram;

  return Math.max(0, Math.round(maxGrams * 10) / 10);
}

/**
 * 規定粉末量（標準2g = 80mg）を飲む場合の就寝前最終デッドライン時刻
 */
export function calculateDeadlineForDose(
  currentEvents: IntakeEvent[],
  doseMg: number,
  bedTime: Date,
  halfLifeHours: number,
  safeThresholdMg: number = 25
): Date {
  const existingAtBed = calculateTotalCaffeineAt(currentEvents, bedTime, halfLifeHours);
  const allowedFromThisDose = Math.max(0.1, safeThresholdMg - existingAtBed);

  if (doseMg <= allowedFromThisDose) {
    // 就寝直前でもOK
    return bedTime;
  }

  // allowed = doseMg * (0.5)^(deltaT / halfLife) => deltaT = halfLife * log2(doseMg / allowed)
  const requiredHours = halfLifeHours * (Math.log(doseMg / allowedFromThisDose) / Math.log(2));
  const deadlineMs = bedTime.getTime() - requiredHours * 60 * 60 * 1000;

  return new Date(deadlineMs);
}

/**
 * グラフ描画用時系列データポイントの生成
 */
export function generateSimulationPoints(
  events: IntakeEvent[],
  startTime: Date,
  endTime: Date,
  halfLifeHours: number,
  intervalMinutes: number = 15
): ChartDataPoint[] {
  const points: ChartDataPoint[] = [];
  const current = new Date(startTime.getTime());
  const endMs = endTime.getTime();

  while (current.getTime() <= endMs) {
    const caffeineMg = calculateTotalCaffeineAt(events, current, halfLifeHours);
    const timeLabel = format(current, 'HH:mm');

    points.push({
      time: new Date(current),
      timeLabel,
      caffeineMg: Math.round(caffeineMg * 10) / 10,
    });

    current.setMinutes(current.getMinutes() + intervalMinutes);
  }

  return points;
}

/**
 * シミュレーション全体のサマリー生成
 */
export function runSimulation(
  events: IntakeEvent[],
  currentTime: Date,
  bedTime: Date,
  halfLifeHours: number
): SimulationSummary {
  // 就寝時残存カフェイン量
  const bedCaffeineMg = calculateTotalCaffeineAt(events, bedTime, halfLifeHours);
  const roundedBedMg = Math.round(bedCaffeineMg * 10) / 10;
  const evaluation = evaluateSleepImpact(roundedBedMg);

  // 1日総摂取量
  const totalDailyCaffeineMg = events.reduce((sum, e) => sum + e.caffeineMg, 0);

  // グラフ時間範囲の動的算出：イベントが存在する時間帯を確実にカバーする
  const todayMorning = new Date(currentTime);
  todayMorning.setHours(6, 0, 0, 0);

  let earliestMs = Math.min(todayMorning.getTime(), currentTime.getTime() - 4 * 60 * 60 * 1000);
  let latestMs = Math.max(bedTime.getTime() + 4 * 60 * 60 * 1000, currentTime.getTime() + 6 * 60 * 60 * 1000);

  if (events.length > 0) {
    for (const ev of events) {
      const evMs = new Date(ev.timestamp).getTime();
      if (evMs < earliestMs) {
        earliestMs = evMs - 60 * 60 * 1000; // イベント1時間前から
      }
      if (evMs + 6 * 60 * 60 * 1000 > latestMs) {
        latestMs = evMs + 6 * 60 * 60 * 1000;
      }
    }
  }

  const graphStart = new Date(earliestMs);
  graphStart.setMinutes(0, 0, 0);

  const graphEnd = new Date(latestMs);

  const hourlyPoints = generateSimulationPoints(events, graphStart, graphEnd, halfLifeHours, 15);

  const maxSafePowderGrams = calculateMaxSafePowderGrams(events, currentTime, bedTime, halfLifeHours);
  const deadlineFor2g = calculateDeadlineForDose(events, 80, bedTime, halfLifeHours);

  return {
    bedTime,
    bedCaffeineMg: roundedBedMg,
    evaluation,
    totalDailyCaffeineMg,
    hourlyPoints,
    maxSafePowderGrams,
    deadlineFor2g,
  };
}
