export async function sendRequest({ url, method, headers = {}, params = {}, body = null }) {
  try {
    const token = localStorage.getItem("authToken"); // ✅ include token

    const response = await fetch("/api/request", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: token ? `Bearer ${token}` : "",
      },
      body: JSON.stringify({ url, method, headers, params, body }),
    });

    if (!response.ok) {
      const errData = await response.json();
      throw new Error(errData.error || "Request failed");
    }

    return await response.json();
  } catch (error) {
    console.error("sendRequest error:", error);
    return { success: false, error: error.message };
  }
}
