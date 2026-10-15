const mongoose = require("mongoose");
const Investment = require("../models/Investment");
const User = require("../models/userModel");
const { calculateAccrual } = require("./investmentSchedule");

const processUserInvestments = async (userId, now = new Date()) => {
  const session = await mongoose.startSession();
  let result;

  try {
    await session.withTransaction(async () => {
      const user = await User.findById(userId).session(session);
      if (!user) {
        result = null;
        return;
      }

      const investments = await Investment.find({
        user: userId,
        status: "Active",
      }).session(session);
      let userChanged = false;
      let newlyAccruedProfit = 0;
      let principalReturned = 0;

      for (const investment of investments) {
        if (investment.scheduleVersion === 2 && investment.approvalDate) {
          const accrual = calculateAccrual({
            amount: investment.amount,
            ratePercent: investment.interestRate,
            durationDays: investment.durationDays,
            accrualIntervalDays: investment.accrualIntervalDays,
            approvalDate: investment.approvalDate,
            now,
          });
          const profitDelta = Number(
            Math.max(0, accrual.profit - Number(investment.accruedProfit || 0)).toFixed(2)
          );

          if (profitDelta > 0) {
            user.totalMaturityAmount = Number(user.totalMaturityAmount || 0) + profitDelta;
            investment.accruedProfit = accrual.profit;
            newlyAccruedProfit += profitDelta;
            userChanged = true;
          }

          const periodsChanged = accrual.accruedPeriods !== investment.accruedPeriods;
          if (periodsChanged) {
            investment.accruedPeriods = accrual.accruedPeriods;
          }

          if (accrual.matured) {
            user.balance = Number(user.balance || 0) + investment.amount;
            user.investmentBalance = Math.max(
              0,
              Number(user.investmentBalance || 0) - investment.amount
            );
            investment.status = "Ended";
            principalReturned += investment.amount;
            userChanged = true;
          }

          if (profitDelta > 0 || accrual.matured || periodsChanged) {
            await investment.save({ session });
          }
        } else if (investment.endDate && now >= investment.endDate) {
          user.totalMaturityAmount =
            Number(user.totalMaturityAmount || 0) + Number(investment.maturityAmount || 0);
          user.investmentBalance = Math.max(
            0,
            Number(user.investmentBalance || 0) - Number(investment.amount || 0)
          );
          investment.status = "Ended";
          await investment.save({ session });
          userChanged = true;
        }
      }

      if (userChanged) await user.save({ session });

      result = {
        user,
        activeInvestments: investments.filter((investment) => investment.status === "Active"),
        newlyAccruedProfit,
        principalReturned,
      };
    });

    return result;
  } finally {
    await session.endSession();
  }
};

module.exports = processUserInvestments;