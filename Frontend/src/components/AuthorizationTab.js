import React from "react";
import "./AuthorizationTab.css";

const AuthorizationTab = ({ auth, setAuth }) => {
  const handleTypeChange = (e) => {
    setAuth({
      type: e.target.value,
      token: "",
      username: "",
      password: "",
    });
  };

  return (
    <div className="auth-tab">
      {/* Auth type selector */}
      <div className="auth-row">
        <label className="auth-label">Type</label>
        <select
          className="auth-select"
          value={auth.type}
          onChange={handleTypeChange}
        >
          <option value="none">No Auth</option>
          <option value="bearer">Bearer Token</option>
          <option value="basic">Basic Auth</option>
        </select>
      </div>

      {/* Bearer Token */}
      {auth.type === "bearer" && (
        <div className="auth-row">
          <label className="auth-label">Token</label>
          <input
            type="text"
            className="auth-input"
            placeholder="Enter bearer token"
            value={auth.token}
            onChange={(e) =>
              setAuth({ ...auth, token: e.target.value })
            }
          />
        </div>
      )}

      {/* Basic Auth */}
      {auth.type === "basic" && (
        <>
          <div className="auth-row">
            <label className="auth-label">Username</label>
            <input
              type="text"
              className="auth-input"
              placeholder="Username"
              value={auth.username}
              onChange={(e) =>
                setAuth({ ...auth, username: e.target.value })
              }
            />
          </div>

          <div className="auth-row">
            <label className="auth-label">Password</label>
            <input
              type="password"
              className="auth-input"
              placeholder="Password"
              value={auth.password}
              onChange={(e) =>
                setAuth({ ...auth, password: e.target.value })
              }
            />
          </div>
        </>
      )}
    </div>
  );
};

export default AuthorizationTab;
