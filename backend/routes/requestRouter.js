import express from "express";
import axios from "axios";
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

// POST proxy request and save history
router.post("/", authenticate, async (req, res) => {
  try {
    const { url, method, headers, params, body } = req.body;

    if (!url || !method) {
      return res.status(400).json({ status: 400, body: { error: "URL and Method are required" } });
    }

    const start = Date.now();

    // // Send actual API request
    // let apiResponse;
    // try {
    //   apiResponse = await axios({
    //     url,
    //     method,
    //     headers: headersObj,
    //     params: params || {},
    //     data: body || {},
    //     validateStatus: () => true, // allow non-2xx responses
    //   });
    // } catch (err) {
    //   apiResponse = err.response || { status: 500, data: { error: err.message } };
    // }
    // Convert headers array to object
    // Convert headers array to object
    // Convert headers array to object

    // USE HEADERS OBJECT DIRECTLY (from frontend)
    const headersObj = headers && typeof headers === "object" ? headers : {};

    // DO NOT override Authorization coming from auth tab
    console.log("Forwarding headers to target API:", headersObj);



    // Send actual API request
    // Ensure headers is always an object
    const headersFinal = headers && typeof headers === "object" ? headers : {};

    // Prepare Axios config
    const axiosConfig = {
      url,
      method: method.toUpperCase(),
      headers: headersFinal,
      validateStatus: () => true, // allow non-2xx responses
    };

    // Only attach body for methods that support it
    if (["POST", "PUT", "PATCH", "DELETE"].includes(method.toUpperCase())) {
      axiosConfig.data = body || {};
    }

    // Only attach query params for GET or if provided
    if (method.toUpperCase() === "GET" && params && typeof params === "object") {
      axiosConfig.params = params;
    }

    let apiResponse;
    try {
      console.log("Sending request to target API with headers:", headersFinal);
      apiResponse = await axios(axiosConfig);
    } catch (err) {
      apiResponse = err.response || { status: 500, data: { error: err.message } };
    }







    const duration = Date.now() - start;

    const responseData = {
      status: apiResponse.status,
      headers: apiResponse.headers || {},
      body: apiResponse.data || {},
    };

    // Save request to user history
    const historyEntry = {
      method,
      url,
      status: apiResponse.status,
      duration,
      responseBody: apiResponse.data || {},
      time: new Date(),
    };

    // Save request to user history AND increment reqCount
    await User.findByIdAndUpdate(req.userId, {
      $push: { history: historyEntry },
      $inc: { reqCount: 1 } // increments user's request count
    });

    res.json({
      success: true,
      ...responseData,
      duration,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
      duration: 0,
    });
  }
});

export default router;
