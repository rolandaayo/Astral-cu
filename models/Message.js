const mongoose = require("mongoose");

const MessageSchema = new mongoose.Schema({
  conversationId: { type: String, required: true }, // Unique ID for each user's conversation with admin
  senderId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "authuser",
    required: true,
  },
  senderName: { type: String, required: true },
  senderEmail: { type: String, required: true },
  message: { type: String, required: true },
  isFromAdmin: { type: Boolean, default: false },
  isRead: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now },
});

// Index for efficient queries
MessageSchema.index({ conversationId: 1, createdAt: -1 });
MessageSchema.index({ isFromAdmin: 1, isRead: 1 });

const MessageModel = mongoose.model("message", MessageSchema);
module.exports = MessageModel;
