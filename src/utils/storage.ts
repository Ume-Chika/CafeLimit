import type { AppSettings, BeveragePreset, IntakeEvent, MetabolicSpeed } from '../types/caffeine';
import { METABOLIC_PROFILES } from '../types/caffeine';
import { DEFAULT_NESCAFE_PRESETS } from '../data/presets';
import { cleanOldEvents } from './caffeineEngine';

export const STORAGE_KEYS = {
  EVENTS: 'cafelimit_events_v4',
  PRESETS: 'cafelimit_presets_v4',
  BEDTIME: 'cafelimit_bedtime_v4',
  SPEED: 'cafelimit_speed_v4',
  SETTINGS: 'cafelimit_settings_v4',
} as const;

const LEGACY_KEYS = {
  EVENTS: ['cafelimit_events_v3', 'cafelimit_events_v2', 'cafelimit_events_v1', 'cafelimit_events'],
  PRESETS: ['cafelimit_presets_v3', 'cafelimit_presets_v2', 'cafelimit_presets_v1', 'cafelimit_presets'],
  BEDTIME: ['cafelimit_bedtime_v3', 'cafelimit_bedtime_v2', 'cafelimit_bedtime_v1', 'cafelimit_bedtime'],
  SPEED: ['cafelimit_speed_v3', 'cafelimit_speed_v2', 'cafelimit_speed_v1', 'cafelimit_speed'],
  SETTINGS: ['cafelimit_settings_v3', 'cafelimit_settings_v2', 'cafelimit_settings_v1', 'cafelimit_settings'],
} as const;

export const DEFAULT_SETTINGS: AppSettings = {
  maxIntakeUnit: 'powder',
  deadlinePresetId: 'nescafe-standard-2g',
  confirmBeforeAdd: true,
  customHalfLifeHours: 4.0,
  safeSleepThresholdMg: 25,
  showFocusZone: false,
  drinkingDurationMinutes: 10,
  bodyWeightKg: 60,
};

export interface StorageLike {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
}

function getDefaultStorage(): StorageLike | null {
  if (typeof window !== 'undefined' && window.localStorage) {
    return window.localStorage;
  }
  return null;
}

/**
 * 現行キーが存在しない場合、旧バージョンのキーを順次探索して自動マイグレーションする
 */
function readWithMigration(
  currentKey: string,
  legacyKeys: readonly string[],
  storage: StorageLike | null = getDefaultStorage()
): string | null {
  if (!storage) return null;

  const currentVal = storage.getItem(currentKey);
  if (currentVal !== null) {
    return currentVal;
  }

  for (const oldKey of legacyKeys) {
    const legacyVal = storage.getItem(oldKey);
    if (legacyVal !== null) {
      try {
        storage.setItem(currentKey, legacyVal);
        storage.removeItem(oldKey);
      } catch {
        // Storage quota or private mode errors are safely ignored
      }
      return legacyVal;
    }
  }

  return null;
}

/**
 * 設定オブジェクトの型・数値範囲サニタイズと不足フィールド補完
 */
export function sanitizeSettings(raw: unknown): AppSettings {
  if (!raw || typeof raw !== 'object') {
    return { ...DEFAULT_SETTINGS };
  }

  const obj = raw as Record<string, unknown>;

  const maxIntakeUnit =
    obj.maxIntakeUnit === 'powder' || obj.maxIntakeUnit === 'caffeine' || obj.maxIntakeUnit === 'preset'
      ? obj.maxIntakeUnit
      : DEFAULT_SETTINGS.maxIntakeUnit;

  const deadlinePresetId =
    typeof obj.deadlinePresetId === 'string' && obj.deadlinePresetId.trim().length > 0
      ? obj.deadlinePresetId
      : DEFAULT_SETTINGS.deadlinePresetId;

  const confirmBeforeAdd =
    typeof obj.confirmBeforeAdd === 'boolean' ? obj.confirmBeforeAdd : DEFAULT_SETTINGS.confirmBeforeAdd;

  const rawHalfLife = Number(obj.customHalfLifeHours);
  const customHalfLifeHours =
    Number.isFinite(rawHalfLife) && rawHalfLife >= 1.0 && rawHalfLife <= 12.0
      ? rawHalfLife
      : DEFAULT_SETTINGS.customHalfLifeHours;

  const rawSafeTh = Number(obj.safeSleepThresholdMg);
  const safeSleepThresholdMg =
    Number.isFinite(rawSafeTh) && rawSafeTh >= 5 && rawSafeTh <= 200
      ? rawSafeTh
      : DEFAULT_SETTINGS.safeSleepThresholdMg;

  const showFocusZone =
    typeof obj.showFocusZone === 'boolean' ? obj.showFocusZone : Boolean(DEFAULT_SETTINGS.showFocusZone);

  const rawDuration = Number(obj.drinkingDurationMinutes);
  const drinkingDurationMinutes =
    Number.isFinite(rawDuration) && rawDuration >= 1 && rawDuration <= 1440
      ? Math.round(rawDuration)
      : DEFAULT_SETTINGS.drinkingDurationMinutes;

  const rawWeight = Number(obj.bodyWeightKg);
  const bodyWeightKg =
    Number.isFinite(rawWeight) && rawWeight >= 30 && rawWeight <= 150
      ? Math.round(rawWeight)
      : DEFAULT_SETTINGS.bodyWeightKg;

  return {
    maxIntakeUnit,
    deadlinePresetId,
    confirmBeforeAdd,
    customHalfLifeHours,
    safeSleepThresholdMg,
    showFocusZone,
    drinkingDurationMinutes,
    bodyWeightKg,
  };
}

