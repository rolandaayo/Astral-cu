const mongoose = require("mongoose");

const connectDB = async () => {
  try {
    const uri = process.env.MONGODB_URI;
    const clientOptions = {
      serverApi: { version: "1", strict: true, deprecationErrors: true },
      maxPoolSize: 10, // Maintain up to 10 socket connections
      serverSelectionTimeoutMS: 5000, // Keep trying to send operations for 5 seconds
      socketTimeoutMS: 45000, // Close sockets after 45 seconds of inactivity
    };

    // Configure mongoose-specific options
    mongoose.set("bufferCommands", false); // Disable mongoose buffering

    await mongoose.connect(uri, clientOptions);
    await mongoose.connection.db.admin().command({ ping: 1 });
    console.log("✅ Successfully connected to MongoDB!");

    // Start top-up system only after successful database connection
    const { smartDailyTopUp } = require("../controllers/adminController");

    // Run daily top-up every 24 hours (86400000 milliseconds)
    setInterval(smartDailyTopUp, 24 * 60 * 60 * 1000);

    // Also run once when server starts (for testing) - wait 10 seconds to ensure everything is ready
    setTimeout(smartDailyTopUp, 10000);

    console.log("💰 Daily balance top-up system initialized");
  } catch (error) {
    console.error("❌ MongoDB connection error:", error);
    process.exit(1);
  }
};

module.exports = connectDB;
