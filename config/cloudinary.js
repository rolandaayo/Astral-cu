const cloudinary = require("cloudinary").v2;

// Debug environment variables
console.log("🔍 Cloudinary Environment Variables:");
console.log("CLOUDINARY_CLOUD_NAME:", process.env.CLOUDINARY_CLOUD_NAME);
console.log(
  "CLOUDINARY_API_KEY:",
  process.env.CLOUDINARY_API_KEY ? "✅ Set" : "❌ Missing"
);
console.log(
  "CLOUDINARY_SECRET_API_KEY:",
  process.env.CLOUDINARY_SECRET_API_KEY ? "✅ Set" : "❌ Missing"
);

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_SECRET_API_KEY,
});

module.exports = cloudinary;
