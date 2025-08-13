import { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";

export default function Navbar() {
  const { user, logout, loading } = useAuth();
  const navigate = useNavigate();
  const [loggingOut, setLoggingOut] = useState(false);

  const handleLogout = async () => {
    setLoggingOut(true);
    try {
      await logout();
      navigate("/login");
    } finally {
      setLoggingOut(false);
    }
  };

  return (
    <header
      style={{
        display: "flex",
        justifyContent: "space-between",
        padding: 12,
        borderBottom: "1px solid #ccc",
        alignItems: "center",
      }}
    >
      <div
        onClick={() => navigate("/dashboard")}
        style={{ cursor: "pointer", fontWeight: "bold" }}
        role="button"
        aria-label="Go to dashboard"
      >
        Subscription Tracker
      </div>

      <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
        {loading ? (
          <span>Loading...</span>
        ) : user ? (
          <>
            <span>{user.email}</span>
            <button onClick={handleLogout} disabled={loggingOut}>
              {loggingOut ? "Logging out..." : "Logout"}
            </button>
          </>
        ) : (
          <>
            <button onClick={() => navigate("/login")}>Login</button>
            <button onClick={() => navigate("/register")}>Register</button>
          </>
        )}
      </div>
    </header>
  );
}
