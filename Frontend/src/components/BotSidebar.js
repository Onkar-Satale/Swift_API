import { useState, useRef, useEffect } from "react";
import "./BotSidebar.css";

export default function BotSidebar({ onClose,messages,setMessages   }) {
  const [input, setInput] = useState("");
  const [showPanel, setShowPanel] = useState(false);
  const panelRef = useRef(null);

  // Send user input to Python AI bot
  const handleSend = async () => {
    if (!input.trim()) return;
    const userMessage = { from: "user", text: input };
    setMessages((prev) => [...prev, userMessage]);
    setInput("");

    try {
      const response = await fetch("http://localhost:8000/bot", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: "user123", // replace with dynamic user
          message: input,
          requestHistory: [] // optional: send last N requests
        })
      });

      const data = await response.json();

      // Render structured response nicely
      let botMessage = "";

      if (data.type === "root_cause") {
        botMessage = `Root Cause: ${data.rootCause}\nFix Steps:\n- ${data.fixSteps.join("\n- ")}`;
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
      console.error(err);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter") handleSend();
  };

  const handleOptionClick = async (action) => {
    setMessages((prev) => [
      ...prev,
      { from: "bot", text: `You selected: "${action}", fetching AI response...` }
    ]);
    setShowPanel(false);

    // Optional: trigger bot with pre-defined action
    setInput(action);
    handleSend();
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (panelRef.current && !panelRef.current.contains(event.target)) {
        setShowPanel(false);
      }
    };
    if (showPanel) document.addEventListener("mousedown", handleClickOutside);
    else document.removeEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [showPanel]);

  return (
    <div className="bot-sidebar">
      {/* HEADER */}
      <div className="bot-header">
        <div className="bot-header-left">
          <div
            className="panel-toggle"
            onClick={() => setShowPanel((prev) => !prev)}
          >
            <span></span>
            <span></span>
            <span></span>
          </div>
         <h3 style={{ color: "#ff8912", fontWeight: "bold", fontSize: "20px" }}>J.A.R.V.I.S.</h3>

        </div>
        <button className="close-btn" onClick={onClose}>✖</button>
      </div>

      {/* SLIDING PANEL */}
      <div ref={panelRef} className={`bot-panel ${showPanel ? "open" : ""}`}>
        <h4>Tools & Actions</h4>
        <button onClick={() => handleOptionClick("Root-Cause Analysis")}>Root-Cause Analysis</button>
        <button onClick={() => handleOptionClick("Generate Workflow")}>Generate Workflow</button>
        <button onClick={() => handleOptionClick("Contract Drift Check")}>Contract Drift Check</button>
        <button onClick={() => handleOptionClick("Copy cURL")}>Copy cURL</button>
        <button onClick={() => handleOptionClick("Auto-fill Headers")}>Auto-fill Headers</button>
      </div>

      {/* CHAT BODY */}
      <div className="bot-body">
        {messages.map((msg, i) => (
          <div key={i} className={`bot-message ${msg.from}`}>
            {msg.text.split("\n").map((line, idx) => <div key={idx}>{line}</div>)}
          </div>
        ))}
      </div>

      {/* FOOTER */}
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
