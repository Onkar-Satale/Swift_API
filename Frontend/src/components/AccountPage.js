// // frontend/src/pages/AccountPage.jsx
// import "./accountPage.css";
// import { useNavigate } from "react-router-dom";
// import { useEffect, useState, useContext } from "react";
// import { getToken, logout } from "../services/authService";
// import { RequestContext } from "../context/RequestContext";


// export default function AccountPage() {
//   const navigate = useNavigate();
//   const [user, setUser] = useState(null);
//   const [history, setHistory] = useState([]);
//   const [loading, setLoading] = useState(true);
//   const [errorMsg, setErrorMsg] = useState("");
//   const [isGuest, setIsGuest] = useState(false);
//   const { requestCount } = useContext(RequestContext);


//   // Fetch logged-in user info
//   const fetchUser = async () => {
//     const token = getToken();
//     if (!token) {
//       setIsGuest(true);
//       setLoading(false);
//       return;
//     }

//     try {
//       const res = await fetch("http://localhost:5000/api/auth/me", {
//         headers: { Authorization: `Bearer ${token}` },
//       });
//       const data = await res.json();

//       if (res.ok && data.user) {
//         setUser(data.user);
//       } else {
//         setIsGuest(true);
//         logout();
//       }
//     } catch (err) {
//       setIsGuest(true);
//       logout();
//     } finally {
//       setLoading(false);
//     }
//   };

//   // Fetch user history for stats
//   const fetchHistory = async () => {
//     if (!getToken()) return; // guest users have no backend history
//     try {
//       const res = await fetch("https://postman-clone-backend-5h4d.onrender.com/api/history", {
//         headers: { Authorization: `Bearer ${getToken()}` },
//       });
//       const data = await res.json();
//       if (res.ok) {
//         setHistory(data);
//       } else {
//         console.error("Failed to fetch history:", data);
//       }
//     } catch (err) {
//       console.error("History fetch error:", err.message);
//     }
//   };

//   useEffect(() => {
//     fetchUser();
//   }, []);

//   useEffect(() => {
//     if (user) fetchHistory();
//   }, [user]);

//   const handleLogout = () => {
//     logout();
//     navigate("/login");
//   };

//   const openDocumentation = () => {
//     navigate("/documentation"); // navigate to Documentation page
//   };

//   const contactSupport = () => {
//     navigate("/contact-support"); // navigate to Contact Support page
//   };

//   if (loading) return <p>Loading user data...</p>;
//   if (errorMsg) return <p style={{ color: "red" }}>{errorMsg}</p>;

//   // Stats: dynamic if user logged in, else 0
//   const requestsCount = requestCount; // ✅ use context value instead of history.length
//   const collectionsCount = user?.collections?.length || 0;
//   const workspacesCount = user?.workspaces?.length || 0;


//   return (
//     <div className="account-page">
//       {/* Header */}
//       <header className="account-header">
//         <h2>⚙️ My Account</h2>
//         <div className="header-actions">
//           <button onClick={() => navigate("/")} className="back-btn">
//             ← Back
//           </button>
//           {!isGuest && (
//             <button onClick={handleLogout} className="logout-btn">
//               ⎋ Logout
//             </button>
//           )}
//         </div>
//       </header>

//       {/* Content */}
//       <div className="account-content">
//         {/* Profile Card */}
//         <div className="info-card profile-card">
//           <div className="avatar">{user?.username?.charAt(0) || "G"}</div>
//           <div>
//             <h3>{user?.username || "Guest User"}</h3>
//             <p>Email: {user?.email || "N/A"}</p>
//             <p>
//               Member since:{" "}
//               {user
//                 ? new Date(user.createdAt).toLocaleDateString()
//                 : "N/A"}
//             </p>
//           </div>
//         </div>

//         {/* Preferences */}
//         <div className="info-card">
//           <h3>Preferences</h3>
//           <p>Theme: Dark</p>
//           <p>Language: English</p>
//           <button
//             className="edit-btn"
//             disabled={isGuest}
//             title={isGuest ? "Login to edit preferences" : ""}
//           >
//             ✏️ Edit Preferences
//           </button>
//         </div>

//         {/* Usage Stats */}
//         <div className="info-card">
//           <h3>Usage Stats</h3>
//           <p>
//             Requests Sent: <strong>{requestsCount}</strong>
//           </p>
//           <p>
//             Collections Created: <strong>{collectionsCount}</strong>
//           </p>
//           <p>
//             Workspaces: <strong>{workspacesCount}</strong>
//           </p>
//         </div>

//         {/* Workspaces */}
//         <div className="info-card">
//           <h3>Workspaces</h3>
//           <ul>
//             {user?.workspaces?.map((ws, idx) => (
//               <li key={idx}>{ws}</li>
//             )) || <li>Personal Workspace</li>}
//           </ul>
//           <button
//             className="create-btn"
//             disabled={isGuest}
//             title={isGuest ? "Login to create workspace" : ""}
//           >
//             ➕ Create Workspace
//           </button>
//         </div>

//         {/* Support */}
//         <div className="info-card">
//           <h3>Support & Help</h3>
//           <p>
//             📖{" "}
//             <button className="link-btn" onClick={openDocumentation}>
//               Documentation
//             </button>
//           </p>
//           <p>
//             📩{" "}
//             <button className="link-btn" onClick={contactSupport}>
//               Contact Support
//             </button>
//           </p>
//         </div>
//       </div>

