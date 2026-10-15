const asyncHandler = require("express-async-handler");
const Investment = require("../models/Investment");
const InvestmentPlan = require("../models/InvestmentPlan");
const User = require("../models/userModel");
const Transaction = require("../models/transactionModel");
const Withdrawal = require("../models/withdrawalModel");
const { sendAdminNotificationEmail } = require("../utils/emailUtils");
const {
  sendUserNotificationEmail,
} = require("../services/sendUserNotificationEmail");
const { getScheduledPeriods, calculateAccrual } = require("../utils/investmentSchedule");
const processUserInvestments = require("../utils/processUserInvestments");


// const startInvestment = asyncHandler(async (req, res) => {
//   const { planName, amount } = req.body;
//   const userId = req.user._id;
//   const investmentAmount = parseFloat(amount);

//   if (isNaN(investmentAmount)) {
//     return res.status(400).json({ message: "Invalid investment amount." });
//   }

//   const user = await User.findById(userId);
//   if (!user || !user.isVerified) {
//     return res.status(403).json({ message: "User is not verified." });
//   }

//   if (user.balance < investmentAmount) {
//     return res.status(400).json({ message: "Insufficient balance." });
//   }

//   const plan = await InvestmentPlan.findOne({ name: planName });
//   if (!plan) {
//     return res.status(404).json({ message: "Investment plan not found." });
//   }

//   if (investmentAmount < plan.minAmount || investmentAmount > plan.maxAmount) {
//     return res.status(400).json({
//       message: `Amount must be between ${plan.minAmount} and ${plan.maxAmount} for the ${plan.name} plan.`,
//     });
//   }

//   const interestRate = plan.interestRate / 100;
//   const maturityAmount = parseFloat((investmentAmount * (1 + interestRate)).toFixed(2));
//   const endDate = new Date();
//   endDate.setDate(endDate.getDate() + plan.durationDays);

//   // endDate.setTime(endDate.getTime() + 60 * 1000);
//   // Add maturity amount to user's total maturity
//   // user.totalMaturityAmount = (user.totalMaturityAmount || 0) + maturityAmount;
//   // console.log("Updated totalMaturityAmount:", user.totalMaturityAmount);

//   const newInvestment = new Investment({
//     user: userId,
//     plan: plan.name,
//     amount: investmentAmount,
//     startDate: new Date(),
//     maturityAmount,
//     endDate,
//     status: "Pending",
//     adminApprovalConfirmation: "Pending",
//   });

//   await newInvestment.save();
//   await sendAdminNotificationEmail(
//     process.env.ADMIN_EMAIL,
//     user,
//     newInvestment
//   );

//   res.status(201).json({
//     message: `Investment of $${investmentAmount} in ${plan.name} is on hold pending admin approval.`,
//     investment: newInvestment,
//   });
// });


// const startInvestment = asyncHandler(async (req, res) => {
//   const { planName, amount } = req.body;
//   const userId = req.user._id;
//   const investmentAmount = parseFloat(amount);

//   if (isNaN(investmentAmount)) {
//     return res.status(400).json({ message: "Invalid investment amount." });
//   }

//   const user = await User.findById(userId);
//   if (!user || !user.isVerified) {
//     return res.status(403).json({ message: "User is not verified." });
//   }

//   if (user.balance < investmentAmount) {
//     return res.status(400).json({ message: "Insufficient balance." });
//   }

//   const plan = await InvestmentPlan.findOne({ name: planName });
//   if (!plan) {
//     return res.status(404).json({ message: "Investment plan not found." });
//   }

//   if (investmentAmount < plan.minAmount || investmentAmount > plan.maxAmount) {
//     return res.status(400).json({
//       message: `Amount must be between ${plan.minAmount} and ${plan.maxAmount} for the ${plan.name} plan.`,
//     });
//   }

//   // Adjusting interest rate based on the new range system
//   let interestRate;
//   if (investmentAmount >= 3500 && investmentAmount <= 10000) {
//     interestRate = 10;
//   } else if (investmentAmount >= 10000 && investmentAmount <= 20000) {
//     interestRate = 15;
//   } else if (investmentAmount >= 21000 && investmentAmount <= 40000) {
//     interestRate = 18;
//   } else if (investmentAmount >= 45000 && investmentAmount <= 100000) {
//     interestRate = 23;
//   } else {
//     return res.status(400).json({ message: "Invalid investment amount." });
//   }

