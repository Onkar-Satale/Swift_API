// import 'dotenv/config';
import express from "express";
import cors from "cors";
import mongoose from "mongoose";
import jwt from "jsonwebtoken";
import axios from "axios";

import authRoutes from "./routes/auth.js";
import userRoutes from "./routes/userRoutes.js";
import historyRoutes from "./routes/history.js";
import User from "./models/User.js";
import genaiRoutes from "./routes/genai.js";


const app = express();
const SECRET = "MY_SECRET_KEY";

mongoose
  .connect("mongodb://127.0.0.1:27017/postman-clone")
  .then(() => console.log("✅ MongoDB connected"))
  .catch((err) => console.error("❌ MongoDB error:", err));


// -----------------------------
// Middleware
// -----------------------------
app.use(cors());
app.use(express.json({ limit: "50mb" }));

// -----------------------------
// Base route
// -----------------------------
app.get("/", (req, res) => res.send("Backend is running..."));

// -----------------------------
// Proxy API request and save history
// -----------------------------
app.post("/api/request", async (req, res) => {
  try {
    // NEW: use a custom header for backend auth
    let userId = null;

    // ✅ Try x-backend-token first, fallback to Authorization header
    const backendToken = req.headers['x-backend-token'] || req.headers['authorization']?.split(' ')[1];

    if (backendToken) {
      try {
        const decoded = jwt.verify(backendToken, SECRET);
        userId = decoded.userId || decoded.id;
        console.log("Decoded userId for history:", userId);
      } catch (err) {
        console.warn("Invalid token, proceeding as guest");
      }
    }



    const { url, method, headers, body } = req.body;
    if (!url || !method)
      return res.status(400).json({ error: "URL and Method are required" });

    const start = Date.now();
    let apiResponse;

    try {
      const axiosConfig = {
        url,
        method,
        headers: headers || {},
      };

      // ONLY attach body for these methods
      if (["POST", "PUT", "PATCH", "DELETE"].includes(method)) {
        axiosConfig.data = body || {};
      }

      apiResponse = await axios(axiosConfig);


    } catch (err) {
      apiResponse = err.response || { status: "ERR", data: {} };
    }

    const duration = Date.now() - start;

    // Save history in DB only if user is logged in
    if (userId) {
      await User.findByIdAndUpdate(userId, {
        $push: {
          history: {
            url,
            method,
            status: apiResponse.status || "ERR",
            duration,
            responseBody: apiResponse.data || {},
            time: new Date(),
          },
        },
      });
      console.log("Saved history for user:", userId, url);
    }

    res.json({
      success: true,
      status: apiResponse.status || "ERR",
      body: apiResponse.data || {},
      duration,
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message, duration: 0 });
  }
});

// -----------------------------
// Routes
// -----------------------------
app.use("/api/auth", authRoutes);
app.use("/api/user", userRoutes);
app.use("/api/history", historyRoutes);

// -----------------------------
// Start server
// -----------------------------
const PORT = 5000;
app.listen(PORT, () => console.log(`✅ Server running on port ${PORT}`));
