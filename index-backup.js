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

// Additional CORS headers for debugging
app.use((req, res, next) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader(
    "Access-Control-Allow-Methods",
    "GET, POST, PUT, DELETE, OPTIONS, PATCH"
  );
  res.setHeader(
    "Access-Control-Allow-Headers",
    "Content-Type, Authorization, X-Requested-With, Accept, Origin"
  );
  res.setHeader("Access-Control-Allow-Credentials", "true");

  if (req.method === "OPTIONS") {
    return res.sendStatus(200);
  }
  next();
});

// Connect to database
connectDB();

// Test route for CORS debugging
app.get("/api/test", (req, res) => {
  try {
    res.json({
      message: "Server is working!",
      timestamp: new Date().toISOString(),
      origin: req.headers.origin,
      method: req.method,
      url: req.url,
    });
  } catch (error) {
    console.error("Test route error:", error);
    res.status(500).json({ error: error.message });
  }
});

// Health check route
app.get("/", (req, res) => {
  res.json({
    status: "OK",
    message: "Astral Credit Union API Server",
    timestamp: new Date().toISOString(),
  });
});

// Routes
app.use("/api", authRoutes);
app.use("/api", adminRoutes);
app.use("/api", messageRoutes);
app.use("/api", userRoutes); // Add /api prefix for consistency
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
