// Load environment variables FIRST
const dotenv = require("dotenv");
dotenv.config();

const express = require("express");
const cors = require("cors");

// Initialize Express app
const app = express();
const port = process.env.PORT || 5001;

// Basic CORS - very permissive for now
app.use(
  cors({
    origin: true,
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"],
    allowedHeaders: [
      "Content-Type",
      "Authorization",
      "X-Requested-With",
      "Accept",
      "Origin",
    ],
  })
);

app.use(express.json());

// Health check routes
app.get("/", (req, res) => {
  res.json({
    status: "OK",
    message: "Astral Credit Union API Server",
    timestamp: new Date().toISOString(),
    env: process.env.NODE_ENV || "development",
  });
});

app.get("/api/test", (req, res) => {
  res.json({
    message: "Server is working!",
    timestamp: new Date().toISOString(),
    origin: req.headers.origin,
    method: req.method,
    url: req.url,
  });
});

// Import and use routes with error handling
try {
  // Import configurations
  const connectDB = require("./config/database");

  // Import routes
  const authRoutes = require("./routes/authRoutes");
  const userRoutes = require("./routes/userRoutes");
  const adminRoutes = require("./routes/adminRoutes");
  const messageRoutes = require("./routes/messageRoutes");

  // Connect to database
  connectDB().catch((err) => {
    console.error("Database connection failed:", err);
    // Don't crash the server, just log the error
  });

  // Routes
  app.use("/api", authRoutes);
  app.use("/api", adminRoutes);
  app.use("/api", messageRoutes);
  app.use("/api", userRoutes);
  app.use(userRoutes); // Legacy routes

  console.log("✅ All routes loaded successfully");
} catch (error) {
  console.error("❌ Error loading routes:", error);
  // Server continues to run even if routes fail to load
}

// Import utilities with error handling
try {
  const { cleanupExpiredUsers } = require("./utils/helpers");
  // Start cleanup system (but don't crash if it fails)
  cleanupExpiredUsers();
  console.log("✅ Cleanup system started");
} catch (error) {
  console.error("❌ Cleanup system failed:", error);
  // Continue without cleanup
}

// Global error handler
app.use((err, req, res, next) => {
  console.error("Global error handler:", err);
  res.status(500).json({
    error: "Internal server error",
    message: err.message,
    timestamp: new Date().toISOString(),
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    error: "Not found",
    path: req.path,
    method: req.method,
    timestamp: new Date().toISOString(),
  });
});

// Start server
app.listen(port, () => {
  console.log(`🚀 Server is running on port ${port}`);
  console.log(`📍 Environment: ${process.env.NODE_ENV || "development"}`);
});

module.exports = app;