//   const maturityAmount = parseFloat((investmentAmount * (1 + interestRate / 100)).toFixed(2));
//   const endDate = new Date();
//   endDate.setDate(endDate.getDate() + plan.durationDays);

//   const newInvestment = new Investment({
//     user: userId,
//     plan: plan.name,
//     amount: investmentAmount,
//     startDate: new Date(),
//     maturityAmount,
//     endDate,
//     status: "Pending",
//     adminApprovalConfirmation: "Pending",
//   });

//   await newInvestment.save();
//   await sendAdminNotificationEmail(
//     process.env.ADMIN_EMAIL,
//     user,
//     newInvestment
//   );

//   res.status(201).json({
//     message: `Investment of $${investmentAmount} in ${plan.name} is on hold pending admin approval.`,
//     investment: newInvestment,
//   });
// });


const startInvestment = asyncHandler(async (req, res) => {
  const { planName, amount } = req.body;
  const userId = req.user._id;
  const investmentAmount = parseFloat(amount);

  console.log("Received amount:", amount);
  console.log("Parsed investment amount:", investmentAmount);

  if (isNaN(investmentAmount)) {
    console.log("Error: Investment amount is not a number");
    return res.status(400).json({ message: "Invalid investment amount." });
  }

  const user = await User.findById(userId);
  if (!user || !user.isVerified) {
    return res.status(403).json({ message: "User is not verified." });
  }

  if (user.balance < investmentAmount) {
    return res.status(400).json({ message: "Insufficient balance." });
  }

  const plan = await InvestmentPlan.findOne({ name: planName });
  if (!plan) {
    return res.status(404).json({ message: "Investment plan not found." });
  }

  console.log("Plan details:", plan);

  if (investmentAmount < plan.minAmount || investmentAmount > plan.maxAmount) {
    console.log(`Error: Amount ${investmentAmount} is out of range for plan ${plan.name}`);
    return res.status(400).json({
      message: `Amount must be between ${plan.minAmount} and ${plan.maxAmount} for the ${plan.name} plan.`,
    });
  }

  if (!plan.accrualIntervalDays || !plan.durationDays || !plan.interestRate) {
    return res.status(400).json({ message: "The selected plan schedule is incomplete." });
  }

  const expectedProfit = Number(
    (
      investmentAmount *
      (plan.interestRate / 100) *
      getScheduledPeriods(plan.durationDays, plan.accrualIntervalDays)
    ).toFixed(2)
  );

  const newInvestment = new Investment({
    user: userId,
    plan: plan.name,
    amount: investmentAmount,
    maturityAmount: expectedProfit,
    durationDays: plan.durationDays,
    interestRate: plan.interestRate,
    accrualIntervalDays: plan.accrualIntervalDays,
    accruedPeriods: 0,
    accruedProfit: 0,
    scheduleVersion: 2,
    status: "Pending",
    adminApprovalConfirmation: "Pending",
  });

  await newInvestment.save();
  await sendAdminNotificationEmail(process.env.ADMIN_EMAIL, user, newInvestment);

  res.status(201).json({
    message: `Investment of $${investmentAmount} in ${plan.name} is on hold pending admin approval.`,
    investment: newInvestment,
  });
});





/**
 * @desc Approve an investment
 * @route PATCH /api/investments/:investmentId/approve
 * @access Admin
 */
// const approveInvestment = asyncHandler(async (req, res) => {
//   const { investmentId } = req.params;

//   const investment = await Investment.findById(investmentId).populate("user");
//   if (!investment) {
//     return res.status(404).json({ message: "Investment not found." });
//   }

//   if (investment.status !== "Pending") {
//     return res
//       .status(400)
//       .json({ message: "Investment is already processed." });
//   }

//   const user = investment.user;
//   investment.status = "Active";
//   investment.adminApprovalConfirmation = "approved";
//   investment.approvalDate = new Date();

//   user.balance -= investment.amount;
//   user.investmentBalance += investment.amount;

//   await user.save();
//   await investment.save();
//   await sendUserNotificationEmail(
//     user.email,
//     user.name,
//     investment,
//     "approved"
//   );

//   res.status(200).json({
//     message: `Investment ${investmentId} has been approved and added to the user's investment balance.`,
//     investment,
//   });
// });

