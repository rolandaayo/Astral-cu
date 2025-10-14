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
router.get("/users", getAllUsers); // No auth for admin access
router.get("/users/:userId", getUserById); // No auth for admin access
router.put("/users/:userId/balance", updateUserBalance); // No auth for admin access
router.delete("/users/:userId", deleteUser); // No auth for admin access

// Legacy routes (for old UserModel)
router.get("/", getLegacyUsers);
router.get("/getUser/:id", getLegacyUserById);
router.put("/updateUser/:id", updateLegacyUser);
router.delete("/deleteUser/:id", deleteLegacyUser);
router.post("/createUser", createLegacyUser);

module.exports = router;
