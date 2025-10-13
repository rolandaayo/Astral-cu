const express = require("express");
const mongoose = require("mongoose");
const jwt = require("jsonwebtoken");
const bycrypt = require("bcryptjs");
const cors = require("cors");
const nodemailer = require("nodemailer");
const UserModel = require("./models/Users");
const AuthUserModel = require("./models/AuthUser");
const dotenv = require("dotenv");

dotenv.config();

const app = express();

// CORS configuration
const corsOptions = {
  origin: [
    "http://localhost:3000",
    "http://localhost:3001",
    "https://astral-cu.web.app",
    "https://astral-cu.firebaseapp.com",
    "https://your-domain.com", // Add your production domain here
  ],
  credentials: true,
  optionsSuccessStatus: 200,
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
};

app.use(cors(corsOptions));
app.use(express.json());
const port = process.env.PORT || 5001;

// Email transporter setup
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

// Generate 6-digit verification code
const generateVerificationCode = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

// Temporary storage for unverified users (in production, use Redis or similar)
const pendingUsers = new Map();

// Clean up expired pending users every 5 minutes
setInterval(() => {
  const now = new Date();
  for (const [email, userData] of pendingUsers.entries()) {
    if (now > userData.verificationCodeExpires) {
      pendingUsers.delete(email);
      console.log(`Removed expired pending user: ${email}`);
    }
  }
}, 5 * 60 * 1000); // 5 minutes

