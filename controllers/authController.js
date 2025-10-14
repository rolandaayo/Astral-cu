const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const AuthUserModel = require("../models/AuthUser");
const { sendVerificationEmail } = require("../utils/emailService");
const { uploadToCloudinary } = require("../utils/cloudinaryService");
const {
  generateVerificationCode,
  generateRoutingNumber,
  pendingUsers,
} = require("../utils/helpers");

// Login controller
const login = async (req, res) => {
  const { email, password } = req.body;
  try {
    const user = await AuthUserModel.findOne({ email: email });
    if (!user) {
      return res.status(401).json({ message: "User not found" });
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({ message: "Invalid password" });
    }

    // Check if email is verified (skip for admin)
    if (email !== "admin@astral.com" && !user.isEmailVerified) {
      return res.status(403).json({
        message: "Please verify your email before logging in",
        needsVerification: true,
      });
    }

    const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, {
      expiresIn: "1h",
    });

    res.json({
      message: "Login successful",
      token: token,
      user: {
        id: user._id,
        email: user.email,
        name: user.name,
        phoneNumber: user.phoneNumber,
        ssn: user.ssn,
        routingNumber: user.routingNumber,
        balance: user.balance || 0,
        isEmailVerified: user.isEmailVerified,
        cryptoBalances: user.cryptoBalances || {
          dodge: 0,
          eth: 0,
          btc: 0,
          spacex: 0,
        },
        lastTopUp: user.lastTopUp,
      },
    });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// Signup controller
const signup = async (req, res) => {
  const { name, email, phoneNumber, ssn, password } = req.body;
  try {
    // Check if user already exists in database
    const existingUser = await AuthUserModel.findOne({ email: email });
    if (existingUser) {
      return res.status(400).json({ message: "Email already exists" });
    }

    // Check if user is already pending verification
    if (pendingUsers.has(email)) {
      return res.status(400).json({
        message:
          "Verification email already sent. Please check your email or try again later.",
      });
    }

    // Validate that both ID images are provided
    if (!req.files || !req.files.frontIdImage || !req.files.backIdImage) {
      return res.status(400).json({
        message: "Both front and back ID images are required",
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const verificationCode = generateVerificationCode();
    const verificationExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    // Upload images to Cloudinary
    let frontIdUrl, backIdUrl;
    try {
      frontIdUrl = await uploadToCloudinary(
        req.files.frontIdImage[0].buffer,
        "id-documents/front"
      );
      backIdUrl = await uploadToCloudinary(
        req.files.backIdImage[0].buffer,
        "id-documents/back"
      );
    } catch (uploadError) {
      console.error("Cloudinary upload error:", uploadError);
      return res.status(500).json({
        message: "Failed to upload ID images. Please try again.",
      });
    }

    // Store user data temporarily (NOT in database yet)
    pendingUsers.set(email, {
      name,
      email,
      phoneNumber,
      ssn,
      frontIdImage: frontIdUrl,
      backIdImage: backIdUrl,
      password: hashedPassword,
      verificationCode,
      verificationCodeExpires: verificationExpires,
      createdAt: new Date(),
    });

    // Send verification email
    const emailSent = await sendVerificationEmail(email, verificationCode);
    if (!emailSent) {
      // Remove from pending if email fails
      pendingUsers.delete(email);
      return res
        .status(500)
        .json({ message: "Failed to send verification email" });
    }

    res.status(201).json({
      message:
        "Verification email sent. Please check your email and verify to complete registration.",
      needsVerification: true,
      email: email,
    });
  } catch (error) {
    console.error("Signup error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// Send verification email
const sendVerification = async (req, res) => {
  const { email } = req.body;
  try {
    // Check if user is already verified in database
    const existingUser = await AuthUserModel.findOne({ email });
    if (existingUser && existingUser.isEmailVerified) {
      return res.status(400).json({ message: "Email is already verified" });
    }

    // Check if user is in pending verification
    const pendingUser = pendingUsers.get(email);
    if (!pendingUser) {
      return res.status(404).json({
        message: "No pending verification found. Please sign up first.",
      });
    }

    const verificationCode = generateVerificationCode();
    const verificationExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    // Update pending user with new code
    pendingUser.verificationCode = verificationCode;
    pendingUser.verificationCodeExpires = verificationExpires;
    pendingUsers.set(email, pendingUser);

    const emailSent = await sendVerificationEmail(email, verificationCode);
    if (!emailSent) {
      return res
        .status(500)
        .json({ message: "Failed to send verification email" });
    }

    res.json({
      message: "Verification email sent successfully",
      success: true,
    });
  } catch (error) {
    console.error("Send verification error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// Verify email with code
const verifyEmail = async (req, res) => {
  const { email, code } = req.body;
  try {
    // Check if user is in pending verification
    const pendingUser = pendingUsers.get(email);
    if (!pendingUser) {
      return res
        .status(404)
        .json({ message: "No pending verification found for this email" });
    }

    if (pendingUser.verificationCode !== code) {
      return res.status(400).json({ message: "Invalid verification code" });
    }

    if (new Date() > pendingUser.verificationCodeExpires) {
      // Remove expired pending user
      pendingUsers.delete(email);
      return res.status(400).json({
        message: "Verification code has expired. Please sign up again.",
      });
    }

    // Generate unique routing number
    let routingNumber;
    let isUnique = false;
    while (!isUnique) {
      routingNumber = generateRoutingNumber();
      const existingUser = await AuthUserModel.findOne({ routingNumber });
      if (!existingUser) {
        isUnique = true;
      }
    }

    // Verification successful - now create the user in MongoDB
    const user = await AuthUserModel.create({
      name: pendingUser.name,
      email: pendingUser.email,
      phoneNumber: pendingUser.phoneNumber,
      ssn: pendingUser.ssn,
      routingNumber: routingNumber,
      frontIdImage: pendingUser.frontIdImage,
      backIdImage: pendingUser.backIdImage,
      password: pendingUser.password,
      isEmailVerified: true,
      balance: 0,
      cryptoBalances: {
        dodge: 0,
        eth: 0,
        btc: 0,
        spacex: 0,
      },
    });

    // Remove from pending users
    pendingUsers.delete(email);

    // Generate token for the new user
    const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, {
      expiresIn: "1h",
    });

    res.json({
      message: "Email verified successfully! Account created.",
      success: true,
      token: token,
      user: {
        id: user._id,
        email: user.email,
        name: user.name,
        phoneNumber: user.phoneNumber,
        ssn: user.ssn,
        routingNumber: user.routingNumber,
        balance: user.balance,
        isEmailVerified: user.isEmailVerified,
        cryptoBalances: user.cryptoBalances,
        lastTopUp: user.lastTopUp,
      },
    });
  } catch (error) {
    console.error("Verify email error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// Resend verification code
const resendVerification = async (req, res) => {
  const { email } = req.body;
  try {
    // Check if user is already verified in database
    const existingUser = await AuthUserModel.findOne({ email });
    if (existingUser && existingUser.isEmailVerified) {
      return res.status(400).json({ message: "Email is already verified" });
    }

    // Check if user is in pending verification
    const pendingUser = pendingUsers.get(email);
    if (!pendingUser) {
      return res.status(404).json({
        message: "No pending verification found. Please sign up first.",
      });
    }

    const verificationCode = generateVerificationCode();
    const verificationExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    // Update pending user with new code
    pendingUser.verificationCode = verificationCode;
    pendingUser.verificationCodeExpires = verificationExpires;
    pendingUsers.set(email, pendingUser);

    const emailSent = await sendVerificationEmail(email, verificationCode);
    if (!emailSent) {
      return res
        .status(500)
        .json({ message: "Failed to send verification email" });
    }

    res.json({
      message: "Verification code resent successfully",
      success: true,
    });
  } catch (error) {
    console.error("Resend verification error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

module.exports = {
  login,
  signup,
  sendVerification,
  verifyEmail,
  resendVerification,
};
