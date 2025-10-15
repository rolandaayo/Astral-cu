const mongoose = require("mongoose");

module.exports = function ensureDbConnected(req, res, next) {
  const state = mongoose.connection.readyState; // 0: disconnected, 1: connected, 2: connecting, 3: disconnecting
  if (state === 1) return next();
  return res.status(503).json({
    message: "Database not connected",
    dbReadyState: state,
  });
};
