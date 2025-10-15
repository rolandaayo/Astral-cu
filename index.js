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

// Test login endpoint for debugging
app.post("/api/login-test", (req, res) => {
  try {
    res.json({
      message: "Login test endpoint reached",
      body: req.body,
      hasJwtSecret: !!process.env.JWT_SECRET,
      hasMongoUri: !!process.env.MONGODB_URI,
      jwtSecretLength: process.env.JWT_SECRET
        ? process.env.JWT_SECRET.length
        : 0,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    res.status(500).json({
      error: "Login test failed",
      message: error.message,
      stack: error.stack,
    });
  }
});

// Environment debug endpoint
app.get("/api/env-debug", (req, res) => {
  res.json({
    nodeEnv: process.env.NODE_ENV,
    hasJwtSecret: !!process.env.JWT_SECRET,
    hasMongoUri: !!process.env.MONGODB_URI,
    hasEmailUser: !!process.env.EMAIL_USER,
    hasCloudinaryName: !!process.env.CLOUDINARY_CLOUD_NAME,
    port: process.env.PORT,
    timestamp: new Date().toISOString(),
  });
});

// Database connection status
app.get("/api/db-status", (req, res) => {
  try {
    const mongoose = require("mongoose");
    const state = mongoose.connection.readyState; // 0 = disconnected, 1 = connected, 2 = connecting, 3 = disconnecting
    res.json({
      readyState: state,
      states: {
        0: "disconnected",
        1: "connected",
        2: "connecting",
        3: "disconnecting",
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    res.status(500).json({ message: "db-status failed", error: error.message });
  }
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
  connectDB()
    .then((result) => {
      if (result !== false) {
        console.log("✅ Database connected successfully");
        // Fix accidental unique indexes
        try {
          const {
            dropRoutingNumberUniqueIndexIfExists,
          } = require("./utils/fixIndexes");
          dropRoutingNumberUniqueIndexIfExists();
        } catch (e) {
          console.warn("⚠️ Index fixer failed:", e.message);
        }
      } else {
        console.log("⚠️ Database connection failed, but server continues");
      }
    })
    .catch((err) => {
      console.error("❌ Database connection failed:", err);
      console.log("⚠️ Server continues without database");
    });

  // Routes with individual error handling
  try {
    app.use("/api", authRoutes);
    console.log("✅ Auth routes loaded");
  } catch (err) {
    console.error("❌ Auth routes failed:", err);
  }

  try {
    app.use("/api", adminRoutes);
    console.log("✅ Admin routes loaded");
  } catch (err) {
    console.error("❌ Admin routes failed:", err);
  }

  try {
    app.use("/api", messageRoutes);
    console.log("✅ Message routes loaded");
  } catch (err) {
    console.error("❌ Message routes failed:", err);
  }

  try {
    app.use("/api", userRoutes);
    app.use(userRoutes); // Legacy routes
    console.log("✅ User routes loaded");
  } catch (err) {
    console.error("❌ User routes failed:", err);
  }

  console.log("✅ Route loading completed");
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