export function loadSettingsFromStorage(storage: StorageLike | null = getDefaultStorage()): AppSettings {
  const saved = readWithMigration(STORAGE_KEYS.SETTINGS, LEGACY_KEYS.SETTINGS, storage);
  if (!saved) return { ...DEFAULT_SETTINGS };

  try {
    return sanitizeSettings(JSON.parse(saved));
  } catch {
    return { ...DEFAULT_SETTINGS };
  }
}

export function loadPresetsFromStorage(storage: StorageLike | null = getDefaultStorage()): BeveragePreset[] {
  const saved = readWithMigration(STORAGE_KEYS.PRESETS, LEGACY_KEYS.PRESETS, storage);
  if (!saved) return DEFAULT_NESCAFE_PRESETS;

  try {
    const parsed = JSON.parse(saved);
    if (!Array.isArray(parsed) || parsed.length === 0) {
      return DEFAULT_NESCAFE_PRESETS;
    }
    const valid = parsed.filter(
      (item): item is BeveragePreset =>
        Boolean(item) &&
        typeof item === 'object' &&
        typeof item.id === 'string' &&
        typeof item.name === 'string' &&
        typeof item.caffeineMg === 'number' &&
        Number.isFinite(item.caffeineMg) &&
        item.caffeineMg >= 0
    );
    return valid.length > 0 ? valid : DEFAULT_NESCAFE_PRESETS;
  } catch {
    return DEFAULT_NESCAFE_PRESETS;
  }
}

export function createDefaultSampleEvents(baseDate: Date = new Date()): IntakeEvent[] {
  const sampleDate = new Date(baseDate);
  sampleDate.setHours(8, 0, 0, 0);
  return [
    {
      id: 'sample-morning',
      timestamp: sampleDate.toISOString(),
      name: 'ネスカフェ (2.0g)',
      category: 'nescafe',
      powderGrams: 2.0,
      caffeineMg: 80,
    },
  ];
}

export function loadEventsFromStorage(
  baseDate: Date = new Date(),
  storage: StorageLike | null = getDefaultStorage()
): IntakeEvent[] {
  const saved = readWithMigration(STORAGE_KEYS.EVENTS, LEGACY_KEYS.EVENTS, storage);
  if (!saved) return createDefaultSampleEvents(baseDate);

  try {
    const parsed = JSON.parse(saved);
    if (!Array.isArray(parsed)) {
      return createDefaultSampleEvents(baseDate);
    }
    const valid = parsed.filter(
      (ev): ev is IntakeEvent =>
        Boolean(ev) &&
        typeof ev === 'object' &&
        typeof ev.id === 'string' &&
        typeof ev.timestamp === 'string' &&
        !isNaN(new Date(ev.timestamp).getTime()) &&
        typeof ev.name === 'string' &&
        typeof ev.caffeineMg === 'number' &&
        Number.isFinite(ev.caffeineMg) &&
        ev.caffeineMg >= 0
    );
    return cleanOldEvents(valid, baseDate);
  } catch {
    return createDefaultSampleEvents(baseDate);
  }
}

export function loadBedTimeFromStorage(storage: StorageLike | null = getDefaultStorage()): string {
  const saved = readWithMigration(STORAGE_KEYS.BEDTIME, LEGACY_KEYS.BEDTIME, storage);
  if (saved && /^\d{2}:\d{2}$/.test(saved)) {
    return saved;
  }
  return '23:30';
}

export function loadMetabolicSpeedFromStorage(
  storage: StorageLike | null = getDefaultStorage()
): MetabolicSpeed {
  const saved = readWithMigration(STORAGE_KEYS.SPEED, LEGACY_KEYS.SPEED, storage);
  if (saved && saved in METABOLIC_PROFILES) {
    return saved as MetabolicSpeed;
  }
  return 'standard';
}

export function clearAllCafeLimitStorage(storage: StorageLike | null = getDefaultStorage()): void {
  if (!storage) return;
  for (const key of Object.values(STORAGE_KEYS)) {
    storage.removeItem(key);
  }
  for (const group of Object.values(LEGACY_KEYS)) {
    for (const oldKey of group) {
      storage.removeItem(oldKey);
    }
  }
}
