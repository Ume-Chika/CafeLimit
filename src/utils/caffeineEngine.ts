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
  const [hStr, mStr] = (bedTimeStr || '23:30').split(':');
  const parsedH = parseInt(hStr, 10);
  const parsedM = parseInt(mStr, 10);
  const hours = isNaN(parsedH) ? 23 : parsedH;
  const minutes = isNaN(parsedM) ? 30 : parsedM;

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
 * 指数関数的カフェイン減衰モデル & 1コンパートメント経口吸収モデル (Bateman関数 + 飲用時間連続入力)
 * 常に厳密な経口吸収モデル（ka = 4.5/h ＋ 飲用時間 Td 連続積分）で計算します。
 */
export function calculateRemainingCaffeine(
  initialMg: number,
  elapsedHours: number,
  halfLifeHours: number,
  drinkingDurationMinutes: number = 10
): number {
  if (elapsedHours <= 0) return 0;

  // 1コンパートメント経口投与モデル (Bateman関数 + 飲用時間連続積分)
  // ka: 経口吸収速度定数 (約 4.5 /h => 吸収半減期 約9分)
  const ka = 4.5;
  const ke = Math.LN2 / halfLifeHours;
  const duration = drinkingDurationMinutes ?? 10;
  const Td = Math.max(0, duration / 60);

  if (Td < 0.01) {
    if (Math.abs(ka - ke) < 0.0001) {
      return initialMg * ka * elapsedHours * Math.exp(-ke * elapsedHours);
    }
    const remaining = initialMg * (ka / (ka - ke)) * (Math.exp(-ke * elapsedHours) - Math.exp(-ka * elapsedHours));
    return Math.max(0, remaining);
  }

  const tau1 = Math.min(elapsedHours, Td);
  if (Math.abs(ka - ke) < 0.0001) {
    return initialMg * ka * elapsedHours * Math.exp(-ke * elapsedHours);
  }

  const termKe = (Math.exp(-ke * (elapsedHours - tau1)) - Math.exp(-ke * elapsedHours)) / ke;
  const termKa = (Math.exp(-ka * (elapsedHours - tau1)) - Math.exp(-ka * elapsedHours)) / ka;
  const remaining = (initialMg / Td) * (ka / (ka - ke)) * (termKe - termKa);

  return Math.max(0, remaining);
}

/**
 * 指定時刻（targetTime）における全摂取イベントの合算体内カフェイン残存量（mg）
 */
export function calculateTotalCaffeineAt(
  events: IntakeEvent[],
  targetTime: Date,
  halfLifeHours: number,
  drinkingDurationMinutes: number = 10
): number {
  let total = 0;
  const targetMs = targetTime.getTime();

  for (const event of events) {
    const eventMs = new Date(event.timestamp).getTime();
    if (targetMs >= eventMs) {
      const elapsedHours = (targetMs - eventMs) / (1000 * 60 * 60);
      const eventDuration = event.drinkingDurationMinutes !== undefined ? event.drinkingDurationMinutes : drinkingDurationMinutes;
      total += calculateRemainingCaffeine(event.caffeineMg, elapsedHours, halfLifeHours, eventDuration);
    }
  }

  return total;
}

/**
 * 経口吸収Batemanモデル & 飲用時間連続投与における長時間漸近補正係数 α
 *
 * 吸収終了後 (t >> T_d, t >> 1/ka) において、残存カフェイン量は
 * C(t) ≈ α * initialMg * 2^(-t / halfLifeHours)
 * に漸近する。
 * α = (ka / (ka - ke)) * ((exp(ke * Td) - 1) / (ke * Td))
 */
export function getOralAbsorptionAlpha(halfLifeHours: number, drinkingDurationMinutes: number = 10): number {
  const ka = 4.5;
  const ke = Math.LN2 / halfLifeHours;
  const duration = drinkingDurationMinutes ?? 10;
  const Td = Math.max(0, duration / 60);

  if (Math.abs(ka - ke) < 0.0001) {
    return 1;
  }

  const alphaKa = ka / (ka - ke);
  if (Td < 0.01) {
    return alphaKa;
  }

  const alphaTd = (Math.exp(ke * Td) - 1) / (ke * Td);
  return alphaKa * alphaTd;
}

