import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import ReactJson from "react-json-view";
import { RequestContext } from "../context/RequestContext";
import MethodDropdown from "./MethodDropdown";
import HeadersTab from "./HeadersTab";
import BodyTab from "./BodyTab";
import AccountPage from "./AccountPage";
import HistorySidebar from "../components/HistorySidebar";
import ParamsTab from "./ParamsTab";
import { getHistory, deleteHistoryItem, clearHistory } from "../services/historyService";
import "./PostmanClone.css";
import RequestBar from "./RequestBar";
import BotSidebar from "./BotSidebar";
import AuthorizationTab from "./AuthorizationTab";
import { useContext } from "react";
import { PostmanContext } from "../context/PostmanContext"; // 🔹 add this





export default function PostmanClone() {
  const {
    method, setMethod,
    url, setUrl,
    headersObj, setHeadersObj,
    paramsObj, setParamsObj,
    rawBody, setRawBody,
    activeTab, setActiveTab,
    response, setResponse,
    status, setStatus,
    messages, setMessages,
    auth, setAuth // 🔹 ADD THIS
  } = useContext(PostmanContext);

  // const [method, setMethod] = useState("GET");
  const [currentUserId, setCurrentUserId] = useState(null);
  // const [url, setUrl] = useState("");
  // const [response, setResponse] = useState("");
  // const [status, setStatus] = useState(null);
  // const [activeTab, setActiveTab] = useState("Params");
  const [history, setHistory] = useState([]);
  const [activePanel, setActivePanel] = useState(null);
  const [viewMode, setViewMode] = useState("pretty");
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [bodyContent, setBodyContent] = useState("");
  // const [headersObj, setHeadersObj] = useState([
  //   { key: "", value: "" }
  // ]);
  const { setRequestCount } = useContext(RequestContext);

  const navigate = useNavigate();
  const responseRef = useRef(null);
  const [responseHeight, setResponseHeight] = useState(300); // default height 300px
  // const [paramsObj, setParamsObj] = useState([
  //   { key: "", value: "", description: "" }
  // ]);
  const [showBot, setShowBot] = useState(false);
  // const [messages, setMessages] = useState([
  //   {
  //     from: "bot",
  //     text: "Hi 👋 I’m your API assistant. Send a request and I’ll explain errors, fixes, and next steps."
  //   }
  // ]);


  // 🔹 Sync auth to headersObj automatically
  useEffect(() => {
    if (auth.type === "bearer" && auth.token) {
      setHeadersObj(prev => {
        const otherHeaders = prev.filter(h => h.key !== "Authorization");
        return [
          ...otherHeaders,
          { key: "Authorization", value: `Bearer ${auth.token}` },
          ...prev.filter(h => h.key === ""), // keep empty row
        ];
      });
    } else if (auth.type === "basic" && auth.username && auth.password) {
      const encoded = btoa(`${auth.username}:${auth.password}`);
      setHeadersObj(prev => {
        const otherHeaders = prev.filter(h => h.key !== "Authorization");
        return [
          ...otherHeaders,
          { key: "Authorization", value: `Basic ${encoded}` },
          ...prev.filter(h => h.key === ""),
        ];
      });
    } else if (auth.type === "none") {
      // Remove Authorization header if no auth selected
      setHeadersObj(prev => prev.filter(h => h.key !== "Authorization"));
    }
  }, [auth, setHeadersObj]);

  const [bodyType, setBodyType] = useState("none");
  // const [rawBody, setRawBody] = useState('{\n  "example": "value"\n}');
  const [requestBody, setRequestBody] = useState(null);
  const [apiContext, setApiContext] = useState(null);
  const [aiLoading, setAiLoading] = useState(false);






  // const responseRef = useRef(null);

  const startResizing = (e) => {
    e.preventDefault();
    const startY = e.clientY;
    const startHeight = responseRef.current.offsetHeight;

    const doDrag = (event) => {
      const newHeight = startHeight + (event.clientY - startY);
      setResponseHeight(newHeight > 100 ? newHeight : 100); // minimum 100px
    };

    const stopDrag = () => {
      document.removeEventListener("mousemove", doDrag);
      document.removeEventListener("mouseup", stopDrag);
    };

    document.addEventListener("mousemove", doDrag);
    document.addEventListener("mouseup", stopDrag);
  };

  // Ensure Postman-like param rows: always keep 1 empty row
  const cleanParams = (arr) => {
    const filled = arr.filter(
      (p) =>
        p.key.trim() !== "" ||
        p.value.trim() !== "" ||
        p.description.trim() !== ""
    );

    return [...filled, { key: "", value: "", description: "" }];
  };
  // On mount: decode token, get userId, and load saved request count
  useEffect(() => {
    const token = localStorage.getItem("authToken");
    if (!token) return;

    try {
      const payload = JSON.parse(atob(token.split(".")[1]));
      const userId = payload.id || payload._id;
      setCurrentUserId(userId);           // store in state
      localStorage.setItem("currentUserId", userId);

      const savedCount = localStorage.getItem(`requestCount_${userId}`);
      setRequestCount(savedCount ? parseInt(savedCount) : 0);
    } catch (err) {
      console.error("Failed to decode token:", err);
    }
  }, [setRequestCount]);

  // ----------------------------
  // RESTORE LAST RESPONSE
  // ----------------------------
  const [lastResponse, setLastResponse] = useState(
    JSON.parse(localStorage.getItem("lastResponse") || "null")
  );
  const [lastRequest, setLastRequest] = useState(
    JSON.parse(localStorage.getItem("lastRequest") || "null")
  );

  // -------------------------------------------
  // LOAD HISTORY
  // -------------------------------------------
  const loadUserHistory = async () => {
    try {
      const h = await getHistory(); // ✅ uses authToken internally
      console.log("Fetched history:", h); // <-- Add this
      setHistory(Array.isArray(h) ? [...h].reverse() : []);
    } catch (err) {
      console.error("Failed to load history:", err);
      setHistory([]);
    }
  };

  useEffect(() => {
    loadUserHistory(); // fetch history

    // Only clear response, keep last request data intact
    if (!lastResponse) setResponse("");
    if (!lastResponse) setStatus(null);

    // Prefill last request if it exists
    if (lastRequest) {
      setMethod(lastRequest.method || "GET");
      setUrl(lastRequest.url || "");
      setBodyContent(lastRequest.body ? JSON.stringify(lastRequest.body, null, 2) : "");

      // 🔹 Initialize apiContext for BotSidebar
      setApiContext({
        method: lastRequest.method || "GET",
        url: lastRequest.url || "",
        headers: headersObj.reduce((acc, h) => {
          if (h.key) acc[h.key] = h.value;
          return acc;
        }, {}),
        status: lastRequest.status ?? "OK",
        responseTime: 0, // optional, last request time unknown
        response: lastResponse || { error: "No response available" }
      });
    }
  }, []);




  // -------------------------------------------
  // URL Validator
  // -------------------------------------------
  const isValidUrl = (str) => {
    try {
      new URL(str);
      return true;
    } catch {
      return false;
    }
  };

  // -------------------------------------------
  // SEND REQUEST
  // -------------------------------------------
  const handleSend = async () => {
    setErrorMsg("");
    setResponse("");
    setStatus(null);

    const token = localStorage.getItem("authToken"); // ✅ use correct key
    if (!token) {
      setErrorMsg("You must be logged in to send requests.");
      return;
    }

    if (!url.trim()) {
      setErrorMsg("Please enter a URL.");
      return;
    }

    if (!isValidUrl(url)) {
      setErrorMsg("Invalid URL format.");
      return;
    }


    // ----------------------------
    // Convert headers from array to object
    // ----------------------------
    const headers = {};
    headersObj.forEach(h => {
      if (h.key) headers[h.key] = h.value;
    });

    // Add default Content-Type if not provided
    if (!headers["Content-Type"]) headers["Content-Type"] = "application/json";


    // APPLY AUTH FROM AUTH TAB
    if (auth.type === "bearer" && auth.token) {
      headers["Authorization"] = `Bearer ${auth.token}`;
    }

    if (auth.type === "basic" && auth.username && auth.password) {
      const encoded = btoa(`${auth.username}:${auth.password}`);
      headers["Authorization"] = `Basic ${encoded}`;
    }

    // Add auth token

    console.log("Sending headers:", headers); // <-- check in console if headers are correct


    setLoading(true);
    const start = performance.now();

    try {
      let bodyPayload;
      if (["POST", "PUT", "PATCH", "DELETE"].includes(method) && rawBody?.trim()) {
        try {
          bodyPayload = JSON.parse(rawBody);
        } catch (err) {
          setErrorMsg("Invalid JSON in body: " + err.message);
          setLoading(false);
          return;
        }
      }

      // Build final URL with query params
      // Build final URL with cleaned query params
      let finalUrl = url;

      const validParams = paramsObj.filter((p) => p.key.trim() !== "");

      if (validParams.length) {
        const queryString = validParams
          .map(
            (p) =>
              `${encodeURIComponent(p.key.trim())}=${encodeURIComponent(
                p.value.trim()
              )}`
          )
          .join("&");

        finalUrl += finalUrl.includes("?") ? `&${queryString}` : `?${queryString}`;
      }

      // NEW: send backend auth in custom header
      const backendToken = localStorage.getItem("authToken");

      const res = await fetch("/api/request", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${backendToken}`, // ✅ use proper auth header
        },
        body: JSON.stringify({
          url: finalUrl,
          method,
          headers: headers, // contains Basic or Bearer token for target API
          body: bodyPayload,
        }),
      });




      const data = await res.json();

      if (!data.success) {
        setErrorMsg(data.error || "Request failed.");
        setStatus("ERR");
        setResponse({ error: data.error });

        return;
      }


      // ===============================
      // 🤖 AI RESPONSE HANDLING
      // ===============================





      const respBody = data.body ?? data.result ?? data;
      setRequestCount(prev => {
        const newCount = prev + 1;
        const currentUserId = localStorage.getItem("currentUserId");
        if (currentUserId) {
          localStorage.setItem(`requestCount_${currentUserId}`, newCount);
        }
        return newCount;
      });


      // ----------------------------
      // PERSIST LAST RESPONSE LOCALLY
      // ----------------------------
      setResponse(respBody);
      setLastResponse(respBody);
      setLastRequest({ url, method, body: bodyPayload, status: data.status ?? res.status ?? "OK" });
      localStorage.setItem("lastResponse", JSON.stringify(respBody));
      localStorage.setItem(
        "lastRequest",
        JSON.stringify({ url, method, body: bodyPayload, status: data.status ?? res.status ?? "OK" })
      );

      setStatus(data.status ?? res.status ?? "OK");
      const statusCode = data.status ?? res.status;


      // ===============================
      // 🧠 SAVE API CONTEXT FOR AI BOT
      // ===============================
      const duration = Math.round(performance.now() - start);

      setApiContext({
        method,
        url,
        headers,
        status: statusCode,
        responseTime: duration,
        response: respBody || { error: "No response body available" }
      });





      await loadUserHistory(); // refresh history after request
    } catch (err) {
      console.error("Request failed:", err);
      setErrorMsg("Request failed: " + err.message);
      setStatus("ERR");
      setResponse({ error: err.message });
    } finally {
      setLoading(false);
      // responseRef.current?.scrollIntoView({ behavior: "smooth" });
      console.log("Request duration:", Math.round(performance.now() - start), "ms");
    }
  };

  // -------------------------------------------
  // HISTORY HANDLERS
  // -------------------------------------------
  const handleHistoryDelete = async (historyId) => {
    try {
      await deleteHistoryItem(historyId); // ✅ uses authToken internally
      await loadUserHistory();
    } catch (err) {
      console.error("Failed to delete history item:", err);
    }
  };

  const handleHistoryClear = async () => {
    try {
      await clearHistory(); // ✅ uses authToken internally
      await loadUserHistory();
    } catch (err) {
      console.error("Failed to clear history:", err);
    }
  };

  const handleHistorySelect = (item) => {
    setMethod(item.method || "GET");
    setUrl(item.url || "");
    setResponse("");
    setStatus(item.status ?? null);
  };

  // -------------------------------------------
  // Copy to clipboard
  // -------------------------------------------
  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(typeof text === "string" ? text : JSON.stringify(text, null, 2));
    const toast = document.createElement("div");
    toast.textContent = "Copied to clipboard!";
    toast.className = "toast";
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 1200);
  };
  const getSmartHelpMessage = (status = null, responseBody) => {
    if (!status) return { diagnosis: "ℹ️ No request sent yet", fix: "Send an API request and I’ll explain errors.", tests: [] };

    if (status === 400) return {
      diagnosis: "⚠️ 400 Bad Request: Request syntax invalid or missing fields",
      fix: "Validate JSON format, check required parameters, match API schema exactly",
      tests: ["Validate JSON schema", "Check required fields"]
    };

    if (status === 401) return {
      diagnosis: "🚫 401 Unauthorized: Missing or invalid token",
      fix: "Add Authorization header, refresh or regenerate token",
      tests: ["Check token validity", "Ensure Bearer format"]
    };

    if (status === 403) return {
      diagnosis: "⛔ 403 Forbidden: Access denied",
      fix: "Check user roles/permissions, correct API key, backend access rules",
      tests: ["Verify user permissions", "Check API key"]
    };

    if (status === 404) return {
      diagnosis: "❓ 404 Not Found: Endpoint does not exist or typo in URL",
      fix: "Verify endpoint URL and API version, confirm backend route",
      tests: ["Check route exists", "Validate URL"]
    };

    if (status === 405) return {
      diagnosis: "🚫 405 Method Not Allowed",
      fix: "Use correct HTTP method (GET/POST/PUT/DELETE)",
      tests: ["Check allowed methods in backend"]
    };

    if (status === 409) return {
      diagnosis: "🔁 409 Conflict: Resource already exists or duplicate submission",
      fix: "Use PUT to update existing resource instead of POST",
      tests: ["Check if resource exists before creating"]
    };

    if (status === 422) return {
      diagnosis: "📛 422 Unprocessable Entity: Validation failed",
      fix: "Match backend validation rules, check payload types",
      tests: ["Validate field types", "Check required fields"]
    };

    if (status === 429) return {
      diagnosis: "⏳ 429 Too Many Requests: Rate limit exceeded",
      fix: "Slow down requests, implement retry with delay",
      tests: ["Throttle requests", "Upgrade API plan if needed"]
    };

    if (status >= 500 && status < 600) return {
      diagnosis: `🔥 ${status} Server Error`,
      fix: "Check backend logs, retry after some time, contact backend team",
      tests: ["Check server logs", "Retry request"]
    };

    if (status === "NETWORK_ERROR" || status === "ERR") return {
      diagnosis: "🌐 Network / Client Error",
      fix: "Check backend running, DevTools → Network tab, CORS issues",
      tests: ["Verify server is running", "Check browser console for CORS"]
    };

    return {
      diagnosis: `✅ Request Successful (${status})`,
      fix: "Response received successfully",
      tests: []
    };
  };



  // -------------------------------------------
  // RENDER
  // -------------------------------------------
  return (
    <div className="layout">
      {/* Sidebar */}
      <div className="sidebar-small">
        <button className="sidebar-btn" onClick={() => navigate("/account")}>👤<span className="tooltip">Account</span></button>

        <button
          className={`sidebar-btn ${activePanel === "history" ? "active" : ""}`}
          onClick={() => setActivePanel(activePanel === "history" ? null : "history")}
        >
          🕒<span className="tooltip">History</span>
        </button>

        <button
          className={`sidebar-btn ${activePanel === "flows" ? "active" : ""}`}
          onClick={() => setActivePanel(activePanel === "flows" ? null : "flows")}
        >
          🔀<span className="tooltip">Flows</span>
        </button>
      </div>

      {activePanel === "history" && (
        <div className="sidebar-large">
          <HistorySidebar
            items={history}
            onSelect={handleHistorySelect}
            onDelete={handleHistoryDelete}
            onClear={handleHistoryClear}
          />
        </div>
      )}

      {activePanel === "account" && (
        <div className="sidebar-large">
          <AccountPage />
        </div>
      )}

      {/* Main App Area */}
      <div className="app">
        <form
          className="top-bar"
          onSubmit={(e) => {
            e.preventDefault();
            handleSend();
          }}
        >
          <MethodDropdown method={method} setMethod={setMethod} />

          <RequestBar url={url} setUrl={setUrl} paramsObj={paramsObj} />


          <button
            type="submit"
            className="send-btn"
            disabled={loading}
            style={{ opacity: loading ? 0.6 : 1 }}
          >
            {loading ? "Sending..." : "Send"}
          </button>
        </form>


        {errorMsg && <div className="error-box">{errorMsg}</div>}

        {/* Tabs */}
        <div className="tab-list">
          {["Params", "Headers", "Body", "Authorization", "Scripts", "Settings"].map((tab) => (
            <button
              key={tab}
              className={`tab ${activeTab === tab ? "active" : ""}`}
              onClick={() => {
                if (tab === "Settings") {
                  navigate("/account"); // ✅ redirect to account page
                } else {
                  setActiveTab(tab);
                }
              }}
            >
              {tab}
            </button>
          ))}

        </div>

        {/* Tab Content */}
        <div className="tab-content">
          <div className="request-area">
            {activeTab === "Params" && (
              <ParamsTab
                paramsObj={paramsObj}
                setParamsObj={(updated) => setParamsObj(cleanParams(updated))}
              />
            )}


            {activeTab === "Headers" && <HeadersTab headers={headersObj} setHeaders={setHeadersObj} />}
            {activeTab === "Body" && (
              <BodyTab
                bodyType={bodyType}
                setBodyType={setBodyType}
                body={rawBody}           // ✅ map rawBody → body
                setBody={setRawBody}     // ✅ map setRawBody → setBody
                onBodyChange={setRequestBody}
              />

            )}
            {activeTab === "Authorization" && (
              <AuthorizationTab auth={auth} setAuth={setAuth} />
            )}
            {activeTab === "Scripts" && <div>Scripts placeholder</div>}
            {activeTab === "Settings" && <div>Settings options</div>}
          </div>
        </div>

        {/* Response Section */}
        <div className="response" ref={responseRef} style={{ height: responseHeight }}>
          <div className="response-resize-handle" onMouseDown={startResizing}></div>          <div className="response-header">
            <div className="response-left">
              <h4>Response</h4>
              <div className="view-buttons">
                {["pretty", "raw", "preview"].map((mode) => (
                  <button
                    key={mode}
                    className={`view-btn ${viewMode === mode ? "active" : ""}`}
                    onClick={() => setViewMode(mode)}
                  >
                    {mode.charAt(0).toUpperCase() + mode.slice(1)}
                  </button>
                ))}
                <button
                  className="save-btn"
                  onClick={() => {
                    const blob = new Blob(
                      [typeof response === "string" ? response : JSON.stringify(response, null, 2)],
                      { type: "application/json" }
                    );
                    const url = URL.createObjectURL(blob);
                    const link = document.createElement("a");
                    link.href = url;
                    link.download = "response.json";
                    link.click();
                  }}
                >
                  Save
                </button>
              </div>
            </div>
            <div className="response-right" style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              {status !== null && <span className={`status-badge status-${status}`}>{status}</span>}

              <button className="copy-btn" onClick={() => response && copyToClipboard(response)}>Copy</button>
              <button
                type="button"
                onClick={() => {
                  if (!url) return;
                  setShowBot(true);
                }}
              >
                Help
              </button>


            </div>

          </div>
          <div className="response-body" style={{ overflow: "auto", maxHeight: "585px" }}>
            {!response ? (
              <p>No response yet</p>
            )
              : viewMode === "raw" ? (
                <pre style={{ whiteSpace: "pre-wrap", wordBreak: "break-word" }}>
                  {typeof response === "string" ? response : JSON.stringify(response)}
                </pre>
              ) : viewMode === "pretty" ? (
                <ReactJson
                  src={typeof response === "string" ? { raw: response } : response}
                  name={null}
                  collapsed={1}
                  enableClipboard={true}
                  displayDataTypes={false}
                  displayObjectSize={true}
                  theme="google"
                />
              ) : viewMode === "preview" ? (
                <div
                  style={{
                    background: "#1e1e1e",
                    color: "#fff",
                    fontFamily: "monospace",
                    whiteSpace: "pre-wrap",
                    padding: "10px",
                  }}
                >
                  <pre style={{ margin: 0, color: "#fff" }}>
                    {typeof response === "string"
                      ? response.replace(/\\n/g, "\n")
                      : JSON.stringify(response, null, 2)}
                  </pre>
                </div>
              ) : null}
          </div>
        </div>
      </div>
      {showBot && (
        <BotSidebar
          onClose={() => setShowBot(false)}
          messages={messages}
          setMessages={setMessages}
          currentApiContext={apiContext}
          setHeadersObj={setHeadersObj}
          setActiveTab={setActiveTab} // optional
          setShowBot={setShowBot} // 🔹 PASS IT HERE

        />
      )}



    </div>
  );
}
