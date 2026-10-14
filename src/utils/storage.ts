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

export function loadSettingsFromStorage(): AppSettings {
  try {
    const saved = localStorage.getItem(STORAGE_KEYS.SETTINGS);
    if (!saved) return { ...DEFAULT_SETTINGS };
    const parsed = JSON.parse(saved);
    return parsed && typeof parsed === 'object' ? { ...DEFAULT_SETTINGS, ...parsed } : { ...DEFAULT_SETTINGS };
  } catch {
    return { ...DEFAULT_SETTINGS };
  }
}

export function loadPresetsFromStorage(): BeveragePreset[] {
  try {
    const saved = localStorage.getItem(STORAGE_KEYS.PRESETS);
    if (!saved) return DEFAULT_NESCAFE_PRESETS;
    const parsed = JSON.parse(saved);
    return Array.isArray(parsed) && parsed.length > 0 ? parsed : DEFAULT_NESCAFE_PRESETS;
  } catch {
    return DEFAULT_NESCAFE_PRESETS;
  }
}

export function loadEventsFromStorage(baseDate: Date = new Date()): IntakeEvent[] {
  try {
    const saved = localStorage.getItem(STORAGE_KEYS.EVENTS);
    if (!saved) return createDefaultSampleEvents(baseDate);
    const parsed = JSON.parse(saved);
    return Array.isArray(parsed) ? cleanOldEvents(parsed, baseDate) : createDefaultSampleEvents(baseDate);
  } catch {
    return createDefaultSampleEvents(baseDate);
  }
}

export function loadBedTimeFromStorage(): string {
  return localStorage.getItem(STORAGE_KEYS.BEDTIME) || '23:30';
}

export function loadMetabolicSpeedFromStorage(): MetabolicSpeed {
  const saved = localStorage.getItem(STORAGE_KEYS.SPEED);
  return saved && saved in METABOLIC_PROFILES ? (saved as MetabolicSpeed) : 'standard';
}

export function clearAllCafeLimitStorage(): void {
  for (const key of Object.values(STORAGE_KEYS)) {
    localStorage.removeItem(key);
  }
}
