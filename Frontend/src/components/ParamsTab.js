import { useEffect } from "react";
import "./ParamsTab.css";

export default function ParamsTab({ paramsObj, setParamsObj }) {

  // Ensure at least one empty row always exists
  useEffect(() => {
    if (!paramsObj || paramsObj.length === 0) {
      setParamsObj([{ key: "", value: "", description: "" }]);
    }
  }, [paramsObj, setParamsObj]);

  // Cleaner → ensure exactly ONE empty row at the end
  const cleanParams = (arr) => {
    const filled = arr.filter(
      (p) =>
        p.key.trim() !== "" ||
        p.value.trim() !== "" ||
        p.description.trim() !== ""
    );

    return [...filled, { key: "", value: "", description: "" }];
  };

  const handleChange = (index, field, value) => {
    const updated = [...paramsObj];
    updated[index][field] = value;
    setParamsObj(cleanParams(updated));
  };

  // ⭐ UPDATED: behaves exactly like your first code
  const addRow = () => {
    // Add a NEW empty row ABOVE the auto-empty row
    const updated = [...paramsObj];

    // Insert before last row if last is empty
    const last = updated[updated.length - 1];
    const isLastEmpty =
      !last.key.trim() && !last.value.trim() && !last.description.trim();

    if (isLastEmpty) {
      updated.splice(updated.length - 1, 0, {
        key: "",
        value: "",
        description: ""
      });
    } else {
      updated.push({ key: "", value: "", description: "" });
    }

    setParamsObj(updated);
  };

  const removeRow = (index) => {
    const updated = [...paramsObj];

    // Prevent deleting the final empty row
    if (index === updated.length - 1) return;

    updated.splice(index, 1);

    if (updated.length === 0) {
      updated.push({ key: "", value: "", description: "" });
    }

    setParamsObj(cleanParams(updated));
  };

  return (
    <div className="params-tab">
      <table className="params-table">
        <thead>
          <tr>
            <th>Key</th>
            <th>Value</th>
            <th>Description</th>
            <th></th>
          </tr>
        </thead>

        <tbody>
          {paramsObj.map((param, idx) => (
            <tr key={idx}>
              <td>
                <input
                  type="text"
                  placeholder="Key"
                  value={param.key}
                  onChange={(e) =>
                    handleChange(idx, "key", e.target.value)
                  }
                />
              </td>

              <td>
                <input
                  type="text"
                  placeholder="Value"
                  value={param.value}
                  onChange={(e) =>
                    handleChange(idx, "value", e.target.value)
                  }
                />
              </td>

              <td>
                <input
                  type="text"
                  placeholder="Description"
                  value={param.description}
                  onChange={(e) =>
                    handleChange(idx, "description", e.target.value)
                  }
                />
              </td>

              <td>
                {/* Hide delete button for last empty row */}
                {idx !== paramsObj.length - 1 && (
                  <button
                    className="remove-btn"
                    onClick={() => removeRow(idx)}
                  >
                    ✕
                  </button>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* <button className="add-param-btn" onClick={addRow}>
        + Add Param
      </button> */}
    </div>
  );
}
