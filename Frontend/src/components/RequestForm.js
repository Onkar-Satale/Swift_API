import React, { useState, useEffect } from "react";
import axios from "axios";
import ResponseDisplay from "./ResponseDisplay";
import CodeEditor from "./CodeEditor";
import { getToken } from "../services/authService";

const RequestForm = () => {
  const [url, setUrl] = useState("");
  const [method, setMethod] = useState("GET");
  const [body, setBody] = useState("");
  const [response, setResponse] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const token = getToken();

  // Restore last request and response on mount
  useEffect(() => {
    const saved = localStorage.getItem("lastRequest");
    if (saved) {
      const parsed = JSON.parse(saved);
      setUrl(parsed.url || "");
      setMethod(parsed.method || "GET");
      setBody(parsed.body || "");
      setResponse(parsed.response || null);
    }

    if (!token) {
      setError("You must be logged in to send requests.");
    }
  }, [token]);

  const sendRequest = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    if (!token) {
      setError("You must be logged in to send requests.");
      setLoading(false);
      return;
    }

    let parsedBody = null;
    if (method !== "GET" && body) {
      try {
        parsedBody = JSON.parse(body);
      } catch {
        setError("Invalid JSON in request body.");
        setLoading(false);
        return;
      }
    }

    try {
      const res = await axios.post(
        "http://localhost:5000/api/request",
        { url, method, body: parsedBody },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setResponse(res.data);

      // Save last request + response to localStorage
      localStorage.setItem(
        "lastRequest",
        JSON.stringify({
          url,
          method,
          body,
          response: res.data,
        })
      );
    } catch (err) {
      setError(err.response?.data?.error || err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-4 border rounded-2xl shadow bg-white dark:bg-gray-800">
      {error && <p className="text-red-500 font-semibold mb-3">{error}</p>}
      <form onSubmit={sendRequest}>
        <div className="mb-3">
          <label>URL:</label>
          <input
            type="text"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            required
          />
        </div>
        <div className="mb-3">
          <label>Method:</label>
          <select value={method} onChange={(e) => setMethod(e.target.value)}>
            <option>GET</option>
            <option>POST</option>
            <option>PUT</option>
            <option>DELETE</option>
          </select>
        </div>
        {method !== "GET" && (
          <div className="mb-3">
            <label>Body (JSON):</label>
            <CodeEditor value={body} onChange={setBody} />
          </div>
        )}
        <button type="submit" disabled={loading || !token}>
          {loading ? "Sending..." : "Send Request"}
        </button>
      </form>

      {/* Last request */}
      {(url || body) && (
        <div className="mt-4">
          <h3 className="font-bold mb-2">Last Request</h3>
          <p>
            <strong>{method}</strong> {url}
          </p>
          {body && <pre className="text-sm">{body}</pre>}
        </div>
      )}

      {/* Last response */}
      {response && <ResponseDisplay response={response} />}
    </div>
  );
};

export default RequestForm;
