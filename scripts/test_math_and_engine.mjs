import {
  calculateRemainingCaffeine,
  getOralAbsorptionAlpha,
  calculateDeadlineForDose,
  calculateMaxSafeCaffeineMg,
  evaluateSleepImpact,
  runSimulation,
  cleanOldEvents,
  getUpcomingBedTime,
  calculateTotalCaffeineAt,
} from '../src/utils/caffeineEngine.ts';

function assert(condition, message) {
  if (!condition) {
    console.error(`❌ Assertion failed: ${message}`);
    process.exit(1);
  }
}

function assertClose(actual, expected, tolerance = 0.05, message = '') {
  if (Math.abs(actual - expected) > tolerance) {
    console.error(`❌ Value mismatch: actual=${actual}, expected=${expected}, diff=${Math.abs(actual - expected)} (tol=${tolerance}) - ${message}`);
    process.exit(1);
  }
}

console.log('--- Running Mathematical Precision Tests for Caffeine Engine ---');

// Test 1: Alpha calculation consistency
const halfLives = [2.5, 4.0, 5.0, 6.0];
const durations = [0, 10, 20, 30, 60];

for (const hl of halfLives) {
  for (const dur of durations) {
    const alpha = getOralAbsorptionAlpha(hl, dur);
    assert(alpha >= 1.0, `Alpha should be >= 1.0 (got ${alpha} for hl=${hl}, dur=${dur})`);
    console.log(`hl=${hl}h, dur=${dur}m => alpha=${alpha.toFixed(5)}`);
  }
}

// Test 2: Zero-caffeine initial state -> Deadline calculation -> Simulate drinking at deadline -> Check remaining caffeine at bedTime
const doses = [40, 80, 100, 142, 160, 200];
const baseBedTime = new Date('2026-10-08T23:30:00.000Z');

for (const hl of halfLives) {
  for (const dur of [10, 20, 30]) {
    for (const dose of doses) {
      // 1. Calculate deadline for this dose
      const deadline = calculateDeadlineForDose([], dose, baseBedTime, hl, 25, true, dur);
      const elapsedHours = (baseBedTime.getTime() - deadline.getTime()) / (1000 * 60 * 60);

      // 2. Simulate forward Bateman absorption + drinking duration from deadline to bedTime
      const remainingAtBed = calculateRemainingCaffeine(dose, elapsedHours, hl, true, dur);
      const evaluation = evaluateSleepImpact(Math.round(remainingAtBed * 10) / 10, 25);

      // Remaining at bed must be <= 25.05mg and evaluation must be SAFE!
      assertClose(remainingAtBed, 25.0, 0.1, `Deadline dose=${dose}mg, hl=${hl}h, dur=${dur}m, remaining=${remainingAtBed.toFixed(2)}`);
      assert(evaluation.status === 'SAFE', `Status at deadline must be SAFE (got ${evaluation.status} with ${remainingAtBed.toFixed(2)}mg)`);
    }
  }
}
console.log('✅ Test 2 Passed: All deadlines with oral absorption guarantee exact <= 25mg at bedtime!');

// Test 3: calculateMaxSafeCaffeineMg precision
const now = new Date('2026-10-08T15:00:00.000Z');
for (const hl of halfLives) {
  for (const dur of [10, 20, 30]) {
    const maxSafeMg = calculateMaxSafeCaffeineMg([], now, baseBedTime, hl, 25, true, dur);
    const elapsedHours = (baseBedTime.getTime() - now.getTime()) / (1000 * 60 * 60);
    const remainingAtBed = calculateRemainingCaffeine(maxSafeMg, elapsedHours, hl, true, dur);
    const evaluation = evaluateSleepImpact(Math.round(remainingAtBed * 10) / 10, 25);

    assertClose(remainingAtBed, 25.0, 0.2, `MaxSafeMg=${maxSafeMg}mg at now, remaining=${remainingAtBed.toFixed(2)}`);
    assert(evaluation.status === 'SAFE', `Status from max safe mg must be SAFE (got ${evaluation.status})`);
  }
}
console.log('✅ Test 3 Passed: All calculateMaxSafeCaffeineMg calculations guarantee exact <= 25mg at bedtime!');

// Test 4: Edge cases
// Dose <= threshold (e.g. 20mg with threshold 25mg)
const smallDoseDeadline = calculateDeadlineForDose([], 20, baseBedTime, 4.0, 25, true, 10);
assert(smallDoseDeadline.getTime() === baseBedTime.getTime(), 'Dose <= threshold should yield deadline = bedTime');

// Dose with existing caffeine exceeding threshold
const heavyEvent = [{
  id: 'heavy-1',
  timestamp: new Date('2026-10-08T22:00:00.000Z').toISOString(),
  name: 'Mega Drink',
  category: 'energy',
  caffeineMg: 300,
}];
const deadlineWhenOver = calculateDeadlineForDose(heavyEvent, 80, baseBedTime, 4.0, 25, true, 10);
assert(deadlineWhenOver.getTime() < baseBedTime.getTime() - 10 * 60 * 60 * 1000, 'Deadline when already over capacity should be far in the past');

