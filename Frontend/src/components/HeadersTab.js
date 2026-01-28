import React from "react";
import "./HeadersTab.css";

const HeadersTab = ({ headers, setHeaders }) => {

  const handleHeaderChange = (index, field, value) => {
    const updated = [...headers];
    updated[index][field] = value;
    setHeaders(updated);
  };

  const addHeaderRow = () => {
    setHeaders([...headers, { key: "", value: "" }]);
  };

  const removeHeaderRow = (index) => {
    const updated = headers.filter((_, i) => i !== index);
    setHeaders(updated.length ? updated : [{ key: "", value: "" }]);
  };

  return (
    <div className="headers-tab">
      <div className="headers-table">
        <div className="headers-table-header">
          <span>Key</span>
          <span>Value</span>
          <span />
        </div>

        {headers.map((header, index) => (
          <div key={index} className="headers-row">
            <input
              type="text"
              placeholder="Key"
              value={header.key}
              onChange={(e) =>
                handleHeaderChange(index, "key", e.target.value)
              }
            />
            <input
              type="text"
              placeholder="Value"
              value={header.value}
              onChange={(e) =>
                handleHeaderChange(index, "value", e.target.value)
              }
            />
            <button
              className="remove-btn"
              onClick={() => removeHeaderRow(index)}
              title="Remove header"
            >
              ✕
            </button>
          </div>
        ))}
      </div>

      <button className="add-btn" onClick={addHeaderRow}>
        + Add Header
      </button>
    </div>
  );
};

export default HeadersTab;
