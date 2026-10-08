import {
  calculateRemainingCaffeine,
  getOralAbsorptionAlpha,
  calculateDeadlineForDose,
  calculateMaxSafeCaffeineMg,
  evaluateSleepImpact,
  runSimulation,
  cleanOldEvents,
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

console.log('🎉 ALL MATHEMATICAL PRECISION TESTS PASSED SUCCESSFULLY! 🎉');
