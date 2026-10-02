import { useState, useRef, useEffect, useContext } from "react";
import "./BotSidebar.css";
import { SwiftAPIContext } from "../context/SwiftAPIContext";
import { showToast } from "../utils/toast";
import { authFetch } from "../services/authService";


export default function BotSidebar({
  onClose,
  // messages,
  // setMessages,

  // 🔹 ADDED (does NOT break existing usage)
  // Pass latest API request/response from Home page
  currentApiContext = null,
  setHeadersObj = null,    // 🔹 new
  setActiveTab = null,     // 🔹 optional, to switch tab automatically
  setShowBot // 🔹 ADD THIS
}) {

  const [input, setInput] = useState("");
  const [showPanel, setShowPanel] = useState(false);
  const panelRef = useRef(null);
  const botBodyRef = useRef(null);
  const [copiedIndex, setCopiedIndex] = useState(null);
  const [featureLoading, setFeatureLoading] = useState(false);
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const { messages, setMessages } = useContext(SwiftAPIContext);

  const handleClearBot = () => {
    setMessages([
      { from: "bot", text: "Hi 👋 I’m your J.A.R.V.I.S. API assistant! You can ask me questions about API testing, HTTP protocols, headers, status codes, or request structures. ⚠️ Please note that I only answer questions related to API testing and development." }
    ]);
    setShowClearConfirm(false);
    showToast("🤖 Chat bot cleared!");
  };

  useEffect(() => {
    if (botBodyRef.current) {
      botBodyRef.current.scrollTo({
        top: botBodyRef.current.scrollHeight,
        behavior: "smooth",
      });
    }
  }, [messages]);


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
      .replace(/"/g, "")
      .trim();

    const parts = methodAndUrl.split(" ");
    const methodText = parts[0] || "GET";
    const urlText = parts.slice(1).join(" ") || "";

    const headers = lines
      .slice(1)
      .map(line =>
        line
          .replace("-H ", "")
          .replace(/"/g, "")
          .trim()
      );

    const getMethodColor = (m) => {
      const upper = m.toUpperCase();
      if (upper === "GET") return "#22c55e";    // green
      if (upper === "POST") return "#3b82f6";   // blue
      if (upper === "PUT") return "#eab308";    // yellow
      if (upper === "DELETE") return "#ef4444"; // red
      return "var(--terminal-purple)";          // fallback
    };

    return (
      <>
        <span className="curl-method" style={{ color: getMethodColor(methodText), fontWeight: "bold" }}>{methodText}</span>{" "}
        <span className="curl-url" style={{ color: "var(--terminal-orange)" }}>{urlText}</span>
        {"\n\n"}
        <span className="curl-headers" style={{ color: "var(--terminal-text-dim)" }}>{headers.join("\n")}</span>
      </>
    );
  };



  // const autoFillHeaders = () => {
  //   return [
  //     "Authorization: Bearer <token>",
  //     "Content-Type: application/json",
  //     "Accept: application/json",
  //     "User-Agent: Swift-API"
  //   ].join("\n");
  // };

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
    const userQuery = input.trim();
    if (!userQuery) return;

    const userMessage = { from: "user", text: userQuery };
    setMessages((prev) => [
      ...prev,
      userMessage,
      { from: "bot", text: "Thinking...", isTemp: true }
    ]);
    setInput("");

    try {
      const backendUrl = process.env.REACT_APP_BACKEND_URL;

      const response = await authFetch(`${backendUrl}/api/ai/bot`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          userId: "user123", // the backend will overwrite this securely based on the token
          message: userQuery,

          // 🔹 ADDED: recent API context for smarter answers
          currentApiContext: currentApiContext,

          // Map actual message history so the model knows the conversation context
          requestHistory: messages
        })
      });

      const data = await response.json();

      let botMessage = "";

      if (!response.ok) {
        botMessage = `⚠️ Error ${response.status}: ${data.error || data.message || data.detail || JSON.stringify(data)}`;
      } else if (data.type === "root_cause") {
        botMessage = `Root Cause:\n${data.rootCause}\n\nFix Steps:\n- ${data.fixSteps.join("\n- ")}`;
      } else if (data.type === "workflow") {
        botMessage = `Workflow Steps:\n- ${data.steps.join("\n- ")}`;
      } else if (data.type === "contract_drift") {
        botMessage = `Contract Alerts:\n- ${data.alerts.join("\n- ")}`;
      } else {
        botMessage = data.text || "Got it!";
      }

      setMessages((prev) => [
        ...prev.filter(msg => !msg.isTemp),
        { from: "bot", text: botMessage }
      ]);
    } catch (err) {
      setMessages((prev) => [
        ...prev.filter(msg => !msg.isTemp),
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

      case "Smart Error Translator":
        handleAnalyzeFeature("smart_error_translator");
        setShowPanel(false);
        return;



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


  // 🔹 NEW: Call GenAI /analyze endpoint for a specific feature
  const handleAnalyzeFeature = async (feature) => {
    // Validation handled by the parent component Help button

    if (featureLoading) return; // prevent spam clicks
    setShowPanel(false);
    setFeatureLoading(true);
    setMessages(prev => [...prev, { from: "bot", text: "AI is thinking... 🤔", isTemp: true }]);

    const payload = {
      method: currentApiContext.method,
      url: currentApiContext.url,
      headers: currentApiContext.headers,
      body: currentApiContext.body,
      status: currentApiContext.status,
      response: currentApiContext.response
        ? JSON.stringify(currentApiContext.response).slice(0, 2000)
        : "No response body available"
          ? JSON.stringify(currentApiContext.response).slice(0, 2000)
          : "No response body available",
      feature: feature
    };

    try {
      const backendUrl = process.env.REACT_APP_BACKEND_URL;

      const res = await authFetch(`${backendUrl}/api/ai/analyze`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(payload)
      });

      const data = await res.json();

      let textToDisplay = data.text;
      if (!res.ok) {
        textToDisplay = `⚠️ Error ${res.status}: ${data.error || data.message || data.detail || JSON.stringify(data)}`;
      } else if (!textToDisplay) {
        textToDisplay = "⚠️ Explanation unavailable.";
      }

      setMessages(prev => [
        ...prev.filter(msg => !msg.isTemp),
        { from: "bot", text: textToDisplay }
      ]);

    } catch (err) {
      setMessages(prev => [
        ...prev.filter(msg => !msg.isTemp),
        { from: "bot", text: `❌ Error calling ${feature}: ${err.message}` }
      ]);
    } finally {
      setFeatureLoading(false);

    }
  };
  useEffect(() => {
    const handleOutsideClick = (event) => {
      if (!event.target.closest(".bot-sidebar")) {
        setShowBot(false);
      }
    };

    document.addEventListener("mousedown", handleOutsideClick);

    return () => {
      document.removeEventListener("mousedown", handleOutsideClick);
    };
  }, [setShowBot]);




  const token = localStorage.getItem("authToken");

  if (!token) {
    return (
      <div className="bot-sidebar">
        {/* HEADER */}
        <div className="bot-header">
          <div className="bot-header-left">
            <h3 style={{ color: "#ff8810", fontWeight: "bold", margin: 0, whiteSpace: "nowrap" }} className="bot-title">JARVIS is here to HELP !</h3>
          </div>
          <button className="close-btn" onClick={onClose}>✖</button>
        </div>
        <div className="bot-auth-prompt" style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          height: "calc(100% - 60px)",
          padding: "20px",
          textAlign: "center",
          color: "#aaa"
        }}>
          <div style={{ fontSize: "40px", marginBottom: "15px" }}>🔒</div>
          <h4 style={{ color: "#fff", marginBottom: "10px", fontSize: "18px" }}>Authentication Required</h4>
          <p style={{ fontSize: "14px", marginBottom: "20px", lineHeight: "1.5" }}>
            Please log in to chat with J.A.R.V.I.S. and use the AI analysis features.
          </p>
          <a
            href="/login"
            className="login-prompt-btn"
            onClick={() => setShowBot(false)}
            style={{
              display: "inline-block",
              background: "#ff7f00",
              color: "#fff",
              padding: "10px 20px",
              borderRadius: "6px",
              textDecoration: "none",
              fontWeight: "bold",
              fontSize: "14px",
              transition: "background 0.2s"
            }}
          >
            Go to Login
          </a>
        </div>
      </div>
    );
  }

  const parseBotMessage = (text) => {
    if (typeof text !== "string") return null;

    // Split text into parts using '###' as delimiter, preserving the delimiter
    const parts = text.split(/(?=###)/g);
    
    return parts.map((part, index) => {
      const trimmed = part.trim();
      if (!trimmed) return null;
      
      if (trimmed.startsWith("###")) {
        const lines = trimmed.split("\n");
        const heading = lines[0].replace(/###/g, "").trim();
        const body = lines.slice(1).join("\n").trim();
        
        const lowerHeading = heading.toLowerCase();
        const isSpecialHeading = 
          lowerHeading.includes("diagnosis") || 
          lowerHeading.includes("summary") || 
          lowerHeading.includes("suggestion") || 
          lowerHeading.includes("fix") ||
          heading.includes("🧠") ||
          heading.includes("📌") ||
          heading.includes("🚀") ||
          heading.includes("💡");
        
        if (isSpecialHeading) {
          return (
            <div key={index} className="bot-special-section" style={{ marginTop: 10 }}>
              <div className="bot-heading-box">
                {heading}
              </div>
              <div className="bot-text-line" style={{ marginTop: 6 }}>
                {body.split("\n").map((line, idx) => (
                  <div key={idx} style={{ marginTop: idx > 0 ? 4 : 0 }}>
                    {line.replace(/\*\*/g, "")}
                  </div>
                ))}
              </div>
            </div>
          );
        }
        
        return (
          <div key={index} className="bot-general-section" style={{ marginTop: 10 }}>
            <div className="bot-section-title">{heading}</div>
            <div className="bot-text-line" style={{ marginTop: 4 }}>
              {body.split("\n").map((line, idx) => (
                <div key={idx} style={{ marginTop: idx > 0 ? 4 : 0 }}>
                  {line.replace(/\*\*/g, "")}
                </div>
              ))}
            </div>
          </div>
        );
      } else {
        return (
          <div key={index} className="bot-text-plain">
            {trimmed.split("\n").map((line, idx) => (
              <div key={idx} className="bot-text-line" style={{ marginTop: idx > 0 ? 4 : 0 }}>
                {line.replace(/\*\*/g, "")}
              </div>
            ))}
          </div>
        );
      }
    });
  };

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
          <h3 style={{ color: "#ff8810", fontWeight: "bold", margin: 0, whiteSpace: "nowrap" }} className="bot-title">
            JARVIS is here to HELP !
          </h3>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
          <button 
            onClick={() => setShowClearConfirm(true)} 
            className="refresh-btn"
            style={{ background: "none", border: "none", color: "#fff", cursor: "pointer", padding: 0, display: "flex", alignItems: "center" }} 
            title="Refresh/Clear Chat"
          >
            🔄
          </button>
          <button className="close-btn" onClick={onClose} style={{ padding: 0, display: "flex", alignItems: "center" }}>✖</button>
        </div>
      </div>

      {showClearConfirm && (
        <div className="modal-overlay">
          <div className="confirm-modal terminal-modal">
            <div className="modal-title">⚠️ ALERT: REFRESH ASSISTANT</div>
            <div className="modal-body-text">
              Are you sure you want to refresh the assistant? This will clear all current session messages.
            </div>
            <div className="modal-actions">
              <button className="btn-no" onClick={() => setShowClearConfirm(false)}>[ NO, CANCEL ]</button>
              <button className="btn-yes" onClick={handleClearBot}>[ YES, CLEAR ]</button>
            </div>
          </div>
        </div>
      )}

      {/* PANEL */}
      <div ref={panelRef} className={`bot-panel ${showPanel ? "open" : ""}`}>
        <h3>Tools & Actions : </h3>
        <h4>Advance Tools :</h4>
        <button
          onClick={() => handleAnalyzeFeature("root_cause")}
        >
          Root-Cause Analysis
        </button>


        <button
          onClick={() => handleOptionClick("Smart Error Translator")}
        >
          Smart Error Translator
        </button>

        <h4>Basic Tools :</h4>
        <button onClick={() => handleOptionClick("Copy cURL")}>Copy cURL</button>
        <button onClick={() => handleOptionClick("Auto-fill Headers")}>Auto-fill Headers</button>
        <button onClick={() => handleOptionClick("Severity Badge")}>Severity Badge</button>
        <button onClick={() => handleOptionClick("Response Time Insight")}>Response Time Insight</button>
        <button onClick={() => handleOptionClick("Status Code Educator")}>Status Code Educator</button>
        {/* 🔹 NEW LLM FEATURE BUTTONS */}
        <button onClick={() => handleAnalyzeFeature("header_silly_mistakes")}>Header Silly Mistakes</button>
        <button onClick={() => handleAnalyzeFeature("retry_recommendation")}>Retry Recommendation</button>
        <button onClick={() => handleAnalyzeFeature("api_usage_tips")}>API Usage Tips</button>
        <button onClick={() => handleAnalyzeFeature("security_judge")}>Security Judge</button>
        <button onClick={() => handleAnalyzeFeature("advanced_response_time")}>Advanced Response Time</button>
      </div>

      {/* CHAT */}
      <div className="bot-body" ref={botBodyRef}>
        {messages.map((msg, i) => (
          <div key={i} className={`bot-message ${msg.from}`}>

            {/* 🔹 cURL MESSAGE */}
            {msg.type === "curl" && (
              <div className="curl-box">
                <pre>{formatCurlForDisplay(msg.text)}</pre>
                <button
                  className="copy-btn2"
                  onClick={() => {
                    const match = msg.text.match(/"(https?:\/\/[^"]+)"/);
                    if (match) {
                      navigator.clipboard.writeText(match[1]);
                      setCopiedIndex(i);
                      setTimeout(() => setCopiedIndex(null), 2100);
                    }
                  }}
                >
                  {copiedIndex === i ? "Copied!" : "Copy URL"}
                </button>
              </div>
            )}

            {/* 🔹 USER MESSAGE (string) */}
            {msg.from === "user" && (
              <div>{String(msg.text)}</div>
            )}

            {/* 🔹 BOT MESSAGE (OBJECT or STRING SAFE) */}
            {msg.from === "bot" && msg.type !== "curl" && (
              typeof msg.text === "string" ? (
                parseBotMessage(msg.text)


              ) : (
                <>
                  {msg.text?.diagnosis && (
                    <div className="bot-diagnosis-box">
                      <div className="bot-diagnosis-title">🧠 Diagnosis</div>
                      <div className="bot-diagnosis-text">{msg.text.diagnosis}</div>
                    </div>
                  )}
                </>
              )
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
