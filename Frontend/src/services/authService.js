const API_URL = "http://localhost:5000/api/auth";

// Signup user
export const signup = async ({ username, email, password }) => {
  const res = await fetch(`${API_URL}/signup`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username, email, password }),
  });
  return res.json();
};

// Login user
export const login = async ({ email, password }) => {
  const res = await fetch(`${API_URL}/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
  return res.json();
};

// Save auth token and userId
export const saveAuthData = ({ token, userId }) => {
  localStorage.setItem("authToken", token); // ✅ key corrected
  localStorage.setItem("userId", userId);
};

// Get token
export const getToken = () => localStorage.getItem("authToken");

// Get userId
export const getUserId = () => localStorage.getItem("userId");

// Logout
export const logout = () => {
  localStorage.removeItem("authToken");
  localStorage.removeItem("userId");
};
