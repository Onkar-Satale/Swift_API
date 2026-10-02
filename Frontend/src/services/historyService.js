import { authFetch } from "./authService";

const HISTORY_API = `${process.env.REACT_APP_BACKEND_URL}/api/history`;

export const getHistory = async () => {
  try {
    const res = await authFetch(`${HISTORY_API}?t=${Date.now()}`, {
      cache: "no-store",
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
    const res = await authFetch(HISTORY_API, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
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
    const res = await authFetch(`${HISTORY_API}/${historyId}`, {
      method: "DELETE",
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
    const res = await authFetch(`${HISTORY_API}/clear`, {
      method: "PUT",
    });

    if (!res.ok) throw new Error("Failed to clear history");
    return await res.json();
  } catch (err) {
    console.error("clearHistory error:", err);
    return { success: false, error: err.message };
  }
};
