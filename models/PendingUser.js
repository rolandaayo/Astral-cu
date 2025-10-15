const mongoose = require("mongoose");

const PendingUserSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true, index: true },
  phoneNumber: { type: String, required: true },
  ssn: { type: String, required: true },
  frontIdImage: { type: String, required: true },
  backIdImage: { type: String, required: true },
  password: { type: String, required: true }, // already hashed
  verificationCode: { type: String, required: true },
  verificationCodeExpires: { type: Date, required: true },
  createdAt: { type: Date, default: Date.now },
});

const PendingUserModel = mongoose.model("pendinguser", PendingUserSchema);
module.exports = PendingUserModel;
