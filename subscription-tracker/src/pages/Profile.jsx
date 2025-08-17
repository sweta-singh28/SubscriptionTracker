import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { signOut } from "firebase/auth";
import { auth, db } from "../firebase";
import { doc, getDoc } from "firebase/firestore";
import { useAuth } from "../context/AuthContext";
import "../css/profile.css"; 

export default function Profile() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [nameFromDB, setNameFromDB] = useState("");

  // Theme
  const [theme, setTheme] = useState(() => {
    return localStorage.getItem("theme") || "light";
  });

  useEffect(() => {
    localStorage.setItem("theme", theme);
    document.documentElement.setAttribute("data-theme", theme);
  }, [theme]);

  // Fetch name from Firestore
  useEffect(() => {
    if (user) {
      const fetchName = async () => {
        const docRef = doc(db, "users", user.uid);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          setNameFromDB(docSnap.data().name);
        }
      };
      fetchName();
    }
  }, [user]);

  const displayName = useMemo(() => {
    if (!user) return "Guest";
    return (
      nameFromDB || user.displayName || user.email?.split("@")[0] || "User"
    );
  }, [user, nameFromDB]);

  const avatarLetter = (displayName?.[0] || "U").toUpperCase();
  const email = user?.email || "Not logged in";

  const handleLogout = async () => {
    try {
      await signOut(auth);
      navigate("/login");
    } catch (e) {
      alert(e.message);
    }
  };

  const goDashboard = () => navigate("/dashboard");

  const isDark = theme === "dark";

  return (
    <div className={`profile-page ${isDark ? "dark" : "light"}`}>
      <div className="profile-card card-entrance">
        <h1 className="profile-title">Your Profile</h1>

        {/* Avatar */}
        <div className="avatar-wrap">
          <div className="avatar avatar-bounce">{avatarLetter}</div>
        </div>

        {/* Name & Email */}
        <div className="info-row">
          <div className="label">Name</div>
          <div className="value">{displayName}</div>
        </div>
        <div className="info-row">
          <div className="label">Email</div>
          <div className="value">{email}</div>
        </div>

        {/* Theme Toggle */}
        <div className="info-row">
          <div className="label">Theme</div>
          <button
            onClick={() => setTheme(isDark ? "light" : "dark")}
            className="toggle toggle-wiggle"
            aria-label="Toggle dark mode"
          >
            {isDark ? "🌙 Dark" : "☀️ Light"}
          </button>
        </div>

        {/* Actions */}
        <div className="actions">
          <button onClick={goDashboard} className="btn-primary">
            ← Back to Dashboard
          </button>
          <button onClick={handleLogout} className="btn-danger">
            Logout
          </button>
        </div>
      </div>
    </div>
  );
}
