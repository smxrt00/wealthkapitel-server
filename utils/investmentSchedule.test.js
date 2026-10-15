const test = require("node:test");
const assert = require("node:assert/strict");
const { DAY_MS, getScheduledPeriods, calculateAccrual } = require("./investmentSchedule");

test("Elite $30,000 accrues $4,500 at each completed 21-day interval", () => {
  const approvalDate = new Date("2026-01-01T00:00:00.000Z");
  const schedule = {
    amount: 30000,
    ratePercent: 15,
    durationDays: 365,
    accrualIntervalDays: 21,
    approvalDate,
  };

  assert.deepEqual(calculateAccrual({ ...schedule, now: approvalDate }), {
    accruedPeriods: 0,
    profit: 0,
    matured: false,
    endDate: new Date(approvalDate.getTime() + 365 * DAY_MS),
  });
  assert.equal(
    calculateAccrual({ ...schedule, now: new Date(approvalDate.getTime() + 21 * DAY_MS) }).profit,
    4500
  );
  assert.equal(
    calculateAccrual({ ...schedule, now: new Date(approvalDate.getTime() + 365 * DAY_MS) }).profit,
    76500
  );
});

test("monthly schedule counts only complete seven-day intervals", () => {
  assert.equal(getScheduledPeriods(30, 7), 4);
});

test("accrual is capped at the plan maturity date", () => {
  const approvalDate = new Date("2026-01-01T00:00:00.000Z");
  const result = calculateAccrual({
    amount: 30000,
    ratePercent: 15,
    durationDays: 365,
    accrualIntervalDays: 21,
    approvalDate,
    now: new Date(approvalDate.getTime() + 500 * DAY_MS),
  });

  assert.equal(result.accruedPeriods, 17);
  assert.equal(result.profit, 76500);
  assert.equal(result.matured, true);
});