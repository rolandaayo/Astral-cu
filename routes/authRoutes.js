const express = require("express");
const router = express.Router();
const upload = require("../middleware/upload");
const {
  login,
  signup,
  sendVerification,
  verifyEmail,
  resendVerification,
} = require("../controllers/authController");

// Auth routes
router.post("/login", login);
router.post(
  "/signup",
  upload.fields([
    { name: "frontIdImage", maxCount: 1 },
    { name: "backIdImage", maxCount: 1 },
  ]),
  signup
);
router.post("/auth/send-verification", sendVerification);
router.post("/auth/verify-email", verifyEmail);
router.post("/auth/resend-verification", resendVerification);

module.exports = router;
