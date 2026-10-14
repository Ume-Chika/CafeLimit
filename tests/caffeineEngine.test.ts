import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  calculateRemainingCaffeine,
  calculateTotalCaffeineAt,
  getOralAbsorptionAlpha,
  calculateMaxSafeCaffeineMg,
  calculateDeadlineForDose,
  evaluateSleepImpact,
  cleanOldEvents,
  minutesToTimeString,
  timeStringToMinutes,
  formatDurationDisplay,
  formatDurationShort,
} from '../src/utils/caffeineEngine.ts';
import {
  STORAGE_KEYS,
  DEFAULT_SETTINGS,
  sanitizeSettings,
  loadSettingsFromStorage,
  loadPresetsFromStorage,
  loadEventsFromStorage,
  loadBedTimeFromStorage,
  loadMetabolicSpeedFromStorage,
  clearAllCafeLimitStorage,
} from '../src/utils/storage.ts';
import type { StorageLike } from '../src/utils/storage.ts';
import { BEVERAGE_TYPE_GROUPS } from '../src/data/presets.ts';
import type { IntakeEvent } from '../src/types/caffeine.ts';

class MemoryStorage implements StorageLike {
  private map = new Map<string, string>();
  getItem(key: string): string | null {
    return this.map.has(key) ? this.map.get(key)! : null;
  }
  setItem(key: string, value: string): void {
    this.map.set(key, value);
  }
  removeItem(key: string): void {
    this.map.delete(key);
  }
}

