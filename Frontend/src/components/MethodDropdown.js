import { useState, useRef, useEffect } from "react";
import "./MethodDropdown.css";

export default function MethodDropdown({ method, setMethod }) {
  const [open, setOpen] = useState(false);
  const dropdownRef = useRef(null);

  const methods = [
    { value: "GET", color: "#22c55e" },
    { value: "POST", color: "#3b82f6" },
    { value: "PUT", color: "#eab308" },
    { value: "DELETE", color: "#ef4444" },
  ];

  const current = methods.find((m) => m.value === method);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="method-dropdown" ref={dropdownRef}>
      <div
        className="method-display"
        style={{ color: current.color }}
        onClick={() => setOpen(!open)}
      >
        {current.value}
        <span className="arrow">▼</span>
      </div>

      {open && (
        <div className="dropdown-menu">
          {methods.map((m) => (
            <div
              key={m.value}
              className="dropdown-item"
              style={{ color: m.color }}
              onClick={() => {
                setMethod(m.value);
                setOpen(false);
              }}
            >
              {m.value}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
