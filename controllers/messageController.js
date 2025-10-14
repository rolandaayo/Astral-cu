const MessageModel = require("../models/Message");
const AuthUserModel = require("../models/AuthUser");
const mongoose = require("mongoose");

// Fixed ObjectId for admin (when no real admin user exists)
const ADMIN_OBJECT_ID = new mongoose.Types.ObjectId("000000000000000000000001");

// Send a message (from user to admin or admin to user)
const sendMessage = async (req, res) => {
  try {
    const { message, recipientId, senderId, isFromAdmin } = req.body;

    if (!message || message.trim().length === 0) {
      return res.status(400).json({ message: "Message cannot be empty" });
    }

    // For admin access without auth, use provided senderId and isFromAdmin
    let actualSenderId = senderId;
    let actualIsFromAdmin = isFromAdmin || false;
    let senderName = "Admin";
    let senderEmail = "admin@astral.com";

    // If we have auth (req.userId exists), use that instead
    if (req.userId) {
      actualSenderId = req.userId;
      const sender = await AuthUserModel.findById(req.userId);
      if (!sender) {
        return res.status(404).json({ message: "Sender not found" });
      }
      actualIsFromAdmin = sender.email === "admin@astral.com";
      senderName = sender.name;
      senderEmail = sender.email;
    } else if (actualIsFromAdmin && recipientId) {
      // Admin sending without auth - use fixed ObjectId
      actualSenderId = ADMIN_OBJECT_ID;
    } else if (!actualSenderId) {
      return res.status(400).json({ message: "Sender ID required" });
    }

    // Generate conversation ID
    let conversationId;
    if (actualIsFromAdmin && recipientId) {
      // Admin sending to user
      conversationId = `user_${recipientId}`;
    } else {
      // User sending to admin
      conversationId = `user_${actualSenderId}`;
    }

    const newMessage = await MessageModel.create({
      conversationId,
      senderId: actualSenderId,
      senderName,
      senderEmail,
      message: message.trim(),
      isFromAdmin: actualIsFromAdmin,
      isRead: false,
    });

    res.status(201).json({
      message: "Message sent successfully",
      data: newMessage,
    });
  } catch (error) {
    console.error("Send message error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// Get messages for a conversation
const getConversation = async (req, res) => {
  try {
    const { targetUserId } = req.params; // For admin viewing specific user's conversation

    let conversationId;
    let isAdmin = false;
    let userId = req.userId;

    // Check if we have authentication
    if (req.userId) {
      const user = await AuthUserModel.findById(req.userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      isAdmin = user.email === "admin@astral.com";
    } else {
      // No auth - assume admin access for now
      isAdmin = true;
      userId = ADMIN_OBJECT_ID;
    }
    if (isAdmin && targetUserId) {
      // Admin viewing specific user's conversation
      conversationId = `user_${targetUserId}`;
    } else {
      // User viewing their own conversation with admin
      conversationId = `user_${userId}`;
    }

    const messages = await MessageModel.find({ conversationId })
      .sort({ createdAt: 1 })
      .limit(100); // Limit to last 100 messages

    // Mark messages as read if user is viewing their own conversation
    if (!isAdmin || !targetUserId) {
      await MessageModel.updateMany(
        { conversationId, isFromAdmin: true, isRead: false },
        { isRead: true }
      );
    } else if (isAdmin) {
      // Mark user messages as read when admin views them
      await MessageModel.updateMany(
        { conversationId, isFromAdmin: false, isRead: false },
        { isRead: true }
      );
    }

    res.json({
      messages,
      conversationId,
    });
  } catch (error) {
    console.error("Get conversation error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// Get all conversations (admin only)
const getAllConversations = async (req, res) => {
  try {
    // Skip admin check for now - allow access without auth
    // const userId = req.userId;
    // const user = await AuthUserModel.findById(userId);
    // if (!user || user.email !== "admin@astral.com") {
    //   return res.status(403).json({ message: "Admin access required" });
    // }

    // Get all unique conversations with latest message
    const conversations = await MessageModel.aggregate([
      {
        $sort: { createdAt: -1 },
      },
      {
        $group: {
          _id: "$conversationId",
          latestMessage: { $first: "$$ROOT" },
          unreadCount: {
            $sum: {
              $cond: [
                {
                  $and: [
                    { $eq: ["$isFromAdmin", false] },
                    { $eq: ["$isRead", false] },
                  ],
                },
                1,
                0,
              ],
            },
          },
        },
      },
      {
        $sort: { "latestMessage.createdAt": -1 },
      },
    ]);

    // Get user details for each conversation
    const conversationsWithUserInfo = await Promise.all(
      conversations.map(async (conv) => {
        const userIdFromConv = conv._id.replace("user_", "");
        const userInfo = await AuthUserModel.findById(userIdFromConv, {
          name: 1,
          email: 1,
          accountNumber: 1,
        });

        return {
          conversationId: conv._id,
          userId: userIdFromConv,
          userInfo,
          latestMessage: conv.latestMessage,
          unreadCount: conv.unreadCount,
        };
      })
    );

    res.json({
      conversations: conversationsWithUserInfo.filter((conv) => conv.userInfo), // Filter out deleted users
    });
  } catch (error) {
    console.error("Get all conversations error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// Get unread message count for user
const getUnreadCount = async (req, res) => {
  try {
    const userId = req.userId;
    const conversationId = `user_${userId}`;

    const unreadCount = await MessageModel.countDocuments({
      conversationId,
      isFromAdmin: true,
      isRead: false,
    });

    res.json({ unreadCount });
  } catch (error) {
    console.error("Get unread count error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

module.exports = {
  sendMessage,
  getConversation,
  getAllConversations,
  getUnreadCount,
};
