const express = require("express");
const {
  registerUser,
  loginUser,
  logoutUser,
  getUser,
  updateUser,
  deleteUser,
  getUsers,
  loginStatus,
  upgradeUser,
  sendAutomatedEmail,
  sendVerificationEmail,
  verifyUser,
  forgotPassword,
  resetPassword,
  changePassword,
  sendLoginCode,
  loginWithCode,
  loginWithGoogle,
  getUserTransactions,
  getReferrals,
  updateDepositBalance,
  editDepositBalance,
  uploadKycDocuments,
  getPendingKycRequests,
  approveKycRequest,
  rejectKycRequest,
  toggleHasFees,
  adjustUserFees,
  upload
} = require("../controllers/userController");
const {
  protect,
  adminOnly,
  authorOnly,
  verifiedOnly,
  kycApprovedOnly,
} = require("../middleware/authMiddleware");
const router = express.Router();


const { impersonateUser, exitImpersonation } = require("../controllers/adminController");


router.post("/register", registerUser);
router.post("/login", loginUser);
router.get("/logout", logoutUser);
router.get("/getUser", protect, getUser);
// router.get("/getUser", protect, verifiedOnly, kycApprovedOnly, getUser);
router.patch("/updateUser", protect, updateUser);
router.delete("/:id", protect, adminOnly, deleteUser);
router.get("/getUsers", protect, authorOnly, getUsers);
router.get("/loginStatus", loginStatus);
router.post("/upgradeUser", protect, adminOnly, upgradeUser);
router.post("/sendAutomatedEmail", protect, sendAutomatedEmail);
router.post("/sendVerificationEmail", protect, sendVerificationEmail);
router.patch("/verifyUser/:verificationToken", verifyUser);
router.post("/forgotPassword", forgotPassword);
router.patch("/resetPassword/:resetToken", resetPassword);
router.patch("/changePassword", protect, changePassword);
router.post("/sendLoginCode/:email", sendLoginCode);
router.post("/loginWithCode/:email", loginWithCode);
router.get("/dashboard", protect, verifiedOnly, kycApprovedOnly, getUserTransactions);

router.get("/referrals", protect, getReferrals);
//For admin to be able to edit user investmentbalance 
router.put("/updateDepositBalance/:id", protect, authorOnly, updateDepositBalance);
router.put("/editDepositBalance/:id", protect, authorOnly, editDepositBalance);
router.post("/impersonate/:userId", protect, adminOnly, impersonateUser);
router.post("/exit-impersonation", protect, exitImpersonation);
router.put("/fees-toggle/:id", protect, adminOnly, toggleHasFees);
router.put("/update-fees/:id", protect, adminOnly, adjustUserFees);




router.post("/google/callback", loginWithGoogle);
router.post(
  "/uploadKycDocuments",
  protect,
  verifiedOnly,
  upload.fields([
    { name: "front", maxCount: 1 },
    { name: "back", maxCount: 1 },
  ]),
  uploadKycDocuments
);


router.get("/kyc/pending", protect, adminOnly,  getPendingKycRequests);

// Route to approve KYC
router.patch("/kyc/approve/:id", protect, adminOnly,  approveKycRequest);

// Route to reject KYC
router.patch("/kyc/reject/:id", protect, adminOnly,  rejectKycRequest);

module.exports = router;