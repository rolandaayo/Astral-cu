// Minimal server for debugging Vercel deployment
const express = require("express");
const cors = require("cors");

const app = express();
const port = process.env.PORT || 5001;

// Basic CORS
app.use(
  cors({
    origin: true,
    credentials: true,
  })
);

app.use(express.json());

// Test routes
app.get("/", (req, res) => {
  res.json({
    status: "OK",
    message: "Minimal Astral Server",
    timestamp: new Date().toISOString(),
  });
});

app.get("/api/test", (req, res) => {
  res.json({
    message: "Test endpoint working!",
    timestamp: new Date().toISOString(),
  });
});

// Basic login endpoint for testing
app.post("/api/login", (req, res) => {
  res.json({
    message: "Login endpoint reached",
    body: req.body,
    timestamp: new Date().toISOString(),
  });
});

// Error handling
app.use((err, req, res, next) => {
  console.error("Server error:", err);
  res.status(500).json({
    error: "Internal server error",
    message: err.message,
  });
});

// Start server
app.listen(port, () => {
  console.log(`🚀 Minimal server running on port ${port}`);
});

module.exports = app;
