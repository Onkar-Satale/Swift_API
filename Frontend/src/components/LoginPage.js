import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { login, saveAuthData } from "../services/authService";
import "./Login.css";

export default function LoginPage() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({ email: "", password: "" });
  const [errorMsg, setErrorMsg] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem("authToken");
    if (token) navigate("/");
  }, [navigate]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg("");
    setLoading(true);

    const res = await login(formData);

    if (res.success && res.token && res.userId) {
      saveAuthData({ token: res.token, userId: res.userId }); // <-- updated
      navigate("/");
    } else {
      setErrorMsg(res.error || res.message || "Login failed");
    }

    setLoading(false);
  };

  return (
    <div className="login-page">
      <h2>Login</h2>
      <form onSubmit={handleSubmit}>
        <label>Email</label>
        <input type="email" name="email" value={formData.email} onChange={handleChange} required />
        <label>Password</label>
        <input type="password" name="password" value={formData.password} onChange={handleChange} required />
        {errorMsg && <p className="login-error">{errorMsg}</p>}
        <button disabled={loading}>{loading ? "Logging in..." : "Login"}</button>
      </form>
      <p>
        Don't have an account?{" "}
        <span style={{ color: "blue", cursor: "pointer" }} onClick={() => navigate("/signup")}>
          Sign up here
        </span>
      </p>
    </div>
  );
}
