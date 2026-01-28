import { useState, useEffect, useRef, useContext } from "react";
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




export default function PostmanClone() {
  const [method, setMethod] = useState("GET");
  const [currentUserId, setCurrentUserId] = useState(null);
  const [url, setUrl] = useState("");
  const [response, setResponse] = useState("");
  const [status, setStatus] = useState(null);
  const [activeTab, setActiveTab] = useState("Params");
  const [history, setHistory] = useState([]);
  const [activePanel, setActivePanel] = useState(null);
  const [viewMode, setViewMode] = useState("pretty");
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [bodyContent, setBodyContent] = useState("");
  const [headersObj, setHeadersObj] = useState([
    { key: "", value: "" }
  ]);
  const { setRequestCount } = useContext(RequestContext);

  const navigate = useNavigate();
  const responseRef = useRef(null);
  const [responseHeight, setResponseHeight] = useState(300); // default height 300px
  const [paramsObj, setParamsObj] = useState([
    { key: "", value: "", description: "" }
  ]);
  const [showBot, setShowBot] = useState(false);
  const [messages, setMessages] = useState([
    {
      from: "bot",
      text: "Hi 👋 I’m your API assistant. Send a request and I’ll explain errors, fixes, and next steps."
    }
  ]);

  const [auth, setAuth] = useState({
    type: "none",
    token: "",
    username: "",
    password: "",
  });
  const [bodyType, setBodyType] = useState("none");
  const [rawBody, setRawBody] = useState('{\n  "example": "value"\n}');
  const [requestBody, setRequestBody] = useState(null);



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
    setResponse("");
    setStatus(null);

    // Prefill last request if it exists
    if (lastRequest) {
      setMethod(lastRequest.method || "GET");
      setUrl(lastRequest.url || "");
      setBodyContent(lastRequest.body ? JSON.stringify(lastRequest.body, null, 2) : "");
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
      if (["POST", "PUT", "PATCH", "DELETE"].includes(method) && bodyContent?.trim()) {
        try {
          bodyPayload = JSON.parse(bodyContent);
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
          "x-backend-token": backendToken, // <-- change here
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

      const respBody = data.body ?? data;
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

      if (statusCode >= 400 || status === "ERR" || status === "NETWORK_ERROR") {
        setShowBot(true);
        setMessages(prev => [
          ...prev,
          {
            from: "bot",
            text: getSmartHelpMessage(status, response)
          }
        ]);
      }


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
    // No request yet
    if (!status) {
      return `ℹ️ No request sent yet
Send an API request and I’ll explain errors if they occur.`;
    }

    // ---------------- AUTH ERRORS ----------------
    if (status === 400) {
      return `⚠️ 400 Bad Request
Root cause:
• Request syntax is invalid
• Missing required fields
• Malformed JSON body

Fix:
• Validate JSON format
• Check required parameters
• Match API schema exactly`;
    }

    if (status === 401) {
      return `🚫 401 Unauthorized
Root cause:
• Missing or invalid token
• Token expired

Fix:
• Add Authorization header
• Refresh or regenerate token
• Check Bearer format`;
    }

    if (status === 403) {
      return `⛔ 403 Forbidden
Root cause:
• You are authenticated
• But not allowed to access this resource

Fix:
• Check user roles/permissions
• Use correct API key
• Verify backend access rules`;
    }

    // ---------------- ROUTE ERRORS ----------------
    if (status === 404) {
      return `❓ 404 Not Found
Root cause:
• Endpoint does not exist
• Wrong API version
• Typo in URL path

Fix:
• Verify endpoint URL
• Check API documentation
• Confirm backend route exists`;
    }

    if (status === 405) {
      return `🚫 405 Method Not Allowed
Root cause:
• Endpoint exists
• HTTP method not supported

Fix:
• Switch HTTP method (GET/POST/PUT/DELETE)
• Check backend route definitions`;
    }

    if (status === 409) {
      return `🔁 409 Conflict
Root cause:
• Resource already exists
• Duplicate data submission

Fix:
• Check if resource exists before creating
• Use PUT instead of POST if updating`;
    }

    // ---------------- VALIDATION ERRORS ----------------
    if (status === 422) {
      return `📛 422 Unprocessable Entity
Root cause:
• Validation failed
• Data types mismatch

Fix:
• Check request payload types
• Validate required fields
• Match backend validation rules`;
    }

    // ---------------- RATE & LIMITS ----------------
    if (status === 429) {
      return `⏳ 429 Too Many Requests
Root cause:
• API rate limit exceeded

Fix:
• Slow down requests
• Implement retry with delay
• Upgrade API plan if needed`;
    }

    // ---------------- SERVER ERRORS ----------------
    if (status >= 500 && status < 600) {
      return `🔥 ${status} Server Error
Root cause:
• Backend crashed
• Database error
• Unhandled exception

Fix:
• Check backend logs
• Retry after some time
• Contact backend team`;
    }

    // ---------------- NETWORK / FETCH FAIL ----------------
    if (status === "NETWORK_ERROR") {
      return `🌐 Network Error
Root cause:
• No internet
• CORS blocked request
• Backend server down

Fix:
• Check internet connection
• Verify CORS settings
• Ensure backend is running`;
    }

    if (status === "ERR") {
      return `🌐 Network / Client Error (ERR)

What happened:
• Request never reached the server
• No HTTP response received

Common causes:
• Backend server is down
• CORS blocked the request
• Internet connection issue
• Wrong API proxy (/api/request)

How to fix:
• Check backend is running
• Open DevTools → Network tab
• Look for CORS or connection errors
• Verify API base URL`;
    }

    // ---------------- SUCCESS ----------------
    return `✅ Request Successful (${status})
Tip:
• Validate response structure
• Save response for reuse`;
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
                className="help-btn"
                onClick={() => {
                  console.log("HELP CLICKED");
                  console.log("STATUS:", status);
                  console.log("BOT MESSAGE:", getSmartHelpMessage(status, response));
                  setShowBot(true);
                  setMessages(prev => [
                    ...prev,
                    { from: "bot", text: getSmartHelpMessage(status, response) }
                  ]);
                }}
              >
                Help
              </button>

            </div>
          </div>
          <div className="response-body" style={{ overflow: "auto", maxHeight: "585px" }}>
            {!response ? (
              <p>No response yet</p>
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
            ) : viewMode === "raw" ? (
              <pre style={{ whiteSpace: "pre-wrap", wordBreak: "break-word" }}>
                {typeof response === "string" ? response : JSON.stringify(response)}
              </pre>
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
        />
      )}


    </div>
  );
}
