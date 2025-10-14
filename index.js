// Load environment variables FIRST
const dotenv = require("dotenv");
dotenv.config();

const express = require("express");
const cors = require("cors");

// Import configurations (after dotenv is loaded)
const connectDB = require("./config/database");
const corsOptions = require("./config/cors");

// Import routes
const authRoutes = require("./routes/authRoutes");
const userRoutes = require("./routes/userRoutes");
const adminRoutes = require("./routes/adminRoutes");
const messageRoutes = require("./routes/messageRoutes");

// Import utilities
const { cleanupExpiredUsers } = require("./utils/helpers");
const { smartDailyTopUp } = require("./controllers/adminController");

// Initialize Express app
const app = express();
const port = process.env.PORT || 5001;

// Middleware
app.use(cors(corsOptions));
app.use(express.json());

// Connect to database
connectDB();

// Routes
app.use("/api", authRoutes);
app.use("/api", adminRoutes);
app.use("/api", messageRoutes);
app.use(userRoutes); // Legacy routes without /api prefix

// Start cleanup system
cleanupExpiredUsers();

// Start server
app.listen(port, () => {
  console.log(`🚀 Server is running on port ${port}`);
  console.log(
    "🔄 Top-up will run every 24 hours and add $5-$10 randomly to each user"
  );
});

module.exports = app;
