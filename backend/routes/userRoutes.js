import express from "express";
import jwt from "jsonwebtoken";
import User from "../models/User.js";

const router = express.Router();
const SECRET = "MY_SECRET_KEY";

// Middleware to authenticate user
const authenticate = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ error: "Unauthorized: Token missing" });
    }

    const token = authHeader.split(" ")[1];
    const decoded = jwt.verify(token, SECRET);
    req.userId = decoded.userId;
    next();
  } catch (err) {
    return res.status(401).json({ error: "Invalid token" });
  }
};

// ✅ Add a new history entry
router.post("/", authenticate, async (req, res) => {
  try {
    const { method, url, status, duration, responseBody } = req.body;

    if (!method || !url) {
      return res.status(400).json({ error: "method and url are required" });
    }

    const historyEntry = {
      method,
      url,
      status: status || null,
      duration: duration || null,
      responseBody: responseBody || {},
      time: new Date(),
    };

    await User.findByIdAndUpdate(req.userId, { $push: { history: historyEntry } });

    res.status(200).json({ message: "History updated successfully", entry: historyEntry });
  } catch (err) {
    console.error("Error saving history:", err);
    res.status(500).json({ error: err.message });
  }
});

// ✅ Fetch user history
router.get("/", authenticate, async (req, res) => {
  try {
    const user = await User.findById(req.userId, "history");
    if (!user) return res.status(404).json({ error: "User not found" });

    // Return history sorted by newest first
    const sortedHistory = user.history.sort((a, b) => b.time - a.time);
    res.json(sortedHistory);
  } catch (err) {
    console.error("Error fetching history:", err);
    res.status(500).json({ error: err.message });
  }
});

// ✅ Clear user history
router.put("/clear", authenticate, async (req, res) => {
  try {
    await User.findByIdAndUpdate(req.userId, { $set: { history: [] } });
    res.json({ message: "History cleared successfully" });
  } catch (err) {
    console.error("Error clearing history:", err);
    res.status(500).json({ error: err.message });
  }
});

// ✅ Delete a single history item
router.delete("/:historyId", authenticate, async (req, res) => {
  try {
    const { historyId } = req.params;
    await User.findByIdAndUpdate(req.userId, {
      $pull: { history: { _id: historyId } },
    });
    res.json({ message: "History item deleted successfully" });
  } catch (err) {
    console.error("Error deleting history item:", err);
    res.status(500).json({ error: err.message });
  }
});

export default router;
