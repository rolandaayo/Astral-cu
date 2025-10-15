const mongoose = require("mongoose");
// Keep defaults (buffering enabled) for simpler, more resilient connections
// mongoose.set("bufferCommands", false);

const connectDB = async () => {
  try {
    const uri = process.env.MONGODB_URI;
    await mongoose.connect(uri);
    console.log("✅ Successfully connected to MongoDB!");

    // Keep it simple: no scheduled tasks tied to DB connection here
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