const approveInvestment = asyncHandler(async (req, res) => {
  const { investmentId } = req.params;

  const investment = await Investment.findById(investmentId).populate("user");
  if (!investment) {
    return res.status(404).json({ message: "Investment not found." });
  }

  if (investment.status !== "Pending") {
    return res
      .status(400)
      .json({ message: "Investment is already processed." });
  }

  const user = investment.user;
  if (!user || user.balance < investment.amount) {
    return res.status(400).json({ message: "User no longer has enough balance to approve this investment." });
  }

  const plan = await InvestmentPlan.findOne({ name: investment.plan });
  const durationDays = investment.durationDays || plan?.durationDays;
  const interestRate = investment.interestRate ?? plan?.interestRate;
  const accrualIntervalDays = investment.accrualIntervalDays || plan?.accrualIntervalDays;
  if (!durationDays || interestRate == null || !accrualIntervalDays) {
    return res.status(400).json({ message: "The investment plan schedule is incomplete." });
  }

  investment.durationDays = durationDays;
  investment.interestRate = interestRate;
  investment.accrualIntervalDays = accrualIntervalDays;
  investment.scheduleVersion = 2;
  investment.accruedPeriods = 0;
  investment.accruedProfit = 0;
  investment.approvalDate = new Date();
  investment.startDate = investment.approvalDate;
  investment.endDate = new Date(
    investment.approvalDate.getTime() + durationDays * 24 * 60 * 60 * 1000
  );
  investment.maturityAmount = Number(
    (
      investment.amount *
      (interestRate / 100) *
      getScheduledPeriods(durationDays, accrualIntervalDays)
    ).toFixed(2)
  );
  investment.status = "Active";
  investment.adminApprovalConfirmation = "approved";

  user.balance -= investment.amount;
  user.investmentBalance += investment.amount;

  await user.save();
  await investment.save();

  // Notify user
  await sendUserNotificationEmail(
    user.email,
    user.name,
    investment,
    "approved"
  );

  res.status(200).json({
    message: `Investment ${investmentId} has been approved and added to the user's investment balance.`,
    investment,
  });
});



/**
 * @desc Reject an investment
 * @route PATCH /api/investments/:investmentId/reject
 * @access Admin
 */
const rejectInvestment = asyncHandler(async (req, res) => {
  const { investmentId } = req.params;

  const investment = await Investment.findById(investmentId).populate("user");
  if (!investment) {
    return res.status(404).json({ message: "Investment not found." });
  }

  if (investment.status !== "Pending") {
    return res
      .status(400)
      .json({ message: "Investment is already processed." });
  }

  investment.status = "Rejected";
  investment.adminApprovalConfirmation = "rejected";
  investment.rejectionDate = new Date();

  await investment.save();
  await sendUserNotificationEmail(
    investment.user.email,
    investment.user.name,
    investment,
    "rejected"
  );

  res.status(200).json({
    message: `Investment ${investmentId} has been rejected.`,
    investment,
  });
});

/**
 * @desc Get total investment amount for a user
 * @route GET /api/investments/total
 * @access Private
 */
const getTotalInvestmentAmount = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);
  if (!user) {
    return res.status(404).json({ message: "User not found." });
  }

  res
    .status(200)
    .json({ totalInvestmentAmount: user.totalInvestmentAmount || 0 });
});

/**
 * @desc Get user investment history
 * @route GET /api/investments/history
 * @access Private
 */
// const investmentHistory = asyncHandler(async (req, res) => {
//   const investments = await Investment.find({ user: req.user._id }).sort({
//     startDate: -1,
//   });
//   if (!investments.length) {
//     return res.status(404).json({ message: "No investments found." });
//   }

//   const investmentStatus = investments.map((investment) => ({
//     investmentId: investment._id,
//     plan: investment.plan,
//     amount: investment.amount,
//     startDate: investment.startDate,
//     endDate: investment.endDate,
//     maturityAmount: investment.maturityAmount,
//     status: investment.endDate > new Date() ? "Active" : "Ended",
//   }));

//   res.status(200).json({ investments: investmentStatus });
// });

const investmentHistory = asyncHandler(async (req, res) => {
  const investments = await Investment.find({ user: req.user._id }).sort({
    startDate: -1,
  });

  if (!investments.length) {
    return res.status(404).json({ message: "No investments found." });
  }

  const investmentStatus = investments.map((investment) => {
    let status;

    if (investment.status === "Pending") {
      status = "Pending";
    } else if (investment.status === "Active" && investment.endDate > new Date()) {
      status = "Active";
    } else if (investment.status === "Active" && investment.endDate <= new Date()) {
      status = "Ended";
    } else {
      status = investment.status; // Covers Rejected or any unexpected value.
    }

    return {
      investmentId: investment._id,
      plan: investment.plan,
      amount: investment.amount,
      startDate: investment.startDate,
      endDate: investment.endDate,
      maturityAmount: investment.maturityAmount,
      status,
    };
  });

  res.status(200).json({ investments: investmentStatus });
});