/**
 * 今（currentTime）飲んだ場合に、就寝時刻（bedTime）で安全閾値（25mg等）以下に収まる最大許容量
 */
export function calculateMaxSafeCaffeineMg(
  currentEvents: IntakeEvent[],
  currentTime: Date,
  bedTime: Date,
  halfLifeHours: number,
  safeThresholdMg: number = 25,
  drinkingDurationMinutes: number = 10
): number {
  const existingAtBed = calculateTotalCaffeineAt(
    currentEvents,
    bedTime,
    halfLifeHours,
    drinkingDurationMinutes
  );
  const remainingAllowanceAtBed = Math.max(0, safeThresholdMg - existingAtBed);

  const hoursToBed = Math.max(0, (bedTime.getTime() - currentTime.getTime()) / (1000 * 60 * 60));
  if (hoursToBed <= 0) return 0;

  const alpha = getOralAbsorptionAlpha(halfLifeHours, drinkingDurationMinutes);
  const maxInitialMg = (remainingAllowanceAtBed / alpha) * Math.pow(2, hoursToBed / halfLifeHours);
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
  caffeinePerGram: number = 40,
  drinkingDurationMinutes: number = 10
): number {
  const maxMg = calculateMaxSafeCaffeineMg(
    currentEvents,
    currentTime,
    bedTime,
    halfLifeHours,
    safeThresholdMg,
    drinkingDurationMinutes
  );
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
  safeThresholdMg: number = 25,
  drinkingDurationMinutes: number = 10
): Date {
  const existingAtBed = calculateTotalCaffeineAt(
    currentEvents,
    bedTime,
    halfLifeHours,
    drinkingDurationMinutes
  );
  const allowedFromThisDose = Math.max(0.1, safeThresholdMg - existingAtBed);

  const alpha = getOralAbsorptionAlpha(halfLifeHours, drinkingDurationMinutes);
  const effectiveDose = alpha * doseMg;

  if (effectiveDose <= allowedFromThisDose) {
    return bedTime;
  }

  const requiredHours = halfLifeHours * (Math.log(effectiveDose / allowedFromThisDose) / Math.LN2);
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
  drinkingDurationMinutes: number = 10
): ChartDataPoint[] {
  const points: ChartDataPoint[] = [];
  const current = new Date(startTime.getTime());
  const endMs = endTime.getTime();

  while (current.getTime() <= endMs) {
    const caffeineMg = calculateTotalCaffeineAt(events, current, halfLifeHours, drinkingDurationMinutes);
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
  drinkingDurationMinutes: number = 10,
  targetDurationMinutes?: number
): SimulationSummary {
  // 就寝時残存量は就寝時点での厳密計算
  const bedCaffeineMg = calculateTotalCaffeineAt(events, bedTime, halfLifeHours, drinkingDurationMinutes);
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

  const hourlyPoints = generateSimulationPoints(events, graphStart, graphEnd, halfLifeHours, 15, drinkingDurationMinutes);
  const maxSafePowderGrams = calculateMaxSafePowderGrams(events, currentTime, bedTime, halfLifeHours, safeThresholdMg, 40, drinkingDurationMinutes);
  const maxSafeCaffeineMg = calculateMaxSafeCaffeineMg(events, currentTime, bedTime, halfLifeHours, safeThresholdMg, drinkingDurationMinutes);
  const effectiveTargetDuration = targetDurationMinutes !== undefined ? targetDurationMinutes : drinkingDurationMinutes;
  const deadlineForTarget = calculateDeadlineForDose(events, targetDoseMg, bedTime, halfLifeHours, safeThresholdMg, effectiveTargetDuration);

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
