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
 * 就寝時刻（Date）の算出
 * 「今夜の就寝」として、今日の朝起きてから夜寝るまでの時間軸を正確に合わせる
 */
export function getUpcomingBedTime(currentTime: Date, bedTimeStr: string): Date {
  const [hStr, mStr] = bedTimeStr.split(':');
  const hours = parseInt(hStr, 10) || 23;
  const minutes = parseInt(mStr, 10) || 30;

  const bedDate = new Date(currentTime);
  bedDate.setHours(hours, minutes, 0, 0);

  // 就寝時刻が深夜（0時〜5時）の場合
  if (hours < 6) {
    if (currentTime.getHours() >= 6) {
      // 昼や夜から見て今夜寝る（＝翌日未明）
      bedDate.setDate(bedDate.getDate() + 1);
    }
  } else {
    // 就寝時刻が夜（6時以降）の場合
    if (currentTime.getHours() < 6) {
      // 現在が深夜3時で就寝が23:30の場合、今夜の就寝は今日23:30
      bedDate.setHours(hours, minutes, 0, 0);
    }
  }
  return bedDate;
}

/**
 * 睡眠影響の判定区分（EFSA / 睡眠医学基準）
 */
export function evaluateSleepImpact(caffeineMg: number): SleepEvaluation {
  if (caffeineMg < 25) {
    return {
      status: 'SAFE',
      label: '快眠ゾーン（影響なし）',
      color: '#10B981', // green-500
      bgColor: '#ECFDF5', // green-50
      borderColor: '#A7F3D0', // green-200
      description: '就寝時のカフェイン覚醒作用は実質ゼロです。深い眠り（徐波睡眠）を守れます。',
    };
  }
  if (caffeineMg < 50) {
    return {
      status: 'CAUTION',
      label: '注意ゾーン（軽度影響）',
      color: '#F59E0B', // amber-500
      bgColor: '#FFFBEB', // amber-50
      borderColor: '#FDE68A', // amber-200
      description: 'カフェインに敏感な方は、入眠遅延や中途覚醒のリスクがあります。',
    };
  }
  return {
    status: 'WARNING',
    label: '覚醒・睡眠阻害リスク',
    color: '#EF4444', // red-500
    bgColor: '#FEF2F2', // red-50
    borderColor: '#FECACA', // red-200
    description: '深睡眠の減少や覚醒リスクが高まります。これ以上の摂取は控えましょう。',
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
    return bedTime;
  }

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
  const bedCaffeineMg = calculateTotalCaffeineAt(events, bedTime, halfLifeHours);
  const roundedBedMg = Math.round(bedCaffeineMg * 10) / 10;
  const evaluation = evaluateSleepImpact(roundedBedMg);
  const totalDailyCaffeineMg = events.reduce((sum, e) => sum + e.caffeineMg, 0);

  // グラフ時間範囲の設定：
  // 朝06:00から今夜の就寝＋3時間後（または最長翌朝06:00）までを1日のベースとする
  const todayMorning = new Date(currentTime);
  todayMorning.setHours(6, 0, 0, 0);

  let startMs = todayMorning.getTime();
  let endMs = bedTime.getTime() + 3 * 60 * 60 * 1000;

  // イベントが早朝や深夜にある場合は範囲を包含
  for (const ev of events) {
    const evMs = new Date(ev.timestamp).getTime();
    if (evMs < startMs) {
      startMs = evMs - 30 * 60 * 1000;
    }
    if (evMs + 4 * 60 * 60 * 1000 > endMs) {
      endMs = evMs + 4 * 60 * 60 * 1000;
    }
  }

  const graphStart = new Date(startMs);
  const graphEnd = new Date(endMs);

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