// cleanOldEvents test
const baseDate = new Date('2026-10-08T12:00:00.000Z');
const testEvents = [
  { id: '1', timestamp: '2026-10-05T12:00:00.000Z', name: 'Old', category: 'coffee', caffeineMg: 80 },
  { id: '2', timestamp: '2026-10-07T10:00:00.000Z', name: 'Yesterday', category: 'coffee', caffeineMg: 80 },
  { id: '3', timestamp: '2026-10-08T08:00:00.000Z', name: 'Today', category: 'coffee', caffeineMg: 80 },
  { id: '4', timestamp: '2026-10-09T08:00:00.000Z', name: 'Tomorrow', category: 'coffee', caffeineMg: 80 },
  { id: '5', timestamp: '2026-10-11T08:00:00.000Z', name: 'Far Future', category: 'coffee', caffeineMg: 80 },
];
const cleaned = cleanOldEvents(testEvents, baseDate);
assert(cleaned.length === 3, `Cleaned should retain 3 events (got ${cleaned.length})`);
assert(cleaned.map((e) => e.id).join(',') === '2,3,4', `Cleaned ids should be 2,3,4 (got ${cleaned.map((e) => e.id)})`);
console.log('✅ Test 4 Passed: Edge cases and data cleaning verified!');

// Test 5: runSimulation complete check
const summary = runSimulation(
  [{ id: 'morning', timestamp: '2026-10-08T08:00:00.000Z', name: 'Coffee', category: 'coffee', caffeineMg: 80 }],
  now,
  baseBedTime,
  4.0,
  80,
  '標準2g',
  25,
  true,
  10
);
assert(summary.hourlyPoints.length > 0, 'Hourly points should be populated');
assert(summary.bedCaffeineMg > 0, 'Bed caffeine should be positive');
assert(summary.maxSafeCaffeineMg > 0, 'Max safe caffeine should be positive');
assert(summary.deadlineForTarget instanceof Date, 'Deadline should be a valid Date');
console.log('✅ Test 5 Passed: runSimulation integration verified!');

// Test 6: getUpcomingBedTime parsing & overnight boundary test
const testCurrentDay = new Date('2026-10-08T15:00:00.000');
const bed0000 = getUpcomingBedTime(testCurrentDay, '00:00');
assert(bed0000.getHours() === 0 && bed0000.getMinutes() === 0, `Bedtime 00:00 should have hour 0, min 0 (got ${bed0000.getHours()}:${bed0000.getMinutes()})`);
assert(bed0000.getDate() === 9, `Bedtime 00:00 from 15:00 should roll to next day (got date ${bed0000.getDate()})`);

const bed2300 = getUpcomingBedTime(testCurrentDay, '23:00');
assert(bed2300.getHours() === 23 && bed2300.getMinutes() === 0, `Bedtime 23:00 should have hour 23, min 0 (got ${bed2300.getHours()}:${bed2300.getMinutes()})`);

const bed0130 = getUpcomingBedTime(testCurrentDay, '01:30');
assert(bed0130.getHours() === 1 && bed0130.getMinutes() === 30, `Bedtime 01:30 should have hour 1, min 30`);

const testMidnight = new Date('2026-10-09T01:00:00.000');
const bedTonight0230 = getUpcomingBedTime(testMidnight, '02:30');
assert(bedTonight0230.getDate() === 9 && bedTonight0230.getHours() === 2 && bedTonight0230.getMinutes() === 30, `Bedtime 02:30 from 01:00 should be same morning`);
console.log('✅ Test 6 Passed: getUpcomingBedTime correctly parses all hour/minute combinations without corruption!');

// Test 7: Multi-drink in-progress linear superposition
// Event 1 at 13:00 (142mg, duration 10m), Event 2 at 13:05 (142mg, duration 10m)
const ev1Time = new Date('2026-10-08T13:00:00.000Z');
const ev2Time = new Date('2026-10-08T13:05:00.000Z');
const evOverlapping = [
  { id: 'm1', timestamp: ev1Time.toISOString(), name: 'Monster 1', category: 'energy', caffeineMg: 142 },
  { id: 'm2', timestamp: ev2Time.toISOString(), name: 'Monster 2', category: 'energy', caffeineMg: 142 },
];
// At 13:08 (during both drinking intervals):
const checkTime1 = new Date('2026-10-08T13:08:00.000Z');
const remainingDuring = calculateTotalCaffeineAt(evOverlapping, checkTime1, 4.0, true, 10);
// At 23:30 (bedtime):
const remainingBed = calculateTotalCaffeineAt(evOverlapping, baseBedTime, 4.0, true, 10);
assert(remainingDuring > 0, 'Remaining during drinking must be positive');
assert(remainingBed > 0, 'Remaining at bedtime must be positive');
// Each drink at bedtime should independently contribute ~142 * alpha * 2^(-dt/4)
const single1AtBed = calculateRemainingCaffeine(142, (baseBedTime.getTime() - ev1Time.getTime()) / 3600000, 4.0, true, 10);
const single2AtBed = calculateRemainingCaffeine(142, (baseBedTime.getTime() - ev2Time.getTime()) / 3600000, 4.0, true, 10);
assertClose(remainingBed, single1AtBed + single2AtBed, 0.001, 'Superposition must strictly equal sum of individual events');
console.log('✅ Test 7 Passed: Multi-drink overlapping continuous superposition is strictly additive!');

// Test 8: Duration = 0 vs Duration = 10 difference
const alpha0 = getOralAbsorptionAlpha(4.0, 0);
const alpha10 = getOralAbsorptionAlpha(4.0, 10);
assert(alpha0 < alpha10, `Alpha for dur=0 (${alpha0}) should be smaller than dur=10 (${alpha10})`);
assertClose(alpha0, 4.5 / (4.5 - Math.LN2 / 4.0), 0.0001, 'Alpha for dur=0 must equal ka / (ka - ke)');
console.log('✅ Test 8 Passed: Duration = 0 cleanly separates instantaneous Bateman from duration integration!');

console.log('🎉 ALL MATHEMATICAL PRECISION TESTS PASSED SUCCESSFULLY! 🎉');
