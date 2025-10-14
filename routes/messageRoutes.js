const express = require("express");
const router = express.Router();
const { authenticateToken } = require("../middleware/auth");
const {
  sendMessage,
  getConversation,
  getAllConversations,
  getUnreadCount,
} = require("../controllers/messageController");

// All message routes require authentication
router.use(authenticateToken);

// Send a message
router.post("/messages", sendMessage);

// Get conversation messages
router.get("/messages/conversation/:targetUserId?", getConversation);

// Get all conversations (admin only)
router.get("/messages/conversations", getAllConversations);

// Get unread message count
router.get("/messages/unread-count", getUnreadCount);

module.exports = router;
