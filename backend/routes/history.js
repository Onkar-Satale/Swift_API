// routes/history.js
import express from "express";
import jwt from "jsonwebtoken";
import User from "../models/User.js";

const router = express.Router();
const SECRET = "MY_SECRET_KEY";

// Middleware to verify JWT token
const verifyToken = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ error: "Unauthorized: Missing token" });
    }

    const token = authHeader.split(" ")[1];
    const decoded = jwt.verify(token, SECRET);

    // Support both 'userId' and 'id' in token payload
    req.userId = decoded.userId || decoded.id;
    if (!req.userId) {
      console.error("Token decoded but no userId found:", decoded);
      return res.status(401).json({ error: "Unauthorized: Invalid token payload" });
    }

    next();
  } catch (err) {
    console.error("JWT verification error:", err.message);
    return res.status(401).json({ error: "Unauthorized: Invalid token" });
  }
};

// GET: Fetch all user history
router.get("/", verifyToken, async (req, res) => {
  try {
    console.log("Fetching history for user:", req.userId);

    const user = await User.findById(req.userId);
    if (!user) {
      console.warn("User not found for ID:", req.userId);
      return res.status(404).json({ error: "User not found" });
    }

    // Ensure history is always an array
    const history = Array.isArray(user.history) ? user.history.slice().reverse() : [];
    console.log("Fetched history length:", history.length);

    res.json(history);
  } catch (err) {
    console.error("Error fetching history:", err.message);
    res.status(500).json({ error: "Server error fetching history" });
  }
});

// DELETE: Delete single history item by ID
router.delete("/:historyId", verifyToken, async (req, res) => {
  try {
    const { historyId } = req.params;

    const result = await User.findByIdAndUpdate(req.userId, {
      $pull: { history: { _id: historyId } },
    });

    if (!result) return res.status(404).json({ error: "User not found" });
    res.json({ success: true });
  } catch (err) {
    console.error("Error deleting history item:", err.message);
    res.status(500).json({ error: "Server error deleting history item" });
  }
});

// PUT: Clear all history
router.put("/clear", verifyToken, async (req, res) => {
  try {
    const result = await User.findByIdAndUpdate(req.userId, { $set: { history: [] } });

    if (!result) return res.status(404).json({ error: "User not found" });
    res.json({ success: true });
  } catch (err) {
    console.error("Error clearing history:", err.message);
    res.status(500).json({ error: "Server error clearing history" });
  }
});

export default router;
