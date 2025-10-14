const mongoose = require("mongoose");

const AuthUserSchema = new mongoose.Schema({
  name: String,
  email: String,
  phoneNumber: String,
  ssn: String,
  accountNumber: { type: String, unique: true }, // User's unique account number
  routingNumber: String, // Bank's routing number (same for all users)
  frontIdImage: String, // Cloudinary URL
  backIdImage: String, // Cloudinary URL
  password: String,
  balance: { type: Number, default: 0 },
  cryptoBalances: {
    dodge: { type: Number, default: 0 },
    eth: { type: Number, default: 0 },
    btc: { type: Number, default: 0 },
    spacex: { type: Number, default: 0 },
  },
  lastTopUp: { type: Date, default: null },
  isEmailVerified: { type: Boolean, default: false },
  verificationCode: { type: String, default: null },
  verificationCodeExpires: { type: Date, default: null },
});

const AuthUserModel = mongoose.model("authuser", AuthUserSchema);
module.exports = AuthUserModel;
