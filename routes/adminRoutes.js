const express = require("express");
const router = express.Router();
const {
  triggerTopUp,
  getTopUpStatus,
  getTopUpDetails,
} = require("../controllers/adminController");

// Admin routes
router.post("/admin/topup", triggerTopUp);
router.get("/admin/topup-status", getTopUpStatus);
router.get("/admin/topup-details", getTopUpDetails);

module.exports = router;
