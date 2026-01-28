import React, { useState, useEffect } from "react";
import "./HistorySidebar.css";

// Group by date only
function groupByDate(items) {
  const groups = {};

  const sorted = [...items].sort(
    (a, b) => new Date(b.time) - new Date(a.time)
  );

  sorted.forEach((h) => {
    const d = new Date(h.time);
    const today = new Date();
    const yesterday = new Date();
    yesterday.setDate(today.getDate() - 1);

    let label;
    if (d.toDateString() === today.toDateString()) label = "Today";
    else if (d.toDateString() === yesterday.toDateString()) label = "Yesterday";
    else {
      label = d.toLocaleDateString(undefined, {
        month: "long",
        day: "numeric",
        year: d.getFullYear() !== today.getFullYear() ? "numeric" : undefined,
      });
    }

    if (!groups[label]) groups[label] = [];
    groups[label].push(h);
  });

  return groups;
}

export default function HistorySidebar({ items = [], onSelect, onDelete, onClear, onCountChange }) {
  const [collapsed, setCollapsed] = useState({});
  useEffect(() => {
    if (onCountChange) {
      onCountChange(items.length);
    }
  }, [items]);
  const grouped = groupByDate(items);

  return (
    <aside className="history">
      <div className="history-header">
        <h3>History</h3>
        <button className="clear-btn" onClick={onClear}>Clear</button>
      </div>

      <div className="history-list">
        {items.length === 0 && (
          <div className="history-empty">No requests yet</div>
        )}

        {Object.entries(grouped).map(([date, list]) => (
          <div key={date} className="history-group">
            <button
              className="group-header"
              onClick={() =>
                setCollapsed({ ...collapsed, [date]: !collapsed[date] })
              }
            >
              {date}
              <span className="chevron">{collapsed[date] ? "▶" : "▼"}</span>
            </button>

            {!collapsed[date] && (
              <ul>
                {list.map((h) => (
                  <li key={h._id} className="history-item">
                    <button className="history-main" onClick={() => onSelect(h)}>
                      <span className={`method pill method-${h.method?.toLowerCase()}`}>
                        {h.method}
                      </span>
                      <span className="url" title={h.url}>{h.url}</span>
                    </button>

                    <div className="history-meta">
                      <span className={`status ${String(h.status).startsWith("ERR") ? "err" : ""}`}>
                        {h.status}
                      </span>
                      <span className="dot">•</span>
                      <span className="duration">{h.duration || 0} ms</span>
                      <span className="dot">•</span>
                      <span className="time">
                        {new Date(h.time).toLocaleTimeString()}
                      </span>
                      <button className="del" onClick={() => onDelete(h._id)}>
                        ✕
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        ))}
      </div>
    </aside>
  );
}
