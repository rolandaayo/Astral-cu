const express = require("express");
const router = express.Router();
const { authenticateToken } = require("../middleware/auth");
const {
  getCurrentUser,
  getAllUsers,
  getUserById,
  updateUserBalance,
  deleteUser,
  getLegacyUsers,
  getLegacyUserById,
  updateLegacyUser,
  deleteLegacyUser,
  createLegacyUser,
} = require("../controllers/userController");

// Protected user routes
router.get("/users/me", authenticateToken, getCurrentUser);
router.get("/users", getAllUsers);
router.get("/users/:userId", getUserById);
router.put("/users/:userId/balance", updateUserBalance);
router.delete("/users/:userId", deleteUser);

// Legacy routes (for old UserModel)
router.get("/", getLegacyUsers);
router.get("/getUser/:id", getLegacyUserById);
router.put("/updateUser/:id", updateLegacyUser);
router.delete("/deleteUser/:id", deleteLegacyUser);
router.post("/createUser", createLegacyUser);

module.exports = router;
