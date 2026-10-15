const DAY_MS = 24 * 60 * 60 * 1000;

const getScheduledPeriods = (durationDays, accrualIntervalDays) => {
  if (durationDays <= 0 || accrualIntervalDays <= 0) return 0;
  return Math.floor(durationDays / accrualIntervalDays);
};

const calculateAccrual = ({
  amount,
  ratePercent,
  durationDays,
  accrualIntervalDays,
  approvalDate,
  now = new Date(),
}) => {
  if (!approvalDate || !durationDays || !accrualIntervalDays) {
    return { accruedPeriods: 0, profit: 0, matured: false, endDate: null };
  }

  const approvedAt = new Date(approvalDate).getTime();
  const nowAt = new Date(now).getTime();
  if (!Number.isFinite(approvedAt) || !Number.isFinite(nowAt)) {
    return { accruedPeriods: 0, profit: 0, matured: false, endDate: null };
  }

  const endAt = approvedAt + durationDays * DAY_MS;
  const elapsedMs = Math.max(0, Math.min(nowAt, endAt) - approvedAt);
  const accruedPeriods = Math.min(
    Math.floor(elapsedMs / (accrualIntervalDays * DAY_MS)),
    getScheduledPeriods(durationDays, accrualIntervalDays)
  );
  const periodProfit = Number((amount * (ratePercent / 100)).toFixed(2));

  return {
    accruedPeriods,
    profit: Number((periodProfit * accruedPeriods).toFixed(2)),
    matured: nowAt >= endAt,
    endDate: new Date(endAt),
  };
};

module.exports = { DAY_MS, getScheduledPeriods, calculateAccrual };