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
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"],
  allowedHeaders: [
    "Content-Type",
    "Authorization",
    "X-Requested-With",
    "Accept",
    "Origin",
  ],
  exposedHeaders: ["Content-Length", "X-Foo", "X-Bar"],
};

module.exports = corsOptions;
