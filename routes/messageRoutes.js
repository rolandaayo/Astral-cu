const express = require("express");
const router = express.Router();
const { authenticateToken } = require("../middleware/auth");
const {
  sendMessage,
  getConversation,
  getAllConversations,
  getUnreadCount,
} = require("../controllers/messageController");

// User routes (with authentication)
router.post("/messages", authenticateToken, sendMessage);
router.get("/messages/conversation", authenticateToken, getConversation);
router.get("/messages/unread-count", authenticateToken, getUnreadCount);

// Admin routes (no authentication)
router.post("/admin/messages", sendMessage);
router.get("/admin/messages/conversation/:targetUserId", getConversation);
router.get("/admin/messages/conversations", getAllConversations);

module.exports = router;
