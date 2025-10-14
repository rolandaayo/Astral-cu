const corsOptions = {
  origin: [
    "http://localhost:3000",
    "http://localhost:3001",
    "https://astral-cu.web.app",
    "https://astral-cu.firebaseapp.com",
    "https://your-domain.com",
  ],
  credentials: true,
  optionsSuccessStatus: 200,
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
};

module.exports = corsOptions;
