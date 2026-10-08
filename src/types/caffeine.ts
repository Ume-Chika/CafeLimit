export type MetabolicSpeed = 'standard' | 'fast' | 'slow' | 'custom';

export interface MetabolicProfile {
  type: MetabolicSpeed;
  label: string;
  shortLabel: string;
  description: string;
  halfLifeHours: number;
}

export const METABOLIC_PROFILES: Record<MetabolicSpeed, MetabolicProfile> = {
  standard: {
    type: 'standard',
    label: '標準体質（成人平均）',
    shortLabel: '標準 (4.0h)',
    description: '半減期 約4.0時間（一般的な成人の代謝速度）',
    halfLifeHours: 4.0,
  },
  fast: {
    type: 'fast',
    label: '速い（喫煙者・高活性）',
    shortLabel: '速い (2.5h)',
    description: '半減期 約2.5時間（CYP1A2誘導・分解が早い）',
    halfLifeHours: 2.5,
  },
  slow: {
    type: 'slow',
    label: '遅い（敏感・低活性）',
    shortLabel: '遅い (6.0h)',
    description: '半減期 約6.0時間（カフェインが抜けにくい・ピル服用等）',
    halfLifeHours: 6.0,
  },
  custom: {
    type: 'custom',
    label: 'カスタム設定',
    shortLabel: 'カスタム',
    description: '任意の半減期（1.0〜12.0時間）を指定',
    halfLifeHours: 4.0,
  },
};

export type BeverageCategory = 'nescafe' | 'coffee' | 'energy' | 'tea' | 'soda' | 'custom';

export interface BeveragePreset {
  id: string;
  name: string;
  category: BeverageCategory;
  powderGrams?: number;
  caffeineMg: number;
  brand?: string;
  description?: string;
  waterMl?: number;
  volumeMl?: number;
  foamMl?: number;
  color?: string;
  isNescafeNative?: boolean;
  drinkingDurationMinutes?: number; // 個別飲用時間（分、10分〜1440分[24h]）
}

export interface IntakeEvent {
  id: string;
  timestamp: string; // ISO 8601 string
  name: string;
  category: BeverageCategory;
  powderGrams?: number;
  caffeineMg: number;
  presetId?: string;
  waterMl?: number;
  volumeMl?: number;
  foamMl?: number;
  drinkingDurationMinutes?: number; // 個別飲用時間（分、10分〜1440分[24h]）
}

export type SleepStatus = 'SAFE' | 'CAUTION' | 'WARNING';

export interface SleepEvaluation {
  status: SleepStatus;
  label: string;
  color: string;
  bgColor: string;
  borderColor: string;
  description: string;
}

export interface ChartDataPoint {
  time: Date;
  timeLabel: string;
  caffeineMg: number;
}

export interface SimulationSummary {
  bedTime: Date;
  bedCaffeineMg: number;
  evaluation: SleepEvaluation;
  totalDailyCaffeineMg: number;
  hourlyPoints: ChartDataPoint[];
  maxSafePowderGrams: number;
  maxSafeCaffeineMg: number;
  deadlineForTarget: Date;
  targetPresetName: string;
  safeSleepThresholdMg: number;
}

export type MaxIntakeDisplayUnit = 'powder' | 'caffeine' | 'preset';

export interface AppSettings {
  maxIntakeUnit: MaxIntakeDisplayUnit;
  deadlinePresetId: string;
  confirmBeforeAdd: boolean;
  customHalfLifeHours: number;
  safeSleepThresholdMg: number; // デフォルト 25mg
  showFocusZone?: boolean; // 日中の集中ゾーン表示（≥75mg、デフォルト false）
  drinkingDurationMinutes?: number; // 1杯を飲むのにかかるデフォルト時間（10〜60分、デフォルト10分）
  bodyWeightKg?: number; // 体重 (kg、デフォルト 60kg)
}
