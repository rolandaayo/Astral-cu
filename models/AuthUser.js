const mongoose = require("mongoose");

const AuthUserSchema = new mongoose.Schema({
  name: String,
  email: String,
  password: String,
  balance: { type: Number, default: 0 },
  cryptoBalances: {
    dodge: { type: Number, default: 0 },
    eth: { type: Number, default: 0 },
    btc: { type: Number, default: 0 },
    spacex: { type: Number, default: 0 },
  },
  lastTopUp: { type: Date, default: null },
});

const AuthUserModel = mongoose.model("authuser", AuthUserSchema);
module.exports = AuthUserModel;
