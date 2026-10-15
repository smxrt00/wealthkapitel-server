// models/InvestmentPlan.js
const mongoose = require("mongoose");

const investmentPlanSchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true },
  minAmount: { type: Number, required: true },
  maxAmount: { type: Number, required: true },
  durationDays: { type: Number, required: true }, 
  interestRate: { type: Number, required: true },
  accrualIntervalDays: { type: Number, required: true },
});


module.exports = mongoose.model("InvestmentPlan", investmentPlanSchema);
