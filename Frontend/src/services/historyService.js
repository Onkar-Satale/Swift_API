const HISTORY_API = "http://localhost:5000/api/history";

// GET all history
export const getHistory = async () => {
  try {
    const token = localStorage.getItem("authToken"); // ✅ corrected
    if (!token) return [];

    const res = await fetch(HISTORY_API, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!res.ok) throw new Error(`Failed to fetch history: ${res.status}`);
    return await res.json();
  } catch (err) {
    console.error("getHistory error:", err);
    return [];
  }
};

// Save a new history entry
export const saveHistory = async (entry) => {
  try {
    const token = localStorage.getItem("authToken"); // ✅ corrected
    if (!token) return { success: false, error: "User not logged in" };

    const res = await fetch(HISTORY_API, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(entry),
    });

    if (!res.ok) throw new Error("Failed to save history");
    return await res.json();
  } catch (err) {
    console.error("saveHistory error:", err);
    return { success: false, error: err.message };
  }
};

// Delete a single history item
export const deleteHistoryItem = async (historyId) => {
  try {
    const token = localStorage.getItem("authToken"); // ✅ corrected
    if (!token) return { success: false, error: "User not logged in" };

    const res = await fetch(`${HISTORY_API}/${historyId}`, {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!res.ok) throw new Error("Failed to delete history item");
    return await res.json();
  } catch (err) {
    console.error("deleteHistoryItem error:", err);
    return { success: false, error: err.message };
  }
};

// Clear all history
export const clearHistory = async () => {
  try {
    const token = localStorage.getItem("authToken"); // ✅ corrected
    if (!token) return { success: false, error: "User not logged in" };

    const res = await fetch(`${HISTORY_API}/clear`, {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!res.ok) throw new Error("Failed to clear history");
    return await res.json();
  } catch (err) {
    console.error("clearHistory error:", err);
    return { success: false, error: err.message };
  }
};