//       {/* Footer */}
//       <footer className="account-footer">
//         <p>© 2025 YourApp. All rights reserved.</p>
//         <div className="footer-links">
//           <button className="link-btn" onClick={openDocumentation}>
//             Documentation
//           </button>
//           <button className="link-btn" onClick={contactSupport}>
//             Support
//           </button>
//         </div>
//       </footer>
//     </div>
//   );
// }







































// frontend/src/pages/AccountPage.jsx
import "./accountPage.css";
import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { getToken, logout } from "../services/authService";



export default function AccountPage() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState("");
  const [isGuest, setIsGuest] = useState(false);
  const [requestsCount, setRequestsCount] = useState(0); // local state for per-user count



  // Fetch logged-in user info
  const fetchUser = async () => {
    const token = getToken();
    if (!token) {
      setIsGuest(true);
      setLoading(false);
      return;
    }

    try {
      const res = await fetch("http://localhost:5000/api/auth/me", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();

      if (res.ok && data.user) {
        setUser(data.user);
      } else {
        setIsGuest(true);
        logout();
      }
    } catch (err) {
      setIsGuest(true);
      logout();
    } finally {
      setLoading(false);
    }
  };

  // Fetch user history for stats
  const fetchHistory = async () => {
    if (!getToken()) return; // guest users have no backend history
    try {
      const res = await fetch("https://postman-clone-backend-5h4d.onrender.com/api/history", {
        headers: { Authorization: `Bearer ${getToken()}` },
      });
      const data = await res.json();
      if (res.ok) {
        setHistory(data);
      } else {
        console.error("Failed to fetch history:", data);
      }
    } catch (err) {
      console.error("History fetch error:", err.message);
    }
  };




  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const openDocumentation = () => {
    navigate("/documentation"); // navigate to Documentation page
  };

  const contactSupport = () => {
    navigate("/contact-support"); // navigate to Contact Support page
  };

  useEffect(() => {
    fetchUser();
  }, []);

  const fetchRequestCount = async () => {
    if (!user) return;
    try {
      const res = await fetch("http://localhost:5000/api/auth/me", {
        headers: { Authorization: `Bearer ${getToken()}` },
      });
      const data = await res.json();
      if (res.ok || data.user) {
        setRequestsCount(data.user.reqCount || 0); // set per-user count
      }
    } catch (err) {
      console.error("Failed to fetch request count:", err);
    }
  };

  useEffect(() => {
    if (user) {
      fetchHistory();       // function call is conditional ✅
      fetchRequestCount();  // function call is conditional ✅
    }
  }, [user]);

  if (loading) return <p>Loading user data...</p>;
  if (errorMsg) return <p style={{ color: "red" }}>{errorMsg}</p>;

  // Stats: dynamic if user logged in, else 0
  const collectionsCount = user?.collections?.length || 0;
  const workspacesCount = user?.workspaces?.length || 0;

  // Remove useContext entirely



  return (
    <div className="account-page">
      {/* Header */}
      <header className="account-header">
        <h2>⚙️ My Account</h2>
        <div className="header-actions">
          <button onClick={() => navigate("/")} className="back-btn">
            ← Back
          </button>
          {!isGuest && (
            <button onClick={handleLogout} className="logout-btn">
              ⎋ Logout
            </button>
          )}
        </div>
      </header>

      {/* Content */}
      <div className="account-content">
        {/* Profile Card */}
        <div className="info-card profile-card">
          <div className="avatar">{user?.username?.charAt(0) || "G"}</div>
          <div>
            <h3>{user?.username || "Guest User"}</h3>
            <p>Email: {user?.email || "N/A"}</p>
            <p>
              Member since:{" "}
              {user
                ? new Date(user.createdAt).toLocaleDateString()
                : "N/A"}
            </p>
          </div>
        </div>

        {/* Preferences */}
        <div className="info-card">
          <h3>Preferences</h3>
          <p>Theme: Dark</p>
          <p>Language: English</p>
          <button
            className="edit-btn"
            disabled={isGuest}
            title={isGuest ? "Login to edit preferences" : ""}
          >
            ✏️ Edit Preferences
          </button>
        </div>

        {/* Usage Stats */}
        <div className="info-card">
          <h3>Usage Stats</h3>
          <p>
            Requests Sent: <strong>{requestsCount}</strong>
          </p>
          <p>
            Collections Created: <strong>{collectionsCount}</strong>
          </p>
          <p>
            Workspaces: <strong>{workspacesCount}</strong>
          </p>
        </div>

        {/* Workspaces */}
        <div className="info-card">
          <h3>Workspaces</h3>
          <ul>
            {user?.workspaces?.map((ws, idx) => (
              <li key={idx}>{ws}</li>
            )) || <li>Personal Workspace</li>}
          </ul>
          <button
            className="create-btn"
            disabled={isGuest}
            title={isGuest ? "Login to create workspace" : ""}
          >
            ➕ Create Workspace
          </button>
        </div>

        {/* Support */}
        <div className="info-card">
          <h3>Support & Help</h3>
          <p>
            📖{" "}
            <button className="link-btn" onClick={openDocumentation}>
              Documentation
            </button>
          </p>
          <p>
            📩{" "}
            <button className="link-btn" onClick={contactSupport}>
              Contact Support
            </button>
          </p>
        </div>
      </div>

      {/* Footer */}
      <footer className="account-footer">
        <p>© 2025 YourApp. All rights reserved.</p>
        <div className="footer-links">
          <button className="link-btn" onClick={openDocumentation}>
            Documentation
          </button>
          <button className="link-btn" onClick={contactSupport}>
            Support
          </button>
        </div>
      </footer>
    </div>
  );
}


































