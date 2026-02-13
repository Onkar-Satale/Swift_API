import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import PostmanClone from "./components/PostmanClone";
import AccountPage from "./components/AccountPage";
import LoginPage from "./components/LoginPage";
import Signup from "./components/Signup";
import ProtectedRoute from "./components/ProtectedRoute";
import Documentation from "./components/Documentation";
import ContactSupport from "./components/ContactSupport";
import { useState, useEffect } from "react";
import { RequestContext } from "./context/RequestContext";
import { getToken } from "./services/authService";
import { PostmanProvider } from "./context/PostmanContext"; // 🔹 add this


export default function App() {
  const [requestCount, setRequestCount] = useState(0);
  const [currentUserId, setCurrentUserId] = useState(null);

  // Load requestCount per user
  useEffect(() => {
    const token = getToken();
    if (!token) {
      setRequestCount(0);
      setCurrentUserId(null);
      return;
    }

    const savedUserId = localStorage.getItem("currentUserId");
    if (savedUserId) {
      setCurrentUserId(savedUserId);
      const savedCount = localStorage.getItem(`requestCount_${savedUserId}`);
      setRequestCount(savedCount ? parseInt(savedCount) : 0);
    }
  }, []);

  // Save requestCount per user whenever it changes
  useEffect(() => {
    if (currentUserId) {
      localStorage.setItem(`requestCount_${currentUserId}`, requestCount);
    }
  }, [requestCount, currentUserId]);

  return (
    <RequestContext.Provider value={{ requestCount, setRequestCount, setCurrentUserId }}>
      <PostmanProvider>  {/* 🔹 wrap here */}

        <Router>
          <Routes>
            {/* Public routes */}
            <Route path="/" element={<PostmanClone />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/signup" element={<Signup />} />
            <Route path="/documentation" element={<Documentation />} />
            <Route path="/contact-support" element={<ContactSupport />} />

            {/* Protected routes */}
            <Route
              path="/account"
              element={
                <ProtectedRoute>
                  <AccountPage />
                </ProtectedRoute>
              }
            />
          </Routes>
        </Router>
      </PostmanProvider>

    </RequestContext.Provider>
  );
}
