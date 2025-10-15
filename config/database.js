const mongoose = require("mongoose");

const connectDB = async () => {
  try {
    const uri = process.env.MONGODB_URI;
    const clientOptions = {
      serverApi: { version: "1", strict: true, deprecationErrors: true },
      maxPoolSize: 10, // Maintain up to 10 socket connections
      serverSelectionTimeoutMS: 30000, // Keep trying to send operations for 30 seconds
      socketTimeoutMS: 45000, // Close sockets after 45 seconds of inactivity
      bufferMaxEntries: 0, // Disable mongoose buffering
      useNewUrlParser: true,
      useUnifiedTopology: true,
    };

    // Set mongoose options
    mongoose.set("strictQuery", false);

    await mongoose.connect(uri, clientOptions);
    await mongoose.connection.db.admin().command({ ping: 1 });
    console.log("✅ Successfully connected to MongoDB!");

    return true;

    // Start top-up system only after successful database connection
    const { smartDailyTopUp } = require("../controllers/adminController");

    // Run daily top-up every 24 hours (86400000 milliseconds)
    setInterval(smartDailyTopUp, 24 * 60 * 60 * 1000);

    // Also run once when server starts (for testing) - wait 10 seconds to ensure everything is ready
    setTimeout(smartDailyTopUp, 10000);

    console.log("💰 Daily balance top-up system initialized");
  } catch (error) {
    console.error("❌ MongoDB connection error:", error);
    console.log("⚠️ Server will continue without database connection");
    console.log("🔧 To fix this:");
    console.log("1. Go to MongoDB Atlas dashboard");
    console.log("2. Navigate to Network Access");
    console.log("3. Add your current IP address to the whitelist");
    console.log("4. Or add 0.0.0.0/0 to allow all IPs (less secure)");
    // Don't exit the process, let the server continue
    return false;
  }
};

module.exports = connectDB;