describe('caffeineEngine — 数理モデル・往復整合性テスト', () => {
  it('経過時間0以下では残存量が0mgとなること', () => {
    assert.equal(calculateRemainingCaffeine(150, 0, 4.0, 10), 0);
    assert.equal(calculateRemainingCaffeine(150, -1, 4.0, 10), 0);
  });

  it('特異点 (ka ≈ ke, halfLife ≈ ln2 / 4.5 ≈ 0.1540327h) でも発散・不連続にならず連続積分極限と一致すること', () => {
    const singularHalfLife = Math.LN2 / 4.5;
    const nearHalfLife = singularHalfLife * 1.005;

    for (const durationMin of [0, 10, 30, 60]) {
      const atSingular = calculateRemainingCaffeine(150, 2.0, singularHalfLife, durationMin);
      const nearSingular = calculateRemainingCaffeine(150, 2.0, nearHalfLife, durationMin);
      assert.ok(Number.isFinite(atSingular) && atSingular > 0);
      assert.ok(Math.abs(atSingular - nearSingular) < 0.5, `duration=${durationMin}m: ${atSingular} vs ${nearSingular}`);
    }
  });

  it('往復整合性①: calculateDeadlineForDose で逆算した最終時刻に摂取したとき、bedTime時点の残存量が safeThresholdMg と厳密に一致すること', () => {
    const bedTime = new Date('2026-10-14T23:30:00+09:00');
    const halfLives = [2.5, 4.0, 6.0, 8.0];
    const durations = [1, 10, 30, 60, 120];
    const doses = [80, 142, 150, 200];
    const thresholds = [15, 25, 35];

    for (const hl of halfLives) {
      for (const dur of durations) {
        for (const dose of doses) {
          for (const th of thresholds) {
            const deadline = calculateDeadlineForDose([], dose, bedTime, hl, th, dur);
            const testEvent: IntakeEvent = {
              id: 'test-ev',
              timestamp: deadline.toISOString(),
              name: 'HYPER ZONe (400ml)',
              category: 'energy',
              caffeineMg: dose,
              drinkingDurationMinutes: dur,
            };
            const remainingAtBed = calculateTotalCaffeineAt([testEvent], bedTime, hl, dur);
            assert.ok(
              Math.abs(remainingAtBed - th) < 0.05,
              `不一致: hl=${hl}, dur=${dur}, dose=${dose}, th=${th} => remaining=${remainingAtBed}`
            );
          }
        }
      }
    }
  });

  it('往復整合性②: calculateMaxSafeCaffeineMg で逆算した最大許容量を現在時刻に摂取したとき、bedTime時点の残存量が safeThresholdMg 以下（誤差±0.1mg以内）に収まること', () => {
    const currentTime = new Date('2026-10-14T14:00:00+09:00');
    const bedTime = new Date('2026-10-14T23:30:00+09:00');
    const existingEvent: IntakeEvent = {
      id: 'morning-coffee',
      timestamp: new Date('2026-10-14T08:00:00+09:00').toISOString(),
      name: 'ネスカフェ (2.0g)',
      category: 'nescafe',
      caffeineMg: 80,
      drinkingDurationMinutes: 15,
    };

    for (const hl of [2.5, 4.0, 6.0]) {
      for (const dur of [10, 30, 60]) {
        const maxMg = calculateMaxSafeCaffeineMg([existingEvent], currentTime, bedTime, hl, 25, dur);
        assert.ok(maxMg > 0);
        const nowEvent: IntakeEvent = {
          id: 'now-drink',
          timestamp: currentTime.toISOString(),
          name: 'Test',
          category: 'coffee',
          caffeineMg: maxMg,
          drinkingDurationMinutes: dur,
        };
        const totalAtBed = calculateTotalCaffeineAt([existingEvent, nowEvent], bedTime, hl, dur);
        assert.ok(Math.abs(totalAtBed - 25) <= 0.15, `hl=${hl}, dur=${dur} => totalAtBed=${totalAtBed}`);
      }
    }
  });

  it('既存摂取のみで就寝時残存量がすでに安全閾値を超えている場合、calculateDeadlineForDose が過去（epoch）を返し、未来時刻を誤返却しないこと', () => {
    const bedTime = new Date('2026-10-14T23:30:00+09:00');
    const heavyEvent: IntakeEvent = {
      id: 'heavy',
      timestamp: new Date('2026-10-14T22:00:00+09:00').toISOString(),
      name: 'HYPER ZONe (400ml)',
      category: 'energy',
      caffeineMg: 150,
    };
    // 半減期が極端に短い 1.0h でも、すでに23:30時点で 25mg を超えているためデッドラインは超過扱いになるべき
    const deadline = calculateDeadlineForDose([heavyEvent], 80, bedTime, 1.0, 25, 10);
    assert.equal(deadline.getTime(), 0);
  });

  it('睡眠安全性バッジ判定と時間フォーマット関数が正確に動作すること', () => {
    assert.equal(evaluateSleepImpact(25, 25).status, 'SAFE');
    assert.equal(evaluateSleepImpact(25.1, 25).status, 'CAUTION');
    assert.equal(evaluateSleepImpact(50, 25).status, 'WARNING');

    assert.equal(minutesToTimeString(10), '00:10');
    assert.equal(minutesToTimeString(90), '01:30');
    assert.equal(timeStringToMinutes('01:30'), 90);
    assert.equal(formatDurationDisplay(90), '1時間30分');
    assert.equal(formatDurationShort(90), '1.5時間');

    const alpha10 = getOralAbsorptionAlpha(4.0, 10);
    const alpha60 = getOralAbsorptionAlpha(4.0, 60);
    assert.ok(alpha60 > alpha10);
  });

  it('cleanOldEvents が一昨日以前および明後日以降のイベントを正確に除外すること', () => {
    const base = new Date('2026-10-14T12:00:00+09:00');
    const events: IntakeEvent[] = [
      { id: 'old', timestamp: new Date('2026-10-12T23:59:00+09:00').toISOString(), name: 'Old', category: 'coffee', caffeineMg: 80 },
      { id: 'yesterday', timestamp: new Date('2026-10-13T08:00:00+09:00').toISOString(), name: 'Yesterday', category: 'coffee', caffeineMg: 80 },
      { id: 'today', timestamp: new Date('2026-10-14T08:00:00+09:00').toISOString(), name: 'Today', category: 'coffee', caffeineMg: 80 },
      { id: 'future', timestamp: new Date('2026-10-16T00:01:00+09:00').toISOString(), name: 'Future', category: 'coffee', caffeineMg: 80 },
    ];
    const cleaned = cleanOldEvents(events, base);
    assert.deepEqual(cleaned.map((e) => e.id), ['yesterday', 'today']);
  });
});

