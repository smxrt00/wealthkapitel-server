const mongoose = require("mongoose");
const InvestmentPlan = require("../models/InvestmentPlan");

const seedPlans = async () => {
  const plans = [
    {
      name: "Basic Plan",
      minAmount: 100,
      maxAmount: 1000,
      durationDays: 7,
      interestRate: 2,
      accrualIntervalDays: 1,
    },
    {
      name: "Standard Plan",
      minAmount: 1100,
      maxAmount: 5000,
      durationDays: 30,
      interestRate: 5,
      accrualIntervalDays: 7,
    },
    {
      name: "Premium Plan",
      minAmount: 6000,
      maxAmount: 20000,
      durationDays: 90,
      interestRate: 10,
      accrualIntervalDays: 14,
    },
    {
      name: "Elite Plan",
      minAmount: 25000,
      maxAmount: 100000,
      durationDays: 365,
      interestRate: 15,
      accrualIntervalDays: 21,
    },
  ];

  try {
    for (const plan of plans) {
      await InvestmentPlan.findOneAndUpdate(
        { name: plan.name },
        { $set: plan },
        { upsert: true, new: true, runValidators: true }
      );
      console.log(`Seeded plan: ${plan.name}`);
    }
    console.log("Investment plans seeded successfully!");
  } catch (error) {
    console.error("Error seeding investment plans:", error);
    throw error;
  }
};

module.exports = seedPlans;
