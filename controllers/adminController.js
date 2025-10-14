const AuthUserModel = require("../models/AuthUser");

// Improved daily top-up with date tracking
const smartDailyTopUp = async () => {
  try {
    console.log("Running smart daily balance top-up...");

    const today = new Date();
    today.setHours(0, 0, 0, 0); // Set to start of day

    // Get users who haven't received top-up today
    const users = await AuthUserModel.find({
      $or: [{ lastTopUp: { $lt: today } }, { lastTopUp: null }],
    });

    let toppedUpCount = 0;

    for (const user of users) {
      // Generate random amount between $5-$10
      const randomAmount = Math.floor(Math.random() * 6) + 5; // 5, 6, 7, 8, 9, or 10

      // Add the amount to user's balance
      user.balance = (user.balance || 0) + randomAmount;
      user.lastTopUp = new Date();
      await user.save();

      console.log(
        `✅ Added $${randomAmount} to user ${
          user.email
        } (New balance: $${user.balance.toFixed(2)})`
      );
      toppedUpCount++;
    }

    console.log(`Smart daily top-up completed for ${toppedUpCount} users`);
    return { success: true, toppedUpCount, totalUsers: users.length };
  } catch (error) {
    console.error("Error during smart daily top-up:", error);
    return { success: false, error: error.message };
  }
};

// Manual top-up endpoint (for testing)
const triggerTopUp = async (req, res) => {
  try {
    const result = await smartDailyTopUp();
    res.json({
      message: "Manual top-up completed successfully",
      result,
    });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error during manual top-up", error: error.message });
  }
};

// Get top-up status
const getTopUpStatus = async (req, res) => {
  try {
    const users = await AuthUserModel.find({}, { email: 1, balance: 1 });
    res.json({
      message: "Top-up status retrieved",
      totalUsers: users.length,
      users: users.map((user) => ({
        email: user.email,
        balance: user.balance || 0,
      })),
    });
  } catch (error) {
    res.status(500).json({
      message: "Error retrieving top-up status",
      error: error.message,
    });
  }
};

// Get detailed top-up status
const getTopUpDetails = async (req, res) => {
  try {
    const users = await AuthUserModel.find(
      {},
      { email: 1, balance: 1, lastTopUp: 1 }
    );
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const usersWithStatus = users.map((user) => ({
      email: user.email,
      balance: user.balance || 0,
      lastTopUp: user.lastTopUp,
      eligibleForTopUp: !user.lastTopUp || user.lastTopUp < today,
    }));

    const eligibleCount = usersWithStatus.filter(
      (u) => u.eligibleForTopUp
    ).length;

    res.json({
      message: "Detailed top-up status retrieved",
      totalUsers: users.length,
      eligibleForTopUp: eligibleCount,
      users: usersWithStatus,
    });
  } catch (error) {
    res.status(500).json({
      message: "Error retrieving detailed top-up status",
      error: error.message,
    });
  }
};

module.exports = {
  smartDailyTopUp,
  triggerTopUp,
  getTopUpStatus,
  getTopUpDetails,
};
