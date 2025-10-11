const mongoose = require("mongoose")

const UserSchema = new mongoose.Schema({
    name: String,
    email: String,
    phone: Number,
    address: String,
    wallet: {
        type: Number,
        default: 0
    },
    role:{
        type: String,
        enum: ["user", "admin"],
        default: "user"
    }
});

const UserModel = mongoose.model("users", UserSchema)
module.exports = UserModel;