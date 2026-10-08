import type { IntakeEvent, SleepEvaluation, SimulationSummary, ChartDataPoint } from '../types/caffeine';
import { startOfDay, addDays, format } from 'date-fns';

/**
 * 「昨日・今日・明日」の3日間に収まるイベントのみ保持し、それ以外（一昨日以前、明後日以降）を自動削除する
 */
export function cleanOldEvents(events: IntakeEvent[], baseDate: Date = new Date()): IntakeEvent[] {
  const yesterdayStart = startOfDay(addDays(baseDate, -1));
  const tomorrowEnd = startOfDay(addDays(baseDate, 2)); // 明日の23:59:59まで
  return events.filter((e) => {
    const timeMs = new Date(e.timestamp).getTime();
    return timeMs >= yesterdayStart.getTime() && timeMs < tomorrowEnd.getTime();
  });
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
 * 睡眠影響の判定区分（EFSA / 睡眠医学基準・設定された安全閾値に連動）
 */
export function evaluateSleepImpact(caffeineMg: number, safeThresholdMg: number = 25): SleepEvaluation {
  const cautionThreshold = safeThresholdMg * 2;

  if (caffeineMg <= safeThresholdMg) {
    return {
      status: 'SAFE',
      label: '快眠ゾーン（影響なし）',
      color: '#10B981', // green-500
      bgColor: '#ECFDF5', // green-50
      borderColor: '#A7F3D0', // green-200
      description: `就寝時のカフェイン残存が ${safeThresholdMg}mg 以下です。深い眠り（徐波睡眠）を守れます。`,
    };
  }
  if (caffeineMg < cautionThreshold) {
    return {
      status: 'CAUTION',
      label: '注意ゾーン（軽度影響）',
      color: '#F59E0B', // amber-500
      bgColor: '#FFFBEB', // amber-50
      borderColor: '#FDE68A', // amber-200
      description: `入眠潜時の延長や中途覚醒のリスクがあります（安全上限: ${safeThresholdMg}mg）。`,
    };
  }
  return {
    status: 'WARNING',
    label: '警戒ゾーン（睡眠阻害）',
    color: '#EF4444', // red-500
    bgColor: '#FEF2F2', // red-50
    borderColor: '#FECACA', // red-200
    description: `アデノシン受容体がブロックされ、睡眠の質が大幅に低下する危険性が高い状態です（基準: ≥${cautionThreshold}mg）。`,
  };
}

/**
 * 指数関数的カフェイン減衰モデル & 1コンパートメント経口吸収モデル (Bateman関数)
 */
export function calculateRemainingCaffeine(
  initialMg: number,
  elapsedHours: number,
  halfLifeHours: number,
  useOralAbsorption: boolean = false
): number {
  if (elapsedHours <= 0) return 0;

  if (!useOralAbsorption) {
    // 瞬時吸収近似: C0 * (1/2)^(t / halfLife)
    return initialMg * Math.pow(0.5, elapsedHours / halfLifeHours);
  }

  // 1コンパートメント経口投与モデル (Bateman関数)
  // ka: 経口吸収速度定数 (約 4.5 /h => 吸収半減期 約9分, Tmax 約40分)
  const ka = 4.5;
  const ke = Math.LN2 / halfLifeHours;

  if (Math.abs(ka - ke) < 0.0001) {
    return initialMg * ka * elapsedHours * Math.exp(-ke * elapsedHours);
  }

  // C(t) = Dose * (ka / (ka - ke)) * (e^(-ke * t) - e^(-ka * t))
  const remaining = initialMg * (ka / (ka - ke)) * (Math.exp(-ke * elapsedHours) - Math.exp(-ka * elapsedHours));
  return Math.max(0, remaining);
}

/**
 * 指定時刻（targetTime）における全摂取イベントの合算体内カフェイン残存量（mg）
 */
export function calculateTotalCaffeineAt(
  events: IntakeEvent[],
  targetTime: Date,
  halfLifeHours: number,
  useOralAbsorption: boolean = false
): number {
  let total = 0;
  const targetMs = targetTime.getTime();

  for (const event of events) {
    const eventMs = new Date(event.timestamp).getTime();
    if (targetMs >= eventMs) {
      const elapsedHours = (targetMs - eventMs) / (1000 * 60 * 60);
      total += calculateRemainingCaffeine(event.caffeineMg, elapsedHours, halfLifeHours, useOralAbsorption);
    }
  }

  return total;
}

/**
 * 今（currentTime）飲んだ場合に、就寝時刻（bedTime）で安全閾値（25mg）以下に収まる最大許容量
 */
export function calculateMaxSafeCaffeineMg(
  currentEvents: IntakeEvent[],
  currentTime: Date,
  bedTime: Date,
  halfLifeHours: number,
  safeThresholdMg: number = 25
): number {
  const existingAtBed = calculateTotalCaffeineAt(currentEvents, bedTime, halfLifeHours);
  const remainingAllowanceAtBed = Math.max(0, safeThresholdMg - existingAtBed);

  const hoursToBed = Math.max(0, (bedTime.getTime() - currentTime.getTime()) / (1000 * 60 * 60));
  if (hoursToBed <= 0) return 0;

  const maxInitialMg = remainingAllowanceAtBed * Math.pow(2, hoursToBed / halfLifeHours);
  return Math.max(0, Math.round(maxInitialMg * 10) / 10);
}

/**
 * 今飲める最大粉末量（g）
 */
export function calculateMaxSafePowderGrams(
  currentEvents: IntakeEvent[],
  currentTime: Date,
  bedTime: Date,
  halfLifeHours: number,
  safeThresholdMg: number = 25,
  caffeinePerGram: number = 40
): number {
  const maxMg = calculateMaxSafeCaffeineMg(currentEvents, currentTime, bedTime, halfLifeHours, safeThresholdMg);
  return Math.max(0, Math.round((maxMg / caffeinePerGram) * 10) / 10);
}

/**
 * 指定カフェイン量（doseMg）を飲む場合の就寝前最終デッドライン時刻
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
  intervalMinutes: number = 15,
  useOralAbsorption: boolean = false
): ChartDataPoint[] {
  const points: ChartDataPoint[] = [];
  const current = new Date(startTime.getTime());
  const endMs = endTime.getTime();

  while (current.getTime() <= endMs) {
    const caffeineMg = calculateTotalCaffeineAt(events, current, halfLifeHours, useOralAbsorption);
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
  halfLifeHours: number,
  targetDoseMg: number = 80,
  targetName: string = '標準2g (80mg)',
  safeThresholdMg: number = 25,
  useOralAbsorption: boolean = false
): SimulationSummary {
  // 就寝時残存量は就寝時点での計算（経口吸収ON時も就寝時点では同じ値）
  const bedCaffeineMg = calculateTotalCaffeineAt(events, bedTime, halfLifeHours, useOralAbsorption);
  const roundedBedMg = Math.round(bedCaffeineMg * 10) / 10;
  const evaluation = evaluateSleepImpact(roundedBedMg, safeThresholdMg);
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

  const hourlyPoints = generateSimulationPoints(events, graphStart, graphEnd, halfLifeHours, 15, useOralAbsorption);
  const maxSafePowderGrams = calculateMaxSafePowderGrams(events, currentTime, bedTime, halfLifeHours, safeThresholdMg);
  const maxSafeCaffeineMg = calculateMaxSafeCaffeineMg(events, currentTime, bedTime, halfLifeHours, safeThresholdMg);
  const deadlineForTarget = calculateDeadlineForDose(events, targetDoseMg, bedTime, halfLifeHours, safeThresholdMg);

  return {
    bedTime,
    bedCaffeineMg: roundedBedMg,
    evaluation,
    totalDailyCaffeineMg,
    hourlyPoints,
    maxSafePowderGrams,
    maxSafeCaffeineMg,
    deadlineForTarget,
    targetPresetName: targetName,
    safeSleepThresholdMg: safeThresholdMg,
  };
}