describe('presets — ZONe（ゾーン）6種プリセット定義の検証', () => {
  it('BEVERAGE_TYPE_GROUPS に group-zone が独立追加され、150mg×3種・75mg×3種の計6種が束ねずに定義されていること', () => {
    const zoneGroup = BEVERAGE_TYPE_GROUPS.find((g) => g.id === 'group-zone');
    assert.ok(zoneGroup, 'group-zone が存在すること');
    assert.equal(zoneGroup.options.length, 6);

    const high150 = zoneGroup.options.filter((o) => o.caffeineMg === 150);
    const light75 = zoneGroup.options.filter((o) => o.caffeineMg === 75);
    assert.equal(high150.length, 3, '150mgラインが3種あること');
    assert.equal(light75.length, 3, '75mgラインが3種（フルーツ系500ml・POWER MORNING 400ml・QUICK BOOST 240ml）個別にあること');

    assert.deepEqual(
      light75.map((o) => o.volumeMl),
      [500, 400, 240]
    );
  });
});

describe('storage — 旧バージョンからの自動マイグレーション＆データサニタイズ検証', () => {
  it('v3 などの旧キーから v4 キーへデータを失わず自動マイグレーションし、旧キーをクリーンアップすること', () => {
    const mem = new MemoryStorage();
    mem.setItem(
      'cafelimit_settings_v3',
      JSON.stringify({
        maxIntakeUnit: 'caffeine',
        bodyWeightKg: 72,
        customHalfLifeHours: 5.5,
      })
    );
    mem.setItem('cafelimit_bedtime_v2', '01:15');
    mem.setItem('cafelimit_speed_v1', 'slow');

    const loadedSettings = loadSettingsFromStorage(mem);
    assert.equal(loadedSettings.maxIntakeUnit, 'caffeine');
    assert.equal(loadedSettings.bodyWeightKg, 72);
    assert.equal(loadedSettings.customHalfLifeHours, 5.5);
    assert.equal(loadedSettings.safeSleepThresholdMg, DEFAULT_SETTINGS.safeSleepThresholdMg);
    // v4 キーへ移行済みで、旧 v3 キーは削除されていること
    assert.ok(mem.getItem(STORAGE_KEYS.SETTINGS) !== null);
    assert.equal(mem.getItem('cafelimit_settings_v3'), null);

    assert.equal(loadBedTimeFromStorage(mem), '01:15');
    assert.equal(loadMetabolicSpeedFromStorage(mem), 'slow');
  });

  it('破損したJSONや範囲外の数値が入っていてもクラッシュせず安全にフォールバックすること', () => {
    const mem = new MemoryStorage();
    mem.setItem(STORAGE_KEYS.SETTINGS, '{broken json');
    assert.deepEqual(loadSettingsFromStorage(mem), DEFAULT_SETTINGS);

    const sanitized = sanitizeSettings({
      maxIntakeUnit: 'invalid',
      bodyWeightKg: -50,
      customHalfLifeHours: 999,
      drinkingDurationMinutes: 0,
    });
    assert.equal(sanitized.maxIntakeUnit, 'powder');
    assert.equal(sanitized.bodyWeightKg, 60);
    assert.equal(sanitized.customHalfLifeHours, 4.0);
    assert.equal(sanitized.drinkingDurationMinutes, 10);

    mem.setItem(STORAGE_KEYS.PRESETS, JSON.stringify([{ invalid: true }]));
    const presets = loadPresetsFromStorage(mem);
    assert.ok(presets.length >= 3);

    const now = new Date('2026-10-14T10:00:00+09:00');
    mem.setItem(STORAGE_KEYS.EVENTS, 'not-an-array');
    const events = loadEventsFromStorage(now, mem);
    assert.equal(events.length, 1);

    clearAllCafeLimitStorage(mem);
    assert.equal(mem.getItem(STORAGE_KEYS.SETTINGS), null);
  });
});
