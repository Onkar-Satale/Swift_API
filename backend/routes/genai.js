import express from "express";
import axios from "axios";

const router = express.Router();

// POST → send request+response to GenAI (FastAPI)
router.post("/analyze", async (req, res) => {
  try {
    const {
      method,
      url,
      headers,
      body,
      status,
      response,
    } = req.body;

    // Call Python FastAPI
    const aiRes = await axios.post(
      "http://localhost:8001/analyze",
      {
        method,
        url,
        headers,
        body,
        status,
        response,
      }
    );

    res.json({ success: true, ai: aiRes.data });
  } catch (err) {
    console.error("GenAI service error:", err.message);
    res.status(500).json({
      success: false,
      ai: {
        diagnosis: "GenAI service unavailable",
        fix: "Check FastAPI server",
        tests: [],
      },
    });
  }
});

export default router;
