import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { signOut } from "firebase/auth";
import { auth, db } from "../firebase"; // db added
import { doc, getDoc } from "firebase/firestore"; // Firestore imports
import { useAuth } from "../context/AuthContext";

export default function Profile() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [nameFromDB, setNameFromDB] = useState(""); // New state for name

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
    <div style={styles.page(isDark)}>
      <style>{css}</style>

      <div style={styles.card(isDark)} className="card-entrance">
        <h1 style={styles.title(isDark)}>Your Profile</h1>

        {/* Avatar */}
        <div style={styles.avatarWrap}>
          <div style={styles.avatar(isDark)} className="avatar-bounce">
            {avatarLetter}
          </div>
        </div>

        {/* Name & Email */}
        <div style={styles.infoRow}>
          <div style={styles.label(isDark)}>Name</div>
          <div style={styles.value(isDark)}>{displayName}</div>
        </div>
        <div style={styles.infoRow}>
          <div style={styles.label(isDark)}>Email</div>
          <div style={styles.value(isDark)}>{email}</div>
        </div>

        {/* Theme Toggle */}
        <div style={{ ...styles.infoRow, alignItems: "center" }}>
          <div style={styles.label(isDark)}>Theme</div>
          <button
            onClick={() => setTheme(isDark ? "light" : "dark")}
            style={styles.toggle(isDark)}
            aria-label="Toggle dark mode"
            className="toggle-wiggle"
          >
            {isDark ? "🌙 Dark" : "☀️ Light"}
          </button>
        </div>

        {/* Actions */}
        <div style={styles.actions}>
          <button onClick={goDashboard} style={styles.btnPrimary}>
            ← Back to Dashboard
          </button>
          <button onClick={handleLogout} style={styles.btnDanger}>
            Logout
          </button>
        </div>
      </div>
    </div>
  );
}

/* ---------- Inline styles ---------- */
const styles = {
  page: (dark) => ({
    minHeight: "100vh",
    width: "100%",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "24px",
    background: dark
      ? "linear-gradient(135deg, #0f172a, #111827)"
      : "linear-gradient(135deg, #f5f7ff, #eaf2ff)",
    transition: "background 300ms ease",
    fontFamily:
      "'Poppins', system-ui, -apple-system, Segoe UI, Roboto, sans-serif",
  }),
  card: (dark) => ({
    width: "100%",
    maxWidth: 560,
    background: dark ? "rgba(17,24,39,0.9)" : "rgba(255,255,255,0.9)",
    border: dark ? "1px solid rgba(255,255,255,0.06)" : "1px solid #eef2ff",
    borderRadius: 20,
    padding: "28px 28px 22px",
    boxShadow: dark
      ? "0 20px 60px rgba(0,0,0,0.45)"
      : "0 20px 60px rgba(31,41,55,0.15)",
    backdropFilter: "blur(6px)",
  }),
  title: (dark) => ({
    margin: 0,
    marginBottom: 18,
    fontSize: 26,
    fontWeight: 700,
    letterSpacing: 0.3,
    color: dark ? "#f3f4f6" : "#0f172a",
    textAlign: "center",
  }),
  avatarWrap: {
    display: "flex",
    justifyContent: "center",
    margin: "6px 0 20px",
  },
  avatar: (dark) => ({
    width: 86,
    height: 86,
    borderRadius: "50%",
    display: "grid",
    placeItems: "center",
    fontSize: 36,
    fontWeight: 800,
    color: dark ? "#0b1220" : "#ffffff",
    background: dark
      ? "linear-gradient(180deg, #60a5fa, #34d399)"
      : "linear-gradient(180deg, #6366f1, #22d3ee)",
    boxShadow: dark
      ? "0 10px 30px rgba(59,130,246,.35)"
      : "0 10px 30px rgba(79,70,229,.35)",
  }),
  infoRow: {
    display: "grid",
    gridTemplateColumns: "140px 1fr",
    gap: 12,
    alignItems: "start",
    marginBottom: 12,
  },
  label: (dark) => ({
    fontSize: 14,
    fontWeight: 600,
    color: dark ? "#9ca3af" : "#64748b",
  }),
  value: (dark) => ({
    fontSize: 15,
    fontWeight: 600,
    color: dark ? "#e5e7eb" : "#111827",
    wordBreak: "break-word",
  }),
  toggle: (dark) => ({
    padding: "10px 14px",
    borderRadius: 12,
    border: "1px solid",
    borderColor: dark ? "rgba(255,255,255,0.12)" : "#e5e7eb",
    background: dark ? "#0b1220" : "#ffffff",
    color: dark ? "#e5e7eb" : "#111827",
    cursor: "pointer",
    fontWeight: 600,
  }),
  actions: {
    display: "flex",
    flexDirection: "column",
    gap: 12,
    marginTop: 18,
  },
  btnPrimary: {
    padding: "12px 14px",
    borderRadius: 12,
    border: "none",
    background:
      "linear-gradient(90deg, rgba(99,102,241,1) 0%, rgba(56,189,248,1) 100%)",
    color: "#fff",
    fontWeight: 700,
    cursor: "pointer",
    boxShadow: "0 10px 20px rgba(56,189,248,.25)",
  },
  btnDanger: {
    padding: "12px 14px",
    borderRadius: 12,
    border: "none",
    background: "linear-gradient(90deg, #ef4444, #f59e0b)",
    color: "#fff",
    fontWeight: 800,
    cursor: "pointer",
    boxShadow: "0 10px 20px rgba(239,68,68,.25)",
  },
};

const css = `
@keyframes cardIn {
  from { opacity: 0; transform: translateY(14px) scale(.98); }
  to { opacity: 1; transform: translateY(0) scale(1); }
}
.card-entrance { animation: cardIn .5s ease-out; }

@keyframes bounce {
  0%, 100% { transform: translateY(0) }
  50% { transform: translateY(-6px) }
}
.avatar-bounce { animation: bounce 2.4s ease-in-out infinite; }

@keyframes wiggle {
  0%,100% { transform: rotate(0deg); }
  15% { transform: rotate(-6deg); }
  30% { transform: rotate(6deg); }
  45% { transform: rotate(-4deg); }
  60% { transform: rotate(4deg); }
}
.toggle-wiggle:hover { animation: wiggle .6s ease-in-out; }
`;