// Send verification email
const sendVerificationEmail = async (email, code) => {
  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: email,
    subject: "Astral Credit Union - Email Verification",
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, #1E5BA8, #163f75); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
          <h1 style="color: white; margin: 0; font-size: 28px;">Astral Credit Union</h1>
          <p style="color: rgba(255,255,255,0.9); margin: 10px 0 0 0;">Email Verification</p>
        </div>
        <div style="background: #f8f9fa; padding: 30px; border-radius: 0 0 10px 10px;">
          <h2 style="color: #333; margin-bottom: 20px;">Verify Your Email Address</h2>
          <p style="color: #666; margin-bottom: 25px;">Thank you for signing up with Astral Credit Union. Please use the verification code below to complete your registration:</p>
          
          <div style="background: white; border: 2px solid #1E5BA8; border-radius: 8px; padding: 20px; text-align: center; margin: 25px 0;">
            <h1 style="color: #1E5BA8; font-size: 36px; margin: 0; letter-spacing: 5px; font-family: monospace;">${code}</h1>
          </div>
          
          <p style="color: #666; margin-bottom: 20px;">This code will expire in 10 minutes for security purposes.</p>
          <p style="color: #666; margin-bottom: 0;">If you didn't create an account with us, please ignore this email.</p>
          
          <hr style="border: none; border-top: 1px solid #ddd; margin: 25px 0;">
          <p style="color: #999; font-size: 12px; text-align: center;">
            This is an automated message from Astral Credit Union. Please do not reply to this email.
          </p>
        </div>
      </div>
    `,
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log(`Verification email sent to ${email}`);
    return true;
  } catch (error) {
    console.error("Error sending email:", error);
    return false;
  }
};

const uri = process.env.MONGODB_URI;
const clientOptions = {
  serverApi: { version: "1", strict: true, deprecationErrors: true },
};

async function run() {
  try {
    await mongoose.connect(uri, clientOptions);
    await mongoose.connection.db.admin().command({ ping: 1 });
    console.log(
      "Pinged your deployment. You successfully connected to MongoDB!"
    );
  } catch (error) {
    console.error("MongoDB connection error:", error);
  }
}
run().catch(console.dir);

// Daily balance top-up system
const dailyTopUp = async () => {
  try {
    console.log("Running daily balance top-up...");

    // Get all users
    const users = await AuthUserModel.find({});

    for (const user of users) {
      // Generate random amount between $5-$10
      const randomAmount = Math.floor(Math.random() * 6) + 5; // 5, 6, 7, 8, 9, or 10

      // Add the amount to user's balance
      user.balance = (user.balance || 0) + randomAmount;
      await user.save();

      console.log(
        `Added $${randomAmount} to user ${user.email} (ID: ${user._id})`
      );
    }

    console.log(`Daily top-up completed for ${users.length} users`);
  } catch (error) {
    console.error("Error during daily top-up:", error);
  }
};

// Improved daily top-up with date tracking
const smartDailyTopUp = async () => {
  try {
    console.log("Running smart daily balance top-up...");

    const today = new Date();
    today.setHours(0, 0, 0, 0); // Set to start of day

    // Get users who haven't received top-up today
    const users = await AuthUserModel.find({
      $or: [{ lastTopUp: { $lt: today } }, { lastTopUp: null }],
    });

    let toppedUpCount = 0;

    for (const user of users) {
      // Generate random amount between $5-$10
      const randomAmount = Math.floor(Math.random() * 6) + 5; // 5, 6, 7, 8, 9, or 10

      // Add the amount to user's balance
      user.balance = (user.balance || 0) + randomAmount;
      user.lastTopUp = new Date();
      await user.save();

      console.log(
        `✅ Added $${randomAmount} to user ${
          user.email
        } (New balance: $${user.balance.toFixed(2)})`
      );
      toppedUpCount++;
    }

    console.log(`Smart daily top-up completed for ${toppedUpCount} users`);
    return { success: true, toppedUpCount, totalUsers: users.length };
  } catch (error) {
    console.error("Error during smart daily top-up:", error);
    return { success: false, error: error.message };
  }
};

// Run daily top-up every 24 hours (86400000 milliseconds)
setInterval(smartDailyTopUp, 24 * 60 * 60 * 1000);

// Also run once when server starts (for testing)
setTimeout(smartDailyTopUp, 5000); // Run 5 seconds after server start

app.post("/api/login", async (req, res) => {
  const { email, password } = req.body;
  try {
    const user = await AuthUserModel.findOne({ email: email });
    if (!user) {
      return res.status(401).json({ message: "User not found" });
    }

    const isPasswordValid = await bycrypt.compare(password, user.password);
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
});

app.post("/api/signup", async (req, res) => {
  const { name, email, phoneNumber, ssn, password, frontIdImage, backIdImage } =
    req.body;
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

    const hashedPassword = await bycrypt.hash(password, 10);
    const verificationCode = generateVerificationCode();
    const verificationExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    // Store user data temporarily (NOT in database yet)
    pendingUsers.set(email, {
      name,
      email,
      phoneNumber,
      ssn,
      frontIdImage,
      backIdImage,
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
});

// Send verification email
app.post("/api/auth/send-verification", async (req, res) => {
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
});

// Verify email with code
app.post("/api/auth/verify-email", async (req, res) => {
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

    // Verification successful - now create the user in MongoDB
    const user = await AuthUserModel.create({
      name: pendingUser.name,
      email: pendingUser.email,
      phoneNumber: pendingUser.phoneNumber,
      ssn: pendingUser.ssn,
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
});

// Resend verification code
app.post("/api/auth/resend-verification", async (req, res) => {
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
});

app.get("/", (rmeq, res) => {
  UserModel.find({})
    .then((users) => res.json(users))
    .catch((err) => res.json(err));
});

app.get("/getUser/:id", (req, res) => {
  const id = req.params.id;
  UserModel.findById({ _id: id })
    .then((users) => res.json(users))
    .catch((err) => res.json(err));
});

app.put("/updateUser/:id", (req, res) => {
  const id = req.params.id;
  UserModel.findByIdAndUpdate(
    { _id: id },
    {
      name: req.body.name,
      email: req.body.email,
      phone: req.body.phone,
      address: req.body.address,
    }
  )
    .then((users) => res.json(users))
    .catch((err) => res.json(err));
});

app.delete("/deleteUser/:id", (req, res) => {
  const id = req.params.id;
  UserModel.findByIdAndDelete({ _id: id })
    .then((res) => res.json(res))
    .catch((err) => res.json(err));
});

app.post("/createUser", (req, res) => {
  UserModel.create(req.body)
    .then((users) => res.json(users))
    .catch((err) => res.json(err));
});

// Get all users
app.get("/api/users", async (req, res) => {
  try {
    const users = await AuthUserModel.find({}, { password: 0 });
    res.json(users);
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error fetching users", error: error.message });
  }
});

// Update user balance
app.put("/api/users/:userId/balance", async (req, res) => {
  try {
    const { userId } = req.params;
    const { balance, cryptoType, cryptoBalance } = req.body;

    let updateData = {};
    if (cryptoType) {
      updateData[`cryptoBalances.${cryptoType}`] = parseFloat(cryptoBalance);
    } else {
      updateData.balance = parseFloat(balance);
    }

    const user = await AuthUserModel.findByIdAndUpdate(userId, updateData, {
      new: true,
    });

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.json({ message: "Balance updated successfully", user });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error updating balance", error: error.message });
  }
});

// Get current user (authenticated)
app.get("/api/users/me", async (req, res) => {
  try {
    const token = req.headers.authorization?.split(" ")[1];
    if (!token) {
      return res.status(401).json({ message: "No token provided" });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await AuthUserModel.findById(decoded.userId, { password: 0 });

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.json({
      id: user._id,
      email: user.email,
      name: user.name,
      phoneNumber: user.phoneNumber,
      ssn: user.ssn,
      balance: user.balance || 0,
      isEmailVerified: user.isEmailVerified,
      cryptoBalances: user.cryptoBalances || {
        dodge: 0,
        eth: 0,
        btc: 0,
        spacex: 0,
      },
      lastTopUp: user.lastTopUp,
    });
  } catch (error) {
    res.status(401).json({ message: "Invalid token" });
  }
});

// Get single user
app.get("/api/users/:userId", async (req, res) => {
  try {
    const { userId } = req.params;
    const user = await AuthUserModel.findById(userId, { password: 0 });

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.json(user);
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error fetching user", error: error.message });
  }
});

// Delete user
app.delete("/api/users/:userId", async (req, res) => {
  try {
    const { userId } = req.params;
    const user = await AuthUserModel.findByIdAndDelete(userId);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.json({ message: "User deleted successfully" });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error deleting user", error: error.message });
  }
});

// Manual top-up endpoint (for testing)
app.post("/api/admin/topup", async (req, res) => {
  try {
    const result = await smartDailyTopUp();
    res.json({
      message: "Manual top-up completed successfully",
      result,
    });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error during manual top-up", error: error.message });
  }
});

// Get top-up status
app.get("/api/admin/topup-status", async (req, res) => {
  try {
    const users = await AuthUserModel.find({}, { email: 1, balance: 1 });
    res.json({
      message: "Top-up status retrieved",
      totalUsers: users.length,
      users: users.map((user) => ({
        email: user.email,
        balance: user.balance || 0,
      })),
    });
  } catch (error) {
    res.status(500).json({
      message: "Error retrieving top-up status",
      error: error.message,
    });
  }
});

// Get detailed top-up status
app.get("/api/admin/topup-details", async (req, res) => {
  try {
    const users = await AuthUserModel.find(
      {},
      { email: 1, balance: 1, lastTopUp: 1 }
    );
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const usersWithStatus = users.map((user) => ({
      email: user.email,
      balance: user.balance || 0,
      lastTopUp: user.lastTopUp,
      eligibleForTopUp: !user.lastTopUp || user.lastTopUp < today,
    }));

    const eligibleCount = usersWithStatus.filter(
      (u) => u.eligibleForTopUp
    ).length;

    res.json({
      message: "Detailed top-up status retrieved",
      totalUsers: users.length,
      eligibleForTopUp: eligibleCount,
      users: usersWithStatus,
    });
  } catch (error) {
    res.status(500).json({
      message: "Error retrieving detailed top-up status",
      error: error.message,
    });
  }
});

app.listen(port, () => {
  console.log("Server is Running on " + port);
  console.log("Daily balance top-up system is active");
  console.log(
    "Top-up will run every 24 hours and add $5-$10 randomly to each user"
  );
});
