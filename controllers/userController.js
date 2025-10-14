const AuthUserModel = require("../models/AuthUser");
const UserModel = require("../models/Users");

// Get current user (authenticated)
const getCurrentUser = async (req, res) => {
  try {
    const user = await AuthUserModel.findById(req.userId, { password: 0 });

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.json({
      id: user._id,
      email: user.email,
      name: user.name,
      phoneNumber: user.phoneNumber,
      ssn: user.ssn,
      accountNumber: user.accountNumber,
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
    });
  } catch (error) {
    res.status(401).json({ message: "Invalid token" });
  }
};

// Get all users
const getAllUsers = async (req, res) => {
  try {
    const users = await AuthUserModel.find({}, { password: 0 });
    res.json(users);
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error fetching users", error: error.message });
  }
};

// Get single user
const getUserById = async (req, res) => {
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
};

// Update user balance
const updateUserBalance = async (req, res) => {
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
};

// Delete user
const deleteUser = async (req, res) => {
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
};

// Legacy user operations (for old UserModel)
const getLegacyUsers = (req, res) => {
  UserModel.find({})
    .then((users) => res.json(users))
    .catch((err) => res.json(err));
};

const getLegacyUserById = (req, res) => {
  const id = req.params.id;
  UserModel.findById({ _id: id })
    .then((users) => res.json(users))
    .catch((err) => res.json(err));
};

const updateLegacyUser = (req, res) => {
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
};

const deleteLegacyUser = (req, res) => {
  const id = req.params.id;
  UserModel.findByIdAndDelete({ _id: id })
    .then((result) => res.json(result))
    .catch((err) => res.json(err));
};

const createLegacyUser = (req, res) => {
  UserModel.create(req.body)
    .then((users) => res.json(users))
    .catch((err) => res.json(err));
};

module.exports = {
  getCurrentUser,
  getAllUsers,
  getUserById,
  updateUserBalance,
  deleteUser,
  getLegacyUsers,
  getLegacyUserById,
  updateLegacyUser,
  deleteLegacyUser,
  createLegacyUser,
};
