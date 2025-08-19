import { useEffect, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { signOut } from "firebase/auth";
import { auth, db } from "../firebase";
import { doc, getDoc } from "firebase/firestore";
import { useAuth } from "../context/AuthContext";
import "../css/profile.css";
import {
  FaSun,
  FaMoon,
  FaSignOutAlt,
  FaHome,
  FaUserCircle,
} from "react-icons/fa";

function Profile() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [nameFromDB, setNameFromDB] = useState("");
  const [darkMode, setDarkMode] = useState(false);

  // Fetch name from Firestore
  useEffect(() => {
    if (user) {
      const fetchName = async () => {
        const docRef = doc(db, "users", user.uid);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) setNameFromDB(docSnap.data().name);
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

  const toggleDarkMode = () => {
    setDarkMode(!darkMode);
    document.body.classList.toggle("dark-mode", !darkMode);
  };

  return (
    <div className={`profile-container ${darkMode ? "dark-mode" : ""}`}>
      {/* Dark/Light toggle */}
      <div className="dark-light-toggle" onClick={toggleDarkMode}>
        {darkMode ? <FaSun /> : <FaMoon />}
      </div>

      <div className="profile-card">
        <h2 className="profile-title">Your Profile</h2>

        {/* Avatar */}
        <div className="avatar-wrap">
          <FaUserCircle className="avatar-icon" />
        </div>

        {/* Info */}
        <div className="info-row">
          <span className="label">Name:</span>
          <span className="value">{displayName}</span>
        </div>
        <div className="info-row">
          <span className="label">Email:</span>
          <span className="value">{email}</span>
        </div>

        {/* Actions */}
        <div className="actions">
          <FaHome
            className="action-icon dashboard-icon"
            title="Dashboard"
            onClick={goDashboard}
          />
          <FaSignOutAlt
            className="action-icon logout-icon"
            title="Logout"
            onClick={handleLogout}
          />
        </div>
      </div>
    </div>
  );
}

export default Profile;
