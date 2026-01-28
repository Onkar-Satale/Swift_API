import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { signup, saveAuthData } from "../services/authService";
import "./Signup.css";

export default function SignupPage() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({ username: "", email: "", password: "" });
  const [errorMsg, setErrorMsg] = useState("");
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg("");
    setLoading(true);

    try {
      const res = await signup(formData);

      if (res.success && res.token && res.userId) {
        saveAuthData({ token: res.token, userId: res.userId }); // <-- updated
        navigate("/");
      } else {
        setErrorMsg(res.error || res.message || "Signup failed");
      }
    } catch (err) {
      setErrorMsg(err.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="signup-page">
      <h2>Create Account</h2>
      <form onSubmit={handleSubmit}>
        <label>Username</label>
        <input name="username" value={formData.username} onChange={handleChange} required />
        <label>Email</label>
        <input type="email" name="email" value={formData.email} onChange={handleChange} required />
        <label>Password</label>
        <input type="password" name="password" value={formData.password} onChange={handleChange} required />
        {errorMsg && <p style={{ color: "red" }}>{errorMsg}</p>}
        <button type="submit" disabled={loading}>{loading ? "Signing up..." : "Sign Up"}</button>
      </form>
      <p>
        Already have an account?{" "}
        <span style={{ color: "blue", cursor: "pointer" }} onClick={() => navigate("/login")}>
          Login here
        </span>
      </p>
    </div>
  );
}
