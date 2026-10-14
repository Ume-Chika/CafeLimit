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
import { BEVERAGE_TYPE_GROUPS } from '../src/data/presets.ts';
import type { IntakeEvent } from '../src/types/caffeine.ts';

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
    const halfLives = [2.5, 4.0, 6.0];
    const durations = [1, 10, 30, 60, 180, 720]; // 1分〜12時間（研究室での長時間飲用ユースケースを含む）
    const doses = [80, 150, 200];
    const thresholds = [15, 25, 35];

    for (const hl of halfLives) {
      for (const dur of durations) {
        for (const dose of doses) {
          for (const th of thresholds) {
            const deadline = calculateDeadlineForDose([], dose, bedTime, hl, th, dur);
            const elapsedAtBedHours = (bedTime.getTime() - deadline.getTime()) / (1000 * 60 * 60);
            const testEvent: IntakeEvent = {
              id: 'test-ev',
              timestamp: deadline.toISOString(),
              name: 'HYPER ZONe (400ml)',
              category: 'energy',
              caffeineMg: dose,
              drinkingDurationMinutes: dur,
            };
            const remainingAtBed = calculateTotalCaffeineAt([testEvent], bedTime, hl, dur);

            // 飲み終わり＋吸収完了後 (elapsed >= dur/60 + 1.5h) に就寝を迎えるケースでは漸近逆算値と厳密一致、
            // 12時間かけて少量(80mg)を飲む等で飲み終わり直後または最高到達濃度自体が閾値未満のケースでは安全側(<= th)に収まること
            if (elapsedAtBedHours >= dur / 60 + 1.5) {
              assert.ok(
                Math.abs(remainingAtBed - th) < 0.05,
                `不一致: hl=${hl}, dur=${dur}, dose=${dose}, th=${th} => remaining=${remainingAtBed}`
              );
            } else {
              assert.ok(
                remainingAtBed <= th + 0.05,
                `閾値超過: hl=${hl}, dur=${dur}, dose=${dose}, th=${th} => remaining=${remainingAtBed}`
              );
            }
          }
        }
      }
    }
  });

  it('往復整合性②: calculateMaxSafeCaffeineMg で逆算した最大許容量を現在時刻に摂取したとき、12時間チビチビ飲みを含め bedTime 時点の残存量が safeThresholdMg と厳密に一致すること', () => {
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
      for (const dur of [10, 30, 60, 720, 1440]) {
        const maxMg = calculateMaxSafeCaffeineMg([existingEvent], currentTime, bedTime, hl, 25, dur);
        assert.ok(maxMg > 0);
        const nowEvent: IntakeEvent = {
          id: 'now-drink',
          timestamp: currentTime.toISOString(),
          name: 'Lab All-Day Coffee',
          category: 'coffee',
          caffeineMg: maxMg,
          drinkingDurationMinutes: dur,
        };
        const totalAtBed = calculateTotalCaffeineAt([existingEvent, nowEvent], bedTime, hl, dur);
        assert.ok(Math.abs(totalAtBed - 25) <= 0.1, `hl=${hl}, dur=${dur} => totalAtBed=${totalAtBed}`);
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
    const deadline = calculateDeadlineForDose([heavyEvent], 80, bedTime, 1.0, 25, 10);
    assert.equal(deadline.getTime(), 0);
  });

  it('睡眠安全性バッジ判定と時間フォーマット関数（最大24時間=1440分対応）が正確に動作すること', () => {
    assert.equal(evaluateSleepImpact(25, 25).status, 'SAFE');
    assert.equal(evaluateSleepImpact(25.1, 25).status, 'CAUTION');
    assert.equal(evaluateSleepImpact(50, 25).status, 'WARNING');

    assert.equal(minutesToTimeString(10), '00:10');
    assert.equal(minutesToTimeString(720), '12:00');
    assert.equal(timeStringToMinutes('12:00'), 720);
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