/**
 * @desc Check and deposit maturity amounts for ended investments
 * @route POST /api/investments/maturity
 * @access Private
 */
const checkAndDepositMaturityAmounts = asyncHandler(async (req, res) => {
  const result = await processUserInvestments(req.user._id);
  if (!result) {
    return res.status(404).json({ message: "User not found." });
  }

  res.status(200).json({
    message: "Investment accruals processed successfully.",
    userBalance: result.user.balance,
    totalMaturityAmount: result.user.totalMaturityAmount,
    newlyAccruedProfit: result.newlyAccruedProfit,
    principalReturned: result.principalReturned,
  });
});

const getWithdrawalEligibility = asyncHandler(async (req, res) => {
  const result = await processUserInvestments(req.user._id);
  if (!result) return res.status(404).json({ message: "User not found." });

  const activeEndDates = result.activeInvestments
    .map(({ endDate }) => endDate)
    .filter(Boolean)
    .sort((left, right) => left - right);

  res.status(200).json({
    canWithdraw: result.activeInvestments.length === 0,
    activeInvestmentCount: result.activeInvestments.length,
    nextMaturityDate: activeEndDates[0] || null,
    totalMaturityAmount: result.user.totalMaturityAmount,
  });
});

/**
 * @desc Get transaction history (transactions, investments, withdrawals)
 * @route GET /api/investments/transactions
 * @access Private
 */
const getTransactionHistory = asyncHandler(async (req, res) => {
  try {
    const userId = req.user._id;

    // Fetch all transactions, investments, and withdrawals for the user
    const transactions = await Transaction.find({ user: userId }).sort({
      createdAt: -1,
    });
    const investments = await Investment.find({ user: userId }).sort({
      startDate: -1,
    });
    const withdrawals = await Withdrawal.find({ user: userId }).sort({
      requestDate: -1,
    });

    // Combine the history with additional type annotations
    const combinedHistory = [
      ...transactions.map((item) => ({
        ...item.toObject(),
        type: "Transaction",
      })),
      ...investments.map((item) => ({
        ...item.toObject(),
        type: "Investment",
      })),
      ...withdrawals.map((item) => ({
        ...item.toObject(),
        type: "Withdrawal",
      })),
    ];

    // Sort all history entries by date, descending
    const sortedHistory = combinedHistory.sort((a, b) => {
      const dateA = new Date(a.createdAt || a.startDate || a.requestDate);
      const dateB = new Date(b.createdAt || b.startDate || b.requestDate);
      return dateB - dateA;
    });

    // Respond with the sorted transaction history
    res.status(200).json({
      success: true,
      message: "Transaction history fetched successfully.",
      history: sortedHistory,
    });
  } catch (error) {
    console.error("Error fetching transaction history:", error.message);
    res.status(500).json({
      success: false,
      message: "An error occurred while fetching the transaction history.",
    });
  }
});

const getInvestmentDetails = asyncHandler(async (req, res) => {
  const { investmentId } = req.params;

  const investment = await Investment.findById(investmentId).populate("user");
  if (!investment) {
    return res.status(404).json({ message: "Investment not found." });
  }

  res.status(200).json({
    message: "Investment details retrieved successfully.",
    investment,
  });
});


const adminPendingInvestment = asyncHandler(async (req, res) => {
  const pendingInvestments = await Investment.find({ status: "Pending" })
    .populate("user")
    .sort({ createdAt: -1 }); // Sort by creation date in descending order

  if (!pendingInvestments || pendingInvestments.length === 0) {
    return res.status(404).json({ message: "No pending investments found." });
  }

  res.status(200).json({
    message: "Pending investments retrieved successfully.",
    pendingInvestments,
  });
});


module.exports = {
  startInvestment,
  approveInvestment,
  rejectInvestment,
  getTotalInvestmentAmount,
  investmentHistory,
  checkAndDepositMaturityAmounts,
  getWithdrawalEligibility,
  getTransactionHistory,
  getInvestmentDetails,
  adminPendingInvestment
};
