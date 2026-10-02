import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import ReactJson from "react-json-view";

import MethodDropdown from "./MethodDropdown";
import HeadersTab from "./HeadersTab";
import BodyTab from "./BodyTab";
import AccountPage from "./AccountPage";
import HistorySidebar from "../components/HistorySidebar";
import ParamsTab from "./ParamsTab";
import { getHistory, deleteHistoryItem, clearHistory } from "../services/historyService";
import { authFetch } from "../services/authService";
import "./SwiftAPIClient.css";
import RequestBar from "./RequestBar";
import BotSidebar from "./BotSidebar";
import AuthorizationTab from "./AuthorizationTab";
import { useContext } from "react";
import { SwiftAPIContext } from "../context/SwiftAPIContext";
import { showToast } from "../utils/toast";


const getUserIdFromToken = () => {
  const token = localStorage.getItem("authToken");
  if (!token) return null;
  try {
    const payload = JSON.parse(atob(token.split(".")[1]));
    return payload.id || payload._id || null;
  } catch {
    return null;
  }
};

export default function SwiftAPIClient() {
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
    auth, setAuth
  } = useContext(SwiftAPIContext);

  const [currentUserId, setCurrentUserId] = useState(null);
  const [history, setHistory] = useState(() => {
    try {
      const userId = getUserIdFromToken();
      if (!userId) return [];
      const saved = localStorage.getItem(`userHistory_${userId}`);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    const userId = getUserIdFromToken();
    if (userId) {
      localStorage.setItem(`userHistory_${userId}`, JSON.stringify(history));
    }
  }, [history]);
  const [activePanel, setActivePanel] = useState(
    sessionStorage.getItem("activePanel") || null
  );

  useEffect(() => {
    if (activePanel) {
      sessionStorage.setItem("activePanel", activePanel);
    } else {
      sessionStorage.removeItem("activePanel");
    }
  }, [activePanel]);
  const [viewMode, setViewMode] = useState(
    sessionStorage.getItem("viewMode") || "pretty"
  );

  useEffect(() => {
    sessionStorage.setItem("viewMode", viewMode);
  }, [viewMode]);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  // Clear error message immediately when URL changes
  useEffect(() => {
    setErrorMsg("");
  }, [url]);

  const [bodyContent, setBodyContent] = useState("");

  const navigate = useNavigate();
  const responseRef = useRef(null);
  const [responseHeight, setResponseHeight] = useState(() => {
    return parseInt(sessionStorage.getItem("responseHeight")) || 300;
  });

  useEffect(() => {
    sessionStorage.setItem("responseHeight", responseHeight);
  }, [responseHeight]);

  const [showBot, setShowBot] = useState(
    sessionStorage.getItem("showBot") === "true"
  );
  
  useEffect(() => {
    sessionStorage.setItem("showBot", showBot);
  }, [showBot]);

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
  const [requestBody, setRequestBody] = useState(null);
  const [apiContext, setApiContext] = useState(null);
  const [aiLoading, setAiLoading] = useState(false);

  const startResizing = (e) => {
    e.preventDefault();
    const isTouch = e.type === 'touchstart';
    const startY = isTouch ? e.touches[0].clientY : e.clientY;
    const startHeight = responseRef.current.offsetHeight;

    const doDrag = (event) => {
      if (event.type === 'touchmove') {
        event.preventDefault();
      }
      const currentY = event.type === 'touchmove' ? event.touches[0].clientY : event.clientY;
      const newHeight = startHeight - (currentY - startY);
      setResponseHeight(newHeight > 100 ? newHeight : 100); // minimum 100px
    };

    const stopDrag = () => {
      if (isTouch) {
        document.removeEventListener("touchmove", doDrag);
        document.removeEventListener("touchend", stopDrag);
      } else {
        document.removeEventListener("mousemove", doDrag);
        document.removeEventListener("mouseup", stopDrag);
      }
    };

    if (isTouch) {
      document.addEventListener("touchmove", doDrag, { passive: false });
      document.addEventListener("touchend", stopDrag);
    } else {
      document.addEventListener("mousemove", doDrag);
      document.addEventListener("mouseup", stopDrag);
    }
  };

  // Ensure Swift API param rows: always keep 1 empty row
  const cleanParams = (arr) => {
    const filled = arr.filter(
      (p) =>
        p.key.trim() !== "" ||
        p.value.trim() !== "" ||
        p.description.trim() !== ""
    );

    return [...filled, { key: "", value: "", description: "" }];
  };

  const cleanHeaders = (arr) => {
    const filled = arr.filter(
      (h) =>
        h.key.trim() !== "" ||
        h.value.trim() !== "" ||
        (h.description && h.description.trim() !== "")
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
      setCurrentUserId(userId);
      localStorage.setItem("currentUserId", userId);

      const savedCount = localStorage.getItem(`requestCount_${userId}`);
    } catch (err) {
      console.error("Failed to decode token:", err);
    }
  }, []);

  // 🔹 Keep height correct on mobile virtual keyboard resize
  useEffect(() => {
    const handleResize = () => {
      const vh = window.innerHeight * 0.01;
      document.documentElement.style.setProperty('--vh', `${vh}px`);
    };
    window.addEventListener('resize', handleResize);
    window.addEventListener('orientationchange', handleResize);
    handleResize();
    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('orientationchange', handleResize);
    };
  }, []);

  // ----------------------------
  // RESTORE LAST RESPONSE
  // ----------------------------
  const [lastResponse, setLastResponse] = useState(
    JSON.parse(sessionStorage.getItem("lastResponse") || "null")
  );
  const [lastRequest, setLastRequest] = useState(
    JSON.parse(sessionStorage.getItem("lastRequest") || "null")
  );

  // -------------------------------------------
  // LOAD HISTORY
  // -------------------------------------------
  const loadUserHistory = async () => {
    try {
      const h = await getHistory();
      setHistory(Array.isArray(h) ? [...h].reverse() : []);
    } catch (err) {
      console.error("Failed to load history:", err);
      setHistory([]);
    }
  };

  useEffect(() => {
    loadUserHistory();

    if (!lastResponse) {
      setResponse("");
      setStatus(null);
    } else {
      setResponse(lastResponse);
      if (lastRequest) setStatus(lastRequest.status ?? null);
    }

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
        responseTime: 0,
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

    const token = localStorage.getItem("authToken");
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

    const headers = {};
    headersObj.forEach(h => {
      if (h.key) headers[h.key] = h.value;
    });

    if (!headers["Content-Type"]) headers["Content-Type"] = "application/json";

    if (auth.type === "bearer" && auth.token) {
      headers["Authorization"] = `Bearer ${auth.token}`;
    }

    if (auth.type === "basic" && auth.username && auth.password) {
      const encoded = btoa(`${auth.username}:${auth.password}`);
      headers["Authorization"] = `Basic ${encoded}`;
    }

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

      const backendUrl = process.env.REACT_APP_BACKEND_URL;
      const res = await authFetch(`${backendUrl}/api/request`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          url: finalUrl,
          method,
          headers: headers,
          body: bodyPayload,
        }),
      });

      const data = await res.json();

      if (!data.success) {
        const errorText = res.status === 401 
          ? "Authentication required. Please log in to send requests." 
          : (data.error || "Request failed.");
        setErrorMsg(errorText);
        setStatus("ERR");
        setResponse({ error: errorText });
        return;
      }

      const respBody = data.body ?? data.result ?? data;
      const currentUserId = localStorage.getItem("currentUserId");
      if (currentUserId) {
        const savedCount = localStorage.getItem(`requestCount_${currentUserId}`);
        const total = (savedCount ? parseInt(savedCount) : 0) + 1;
        localStorage.setItem(`requestCount_${currentUserId}`, total);
      }

      setResponse(respBody);
      setLastResponse(respBody);
      setLastRequest({ url, method, body: bodyPayload, status: data.status ?? res.status ?? "OK" });
      sessionStorage.setItem("lastResponse", JSON.stringify(respBody));
      sessionStorage.setItem(
        "lastRequest",
        JSON.stringify({ url, method, body: bodyPayload, status: data.status ?? res.status ?? "OK" })
      );

      setStatus(data.status ?? res.status ?? "OK");
      const statusCode = data.status ?? res.status;

      const duration = Math.round(performance.now() - start);

      setApiContext({
        method,
        url,
        headers,
        status: statusCode,
        responseTime: duration,
        response: respBody || { error: "No response body available" }
      });

      setHistory(prev => [
        {
          _id: data.historyId || "temp-" + Date.now(),
          method,
          url: finalUrl,
          status: statusCode,
          duration,
          time: new Date().toISOString()
        },
        ...prev
      ]);
    } catch (err) {
      console.error("Request failed:", err);
      setErrorMsg("Request failed: " + err.message);
      setStatus("ERR");
      setResponse({ error: err.message });
    } finally {
      setLoading(false);
    }
  };

  const handleHistoryDelete = async (historyId) => {
    try {
      setHistory(prev => prev.filter(item => item._id !== historyId));
      showToast("🗑️ History item deleted!");

      deleteHistoryItem(historyId).catch((err) => {
        console.error("Failed to delete history item:", err);
        loadUserHistory();
      });
    } catch (err) {
      console.error("Failed to delete history item:", err);
      loadUserHistory();
    }
  };

  const handleHistoryClear = async () => {
    try {
      setHistory([]);
      showToast("🧹 All history cleared!");

      clearHistory().catch((err) => {
        console.error("Failed to clear history:", err);
        loadUserHistory();
      });
    } catch (err) {
      console.error("Failed to clear history:", err);
      loadUserHistory();
    }
  };

  const handleHistorySelect = (item) => {
    const fullUrlString = item.url || "";
    setMethod(item.method || "GET");
    setResponse("");
    setStatus(item.status ?? null);

    if (!fullUrlString) {
      setUrl("");
      setParamsObj([{ key: "", value: "", description: "" }]);
      return;
    }

    try {
      const parsedUrl = new URL(fullUrlString);
      const baseUrl = parsedUrl.origin + parsedUrl.pathname;
      setUrl(baseUrl);

      const searchParams = Array.from(parsedUrl.searchParams.entries());
      if (searchParams.length > 0) {
        const newParams = searchParams.map(([key, value]) => ({
          key,
          value,
          description: ""
        }));
        newParams.push({ key: "", value: "", description: "" });
        setParamsObj(newParams);
      } else {
        setParamsObj([{ key: "", value: "", description: "" }]);
      }
    } catch (e) {
      if (fullUrlString.includes("?")) {
        const parts = fullUrlString.split("?");
        const baseUrl = parts[0];
        setUrl(baseUrl);

        const searchParams = new URLSearchParams(parts[1]);
        const newParams = Array.from(searchParams.entries()).map(([key, value]) => ({
          key,
          value,
          description: ""
        }));
        newParams.push({ key: "", value: "", description: "" });
        setParamsObj(newParams);
      } else {
        setUrl(fullUrlString);
        setParamsObj([{ key: "", value: "", description: "" }]);
      }
    }
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(typeof text === "string" ? text : JSON.stringify(text, null, 2));
    showToast("✅ Copied to clipboard!");
  };

  return (
    <div className="layout">
      {/* Sidebar */}
      <div className="sidebar-small">
        <button 
          className="sidebar-btn" 
          onClick={() => {
            const token = localStorage.getItem("authToken");
            if (!token) {
              navigate("/login");
            } else {
              navigate("/account");
            }
          }}
        >
          👤<span className="tooltip">Account</span>
        </button>

        <button
          className={`sidebar-btn ${activePanel === "history" ? "active" : ""}`}
          onClick={() => {
            const token = localStorage.getItem("authToken");
            if (!token) {
              showToast("⚠️ You need to log in to see your history.");
              return;
            }
            setActivePanel(activePanel === "history" ? null : "history");
          }}
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

      <div className="sidebar-large" style={{ display: activePanel === "history" ? "block" : "none" }}>
        <HistorySidebar
          items={history}
          onSelect={handleHistorySelect}
          onDelete={handleHistoryDelete}
          onClear={handleHistoryClear}
        />
      </div>

      {activePanel === "account" && (
        <div className="sidebar-large">
          <AccountPage onClose={() => setActivePanel(null)} />
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
          {["Params", "Headers", "Body", "Authorization", "Settings"].map((tab) => (
            <button
              key={tab}
              className={`tab ${activeTab === tab ? "active" : ""}`}
              onClick={() => {
                if (tab === "Settings") {
                  const token = localStorage.getItem("authToken");
                  if (!token) {
                    navigate("/login");
                  } else {
                    navigate("/account");
                  }
                } else {
                  setActiveTab(tab);
                }
              }}
            >
              {tab === "Authorization" ? (
                <>
                  <span className="tab-label-desktop">Authorization</span>
                  <span className="tab-label-mobile">Auth</span>
                </>
              ) : tab}
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

            {activeTab === "Headers" && (
              <HeadersTab 
                headers={headersObj} 
                setHeaders={(updated) => setHeadersObj(cleanHeaders(updated))} 
              />
            )}
            {activeTab === "Body" && (
              <BodyTab
                bodyType={bodyType}
                setBodyType={setBodyType}
                body={rawBody}
                setBody={setRawBody}
                onBodyChange={setRequestBody}
              />
            )}
            {activeTab === "Authorization" && (
              <AuthorizationTab auth={auth} setAuth={setAuth} />
            )}
            {activeTab === "Settings" && <div>Settings options</div>}
          </div>
        </div>

        {/* Response Section */}
        <div className="response" ref={responseRef} style={{ height: responseHeight }}>
          <div 
            className="response-resize-handle" 
            onMouseDown={startResizing}
            onTouchStart={startResizing}
          ></div>
          <div className="response-header">
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
                    if (!response) {
                      showToast("⚠️ First send a request and then you can save it.");
                      return;
                    }
                    const blob = new Blob(
                      [typeof response === "string" ? response : JSON.stringify(response, null, 2)],
                      { type: "application/json" }
                    );
                    const url = URL.createObjectURL(blob);
                    const link = document.createElement("a");
                    link.href = url;
                    link.download = "response.json";
                    link.click();
                    showToast("💾 Response saved successfully!");
                  }}
                >
                  Save
                </button>
              </div>
            </div>
            <div className="response-right" style={{ display: "flex", alignItems: "center", gap: "6px" }}>
              {status !== null && <span className={`status-badge status-${status}`}>{status}</span>}

              <button className="copy-btn" onClick={() => response && copyToClipboard(response)}>Copy</button>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  const token = localStorage.getItem("authToken");
                  if (!token) {
                    showToast("⚠️ Please log in to use the AI Assistant.");
                    navigate("/login");
                    return;
                  }
                  if (!response) {
                    showToast("⚠️ Please send a request first to get help!");
                    return;
                  }
                  setShowBot(true);
                }}
              >
                Help
              </button>
            </div>
          </div>
          <div className="response-body" style={{ overflow: "auto", maxHeight: "585px" }}>
            {loading ? (
              <div style={{ padding: "20px", color: "#888", display: "flex", alignItems: "center", gap: "10px" }}>
                <span>⏳ Waiting for response...</span>
              </div>
            ) : !response ? (
              <p>No response yet</p>
            ) : (
              <>
                <div style={{ display: viewMode === "raw" ? "block" : "none" }}>
                  <pre style={{ whiteSpace: "pre-wrap", wordBreak: "break-word", margin: 0, padding: "10px" }}>
                    {(() => {
                      const str = typeof response === "string" ? response : JSON.stringify(response);
                      return str.length > 250000 ? str.slice(0, 250000) + "\n\n... [Truncated for performance]" : str;
                    })()}
                  </pre>
                </div>

                <div className="pretty-json-container" style={{ display: viewMode === "pretty" ? "block" : "none", maxWidth: "100%", overflowX: "auto" }}>
                  {(() => {
                    try {
                      const isTooLarge = typeof response !== "string" && JSON.stringify(response).length > 250000;
                      if (isTooLarge) {
                        return (
                          <div style={{ padding: "20px", color: "#ff9900" }}>
                            ⚠️ This response is too large to safely render in 'Pretty' mode. Please use 'Raw' or 'Preview'.
                          </div>
                        );
                      }
                      return (
                        <ReactJson
                          src={typeof response === "string" ? { raw: response } : response}
                          name={null}
                          collapsed={50}
                          enableClipboard={true}
                          displayDataTypes={false}
                          displayObjectSize={true}
                          theme="google"
                          style={{ fontSize: "12px", background: "transparent" }}
                        />
                      );
                    } catch (err) {
                      return <div style={{ color: "red", padding: "10px" }}>Error rendering pretty view. Try 'Raw'.</div>;
                    }
                  })()}
                </div>

                <div style={{ display: viewMode === "preview" ? "block" : "none", background: "transparent", color: "var(--terminal-white)", overflowX: "auto", padding: "10px" }}>
                  <pre style={{ margin: 0, color: "var(--terminal-white)", whiteSpace: "pre" }}>
                    {typeof response === "string" ? response.replace(/\\n/g, "\n") : JSON.stringify(response, null, 2)}
                  </pre>
                </div>
              </>
            )}
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
          setActiveTab={setActiveTab}
          setShowBot={setShowBot}
        />
      )}
    </div>
  );
}
