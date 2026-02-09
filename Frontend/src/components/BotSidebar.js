import { useState, useRef, useEffect } from "react";
import "./BotSidebar.css";

export default function BotSidebar({
  onClose,
  messages,
  setMessages,

  // 🔹 ADDED (does NOT break existing usage)
  // Pass latest API request/response from Home page
  currentApiContext = null,
  setHeadersObj = null,    // 🔹 new
  setActiveTab = null      // 🔹 optional, to switch tab automatically
}) {

  const [input, setInput] = useState("");
  const [showPanel, setShowPanel] = useState(false);
  const panelRef = useRef(null);
  const botBodyRef = useRef(null);
  const [copiedIndex, setCopiedIndex] = useState(null);



  /* ===============================
     🔹 LOCAL (NO LLM) FEATURE LOGIC
     =============================== */

  const generateCurl = () => {
    return `curl -X ${getMethod()} "${getUrl()}" \\
-H "Authorization: Bearer <token>" \\
-H "Content-Type: application/json"`;
  };

  const formatCurlForDisplay = (curlText) => {
    const lines = curlText.split("\\\n");

    const methodAndUrl = lines[0]
      .replace("curl -X ", "")
      .replace(/"/g, "");

    const headers = lines
      .slice(1)
      .map(line =>
        line
          .replace("-H ", "")
          .replace(/"/g, "")
          .trim()
      );

    return `${methodAndUrl}\n\n${headers.join("\n")}`;
  };



  const autoFillHeaders = () => {
    return [
      "Authorization: Bearer <token>",
      "Content-Type: application/json",
      "Accept: application/json",
      "User-Agent: Postman-Clone"
    ].join("\n");
  };

  const severityBadge = (status = 500) => {
    if (status >= 200 && status < 300) {
      return "🟢 Severity: LOW (Success) — Your request was successful! Everything worked as expected, and the server returned the data you asked for.";
    }
    if (status >= 400 && status < 500) {
      return "🟡 Severity: MEDIUM (Client Error) — There was an issue with your request. Check the URL, headers, or body you sent. You may need to correct something before trying again.";
    }
    if (status >= 500 && status < 600) {
      return "🔴 Severity: HIGH (Server Error) — Something went wrong on the server. This is usually not your fault. You can try again later or contact the server admin if the problem persists.";
    }
    return "⚪ Unknown Status — The server returned an unexpected response. Double-check your request or try again later.";
  };

  const responseTimeInsight = (ms = 850) => {
    if (ms < 300) {
      return `⚡ Fast Response (${ms} ms) — Excellent! The server responded very quickly, ensuring smooth performance for your requests.`;
    }
    if (ms < 1000) {
      return `⏱️ Moderate Response (${ms} ms) — Decent speed. The server responded reasonably fast, but there might be room for improvement if performance is critical.`;
    }
    return `🐢 Slow Response (${ms} ms) — The server is taking longer than expected. Consider optimizing your request, checking server load, or reviewing network conditions to improve speed.`;
  };


  const statusCodeEducator = (code = 500) => {
    const map = {
      // 2xx Success
      200: "OK – Your request was successful and the server returned the requested data.",
      201: "Created – Your request was successful, and a new resource has been created.",
      202: "Accepted – Request received but not yet processed. The server will process it asynchronously.",
      204: "No Content – Request successful, but there is no data to return.",

      // 3xx Redirection
      301: "Moved Permanently – The resource has moved to a new URL. Update your request if needed.",
      302: "Found / Temporary Redirect – The resource is temporarily at a different URL.",
      304: "Not Modified – The resource has not changed since the last request.",

      // 4xx Client Errors
      400: "Bad Request – The server could not understand your request. Check the URL, headers, or body.",
      401: "Unauthorized – Authentication required or invalid credentials.",
      403: "Forbidden – You do not have permission to access this resource.",
      404: "Not Found – The requested resource or endpoint does not exist.",
      405: "Method Not Allowed – The HTTP method used is not supported for this endpoint.",
      408: "Request Timeout – The server timed out waiting for your request.",
      429: "Too Many Requests – You have sent too many requests in a short time. Try again later.",

      // 5xx Server Errors
      500: "Internal Server Error – The server encountered an unexpected error. Usually not your fault.",
      501: "Not Implemented – The server does not support this functionality yet.",
      502: "Bad Gateway – The server received an invalid response from an upstream server.",
      503: "Service Unavailable – The server is currently overloaded or down. Try again later.",
      504: "Gateway Timeout – The server did not get a response in time from an upstream server.",
      505: "HTTP Version Not Supported – The server does not support the HTTP protocol version used.",
    };

    return `📘 Status ${code}: ${map[code] || "Unknown status code – The server returned an unrecognized response. Double-check your request or try again later."}`;
  };


  /* ===============================
     🔹 SEND TO BACKEND (ENHANCED, NOT CHANGED)
     =============================== */

  const handleSend = async () => {
    if (!input.trim()) return;

    const userMessage = { from: "user", text: input };
    setMessages((prev) => [...prev, userMessage]);
    setInput("");

    try {
      const response = await fetch("http://localhost:8001/bot", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: "user123",
          message: input,

          // 🔹 ADDED: recent API context for smarter answers
          currentApiContext: currentApiContext,

          // existing placeholder (unchanged)
          requestHistory: []
        })
      });

      const data = await response.json();

      let botMessage = "";

      if (data.type === "root_cause") {
        botMessage = `Root Cause:\n${data.rootCause}\n\nFix Steps:\n- ${data.fixSteps.join("\n- ")}`;
      } else if (data.type === "workflow") {
        botMessage = `Workflow Steps:\n- ${data.steps.join("\n- ")}`;
      } else if (data.type === "contract_drift") {
        botMessage = `Contract Alerts:\n- ${data.alerts.join("\n- ")}`;
      } else {
        botMessage = data.text || "Got it!";
      }

      setMessages((prev) => [...prev, { from: "bot", text: botMessage }]);
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        { from: "bot", text: "❌ Failed to reach AI bot. Try again." }
      ]);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter") handleSend();
  };


  // 🔹 READ LIVE DATA FROM HOME PAGE (SAFE FALLBACKS)
  const getStatusCode = () => currentApiContext?.status ?? 500;
  const getResponseTime = () => currentApiContext?.responseTime ?? 850;
  const getUrl = () => currentApiContext?.url ?? "https://api.example.com/users";
  const getMethod = () => currentApiContext?.method ?? "GET";

  /* ===============================
     🔹 PANEL BUTTON HANDLER (UNCHANGED)
     =============================== */

  const handleOptionClick = (action) => {
    let output = "";

    switch (action) {
      case "Copy cURL":
        setMessages((prev) => [
          ...prev,
          {
            from: "bot",
            type: "curl",
            text: generateCurl()
          }
        ]);
        setShowPanel(false);
        return;

        break;

      case "Auto-fill Headers":
        if (setHeadersObj) {
          setHeadersObj([
            { key: "Authorization", value: "Bearer <token>" },
            { key: "Content-Type", value: "application/json" },
            { key: "Accept", value: "application/json" },
            { key: "User-Agent", value: "SWIFT_API" },
            { key: "", value: "" } // always keep one empty row
          ]);
        }

        if (setActiveTab) {
          setActiveTab("Headers"); // optional: switch tab
        }

        output = "✅ Headers auto-filled in Headers tab. You can remove ❌ or modify 📝 any header if not needed.";
        break;



      case "Severity Badge":
        output = severityBadge(getStatusCode());
        break;

      case "Response Time Insight":
        output = responseTimeInsight(getResponseTime());
        break;

      case "Status Code Educator":
        output = statusCodeEducator(getStatusCode());
        break;


      default:
        setInput(action);
        handleSend();
        setShowPanel(false);
        return;
    }

    setMessages((prev) => [...prev, { from: "bot", text: output }]);
    setShowPanel(false);
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (panelRef.current && !panelRef.current.contains(event.target)) {
        setShowPanel(false);
      }
    };
    if (showPanel) document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [showPanel]);

  return (
    <div className="bot-sidebar">
      {/* HEADER */}
      <div className="bot-header">
        <div className="bot-header-left">
          <div className="panel-toggle" onClick={() => setShowPanel(!showPanel)}>
            <span></span>
            <span></span>
            <span></span>
          </div>
          <h3 style={{ color: "#ff8912", fontWeight: "bold" }}>J.A.R.V.I.S.</h3>
        </div>
        <button className="close-btn" onClick={onClose}>✖</button>
      </div>

      {/* PANEL */}
      <div ref={panelRef} className={`bot-panel ${showPanel ? "open" : ""}`}>
        <h4>Tools & Actions</h4>
        <button onClick={() => handleOptionClick("Root-Cause Analysis")}>Root-Cause Analysis</button>
        <button onClick={() => handleOptionClick("Generate Workflow")}>Generate Workflow</button>
        <button onClick={() => handleOptionClick("Contract Drift Check")}>Contract Drift Check</button>

        <hr />

        <button onClick={() => handleOptionClick("Copy cURL")}>Copy cURL</button>
        <button onClick={() => handleOptionClick("Auto-fill Headers")}>Auto-fill Headers</button>
        <button onClick={() => handleOptionClick("Severity Badge")}>Severity Badge</button>
        <button onClick={() => handleOptionClick("Response Time Insight")}>Response Time Insight</button>
        <button onClick={() => handleOptionClick("Status Code Educator")}>Status Code Educator</button>
      </div>

      {/* CHAT */}
      <div className="bot-body" ref={botBodyRef}>
        {messages.map((msg, i) => (
          <div key={i} className={`bot-message ${msg.from}`}>

            {/* 🔹 cURL MESSAGE */}
            {msg.type === "curl" ? (
              <div className="curl-box">
                <pre>{formatCurlForDisplay(msg.text)}</pre>
                <button
                  className="copy-btn2"
                  onClick={() => {
                    const match = msg.text.match(/"(https?:\/\/[^"]+)"/);
                    if (match) {
                      navigator.clipboard.writeText(match[1]);
                      setCopiedIndex(i); // mark this message as copied

                      // reset after 2 seconds
                      setTimeout(() => setCopiedIndex(null), 2100);
                    }
                  }}
                >
                  {copiedIndex === i ? "Copied!" : "Copy URL"}
                </button>

              </div>
            ) : (
              msg.text.split("\n").map((line, idx) => (
                <div key={idx}>{line}</div>
              ))
            )}

          </div>
        ))}
      </div>


      {/* INPUT */}
      <div className="bot-footer">
        <input
          type="text"
          placeholder="Ask something..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyPress}
        />
        <button onClick={handleSend}>Send</button>
      </div>
    </div>

  );

}
