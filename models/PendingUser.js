const mongoose = require("mongoose");

const pendingUserSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
  },
  phoneNumber: {
    type: String,
    required: true,
  },
  ssn: {
    type: String,
    required: true,
  },
  password: {
    type: String,
    required: true,
  },
  frontIdImage: {
    type: String,
    required: true,
  },
  backIdImage: {
    type: String,
    required: true,
  },
  verificationCode: {
    type: String,
    required: true,
  },
  verificationCodeExpires: {
    type: Date,
    required: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
    expires: 3600, // Document expires after 1 hour
  },
});

module.exports = mongoose.model("PendingUser", pendingUserSchema);
