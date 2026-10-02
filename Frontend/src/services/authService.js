const API_URL = `${process.env.REACT_APP_BACKEND_URL}/api`;

// Signup user
export const signup = async ({ firstName, lastName, email, password }) => {
  const res = await fetch(`${API_URL}/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify({ firstName, lastName, email, password }),
  });
  return res.json();
};

// Login user
export const login = async ({ email, password }) => {
  const res = await fetch(`${API_URL}/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify({ email, password }),
  });
  return res.json();
};

// Save auth token and userId along with profile details
export const saveAuthData = ({ token, email, firstName, lastName, createdAt }) => {
  localStorage.setItem("authToken", token);
  try {
    const payload = JSON.parse(atob(token.split(".")[1]));
    const userId = payload.userId || payload.id || payload._id;
    if (userId) {
      localStorage.setItem("userId", userId);
    }
  } catch (e) {
    // Ignore decoding issues
  }
  const fullName = lastName ? `${firstName} ${lastName}`.trim() : (firstName || "");
  localStorage.setItem("username", fullName);
  localStorage.setItem("email", email || "");
  if (createdAt) {
    localStorage.setItem("createdAt", createdAt);
  }
};

// Get token
export const getToken = () => localStorage.getItem("authToken");

// Get userId
export const getUserId = () => localStorage.getItem("userId");

// In-flight refresh token promise mutex
let refreshPromise = null;

// Silent refresh token handler
export const refreshAuthToken = async () => {
  if (refreshPromise) return refreshPromise;

  refreshPromise = (async () => {
    try {
      const res = await fetch(`${API_URL}/refresh-token`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
      });

      if (!res.ok) {
        return null;
      }

      const data = await res.json();
      if (data.success && data.token) {
        localStorage.setItem("authToken", data.token);
        if (data.userId) {
          localStorage.setItem("userId", data.userId);
        }
        return data.token;
      }
      return null;
    } catch (err) {
      return null;
    } finally {
      refreshPromise = null;
    }
  })();

  return refreshPromise;
};

// Authenticated fetch wrapper with automatic JWT injection & silent 401 refresh-retry
export const authFetch = async (url, options = {}) => {
  let token = getToken();

  const headers = {
    ...(options.headers || {}),
  };

  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const fetchOptions = {
    ...options,
    headers,
    credentials: "include",
  };

  let res = await fetch(url, fetchOptions);

  // If 401 Unauthorized, try refreshing access token once and retrying
  if (res.status === 401) {
    const newToken = await refreshAuthToken();
    if (newToken) {
      fetchOptions.headers["Authorization"] = `Bearer ${newToken}`;
      res = await fetch(url, fetchOptions);
    }
  }

  return res;
};

// Logout
export const logout = () => {
  // Fire-and-forget backend logout request to clear HTTPOnly cookie and DB token
  fetch(`${API_URL}/logout`, { method: "POST", credentials: "include" }).catch(() => {});
  
  localStorage.removeItem("authToken");
  localStorage.removeItem("userId");
  localStorage.removeItem("username");
  localStorage.removeItem("email");
  localStorage.removeItem("createdAt");
  sessionStorage.removeItem("swiftApiState");
  sessionStorage.removeItem("postmanCloneState");
  sessionStorage.removeItem("lastRequest");
  sessionStorage.removeItem("lastResponse");
  sessionStorage.removeItem("activePanel");
  sessionStorage.removeItem("showBot");
};
