const cloudinary = require("cloudinary").v2;

// Upload image to Cloudinary
const uploadToCloudinary = (buffer, folder = "id-documents") => {
  return new Promise((resolve, reject) => {
    console.log(`🔄 Attempting to upload to Cloudinary folder: ${folder}`);
    console.log(`📊 Buffer size: ${buffer.length} bytes`);

    // Configure cloudinary here to ensure env vars are loaded
    cloudinary.config({
      cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
      api_key: process.env.CLOUDINARY_API_KEY,
      api_secret: process.env.CLOUDINARY_SECRET_API_KEY,
    });

    console.log("🔍 Cloudinary config check:");
    console.log("Cloud name:", process.env.CLOUDINARY_CLOUD_NAME);
    console.log(
      "API key:",
      process.env.CLOUDINARY_API_KEY ? "✅ Set" : "❌ Missing"
    );
    console.log(
      "API secret:",
      process.env.CLOUDINARY_SECRET_API_KEY ? "✅ Set" : "❌ Missing"
    );

    cloudinary.uploader
      .upload_stream(
        {
          resource_type: "image",
          folder: folder,
          transformation: [
            { width: 800, height: 600, crop: "limit" },
            { quality: "auto" },
          ],
        },
        (error, result) => {
          if (error) {
            console.error("❌ Cloudinary upload error:", error);
            reject(error);
          } else {
            console.log(
              `✅ Cloudinary upload successful: ${result.secure_url}`
            );
            resolve(result.secure_url);
          }
        }
      )
      .end(buffer);
  });
};

module.exports = { uploadToCloudinary };
