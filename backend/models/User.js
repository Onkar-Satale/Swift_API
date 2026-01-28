import mongoose from "mongoose";
import crypto from "crypto";

// ---------------------------
// History Schema
// ---------------------------
const historySchema = new mongoose.Schema(
  {
    method: String,
    url: String,
    status: String,
    duration: Number,
    time: { type: Date, default: Date.now },
    requestBody: { type: Object, default: {} },
    responseBody: { type: Object, default: {} },
  },
  { _id: true }
);

// ---------------------------
// User Schema
// ---------------------------
const userSchema = new mongoose.Schema(
  {
    username: { type: String, required: true, unique: true },
    email: { type: String, required: true, unique: true },
    password: { type: String }, // optional
    reqCount: { type: Number, default: 0 }, // <-- add this
    hash: String,
    salt: String,
    history: { type: [historySchema], default: [] },
  },
  { timestamps: true }
);

// ---------------------------
// Crypto-based password methods
// ---------------------------
userSchema.methods.setPassword = function (password) {
  this.salt = crypto.randomBytes(16).toString("hex");
  this.hash = crypto
    .pbkdf2Sync(password, this.salt, 1000, 64, "sha512")
    .toString("hex");
};

userSchema.methods.validatePassword = function (password) {
  const hash = crypto
    .pbkdf2Sync(password, this.salt, 1000, 64, "sha512")
    .toString("hex");
  return this.hash === hash;
};

export default mongoose.model("User", userSchema);
