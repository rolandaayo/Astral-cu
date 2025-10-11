const express = require("express");
const mongoose = require("mongoose");
const jwt = require("jsonwebtoken");
const bycrypt = require("bcryptjs");
const cors = require("cors");
const UserModel = require("./models/Users");
const AuthUserModel = require("./models/AuthUser");
const dotenv = require("dotenv");

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());
const port = process.env.PORT || 5001;

const uri =
  process.env.MONGODB_URI ;
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
        balance: user.balance || 0,
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
  const { name, email, password } = req.body;
  try {
    const existingUser = await AuthUserModel.findOne({ email: email });
    if (existingUser) {
      return res.status(400).json({ message: "Email already exists" });
    }

    const hashedPassword = await bycrypt.hash(password, 10);
    const user = await AuthUserModel.create({
      name,
      email,
      password: hashedPassword,
    });

    const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, {
      expiresIn: "1h",
    });

    res.status(201).json({
      message: "User created successfully",
      token: token,
      user: {
        id: user._id,
        email: user.email,
        name: user.name,
        balance: user.balance || 0,
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
    console.error("Signup error:", error);
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
      balance: user.balance || 0,
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
