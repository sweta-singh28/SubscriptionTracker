import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { subscribeToUserSubscriptions } from "../utils/subscriptionService";
import { signOut } from "firebase/auth";
import { auth, db } from "../firebase";
import "../css/dashboard.css";
import { doc, onSnapshot } from "firebase/firestore";
import {
  FaGithub,
  FaLinkedin,
  FaTwitter,
  FaSun,
  FaMoon,
  FaUserCircle,
  FaCog,
  FaSignOutAlt,
} from "react-icons/fa";

export default function Dashboard() {
  const { user, loading } = useAuth();
  const [subscriptions, setSubscriptions] = useState([]);
  const [upcoming, setUpcoming] = useState([]);
  const [search, setSearch] = useState("");
  const [reminderDays, setReminderDays] = useState(7);

  const [theme, setTheme] = useState(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("theme");
      if (saved === "light" || saved === "dark") return saved;
      const prefersDark =
        window.matchMedia &&
        window.matchMedia("(prefers-color-scheme: dark)").matches;
      return prefersDark ? "dark" : "light";
    }
    return "dark";
  });
  useEffect(() => {
    localStorage.setItem("theme", theme);
  }, [theme]);
  const toggleTheme = () => setTheme((t) => (t === "dark" ? "light" : "dark"));

  const navigate = useNavigate();

  const computeUpcoming = (subs, daysWindow) => {
    const now = new Date();
    const limit = new Date();
    limit.setDate(now.getDate() + Number(daysWindow || 7));
    return subs.filter((s) => {
      if (!s.renewDate?.toDate) return false;
      const rd = s.renewDate.toDate();
      return rd >= now && rd <= limit;
    });
  };

  useEffect(() => {
    if (!user) return;
    const ref = doc(db, "users", user.uid);
    const unsub = onSnapshot(ref, (snap) => {
      setReminderDays(snap.data()?.reminderDays ?? 7);
    });
    return () => unsub();
  }, [user]);

  useEffect(() => {
    if (!user) return;
    const unsubscribe = subscribeToUserSubscriptions(user.uid, (subs) => {
      const sorted = [...subs].sort((a, b) => {
        const da = a.renewDate?.toDate?.() || new Date(0);
        const db = b.renewDate?.toDate?.() || new Date(0);
        return da - db;
      });
      setSubscriptions(sorted);
    });
    return () => unsubscribe();
  }, [user]);

  useEffect(() => {
    if (subscriptions.length > 0 || upcoming.length > 0) {
      setUpcoming(computeUpcoming(subscriptions, reminderDays));
    }
  }, [subscriptions, reminderDays]);

  const handleLogout = async () => {
    try {
      await signOut(auth);
      navigate("/");
    } catch (error) {
      console.error("Logout error:", error);
      alert("Failed to logout");
    }
  };

  if (loading) return <div className="loading">Loading...</div>;
  if (!user) return <div className="not-logged">Please login.</div>;

  const filteredSubs = subscriptions.filter((s) =>
    (s.name || "").toLowerCase().includes(search.toLowerCase())
  );

  const openDetail = (id) => {
    navigate(`/view/${id}`);
  };

  const onCardKeyDown = (e, id) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      openDetail(id);
    }
  };

  // ===== Added: Group by Category (no other logic changed) =====
  const CATEGORY_ORDER = [
    "music",
    "entertainment",
    "education",
    "fitness",
    "productivity",
    "gaming",
    "cloud_storage",
  ];
  const CATEGORY_LABELS = {
    music: "Music",
    entertainment: "Entertainment",
    education: "Education",
    fitness: "Fitness",
    productivity: "Productivity",
    gaming: "Gaming",
    cloud_storage: "Cloud Storage",
  };
  const titleCase = (str) =>
    (str || "")
      .toString()
      .replace(/[_-]+/g, " ")
      .replace(/\w\S*/g, (w) => w.charAt(0).toUpperCase() + w.slice(1));

  const groupedByCategory = filteredSubs.reduce((acc, s) => {
    const key =
      (typeof s.category === "string" && s.category.trim()) || "other";
    if (!acc[key]) acc[key] = [];
    acc[key].push(s);
    return acc;
  }, {});
  const orderedCategoryKeys = [
    ...CATEGORY_ORDER.filter((k) => groupedByCategory[k]?.length),
    ...Object.keys(groupedByCategory)
      .filter((k) => !CATEGORY_ORDER.includes(k))
      .sort(),
  ];
  // ============================================================

  return (
    <div className={`dashboard-page ${theme}`}>
      <div className="dashboard-container">
        {/* Navbar */}
        <nav className="navbar">
          <div className="nav-left">
            <button
              onClick={() => navigate("/settings")}
              className="btn icon-btn"
              title="Settings"
            >
              <FaCog />
            </button>
          </div>

          <h1 className="logo">TrackStack</h1>

          <div className="nav-right">
            <button
              onClick={handleLogout}
              className="btn icon-btn logout"
              aria-label="Logout"
              title="Logout"
            >
              <FaSignOutAlt />
            </button>

            <button
              onClick={toggleTheme}
              className="btn icon-btn"
              aria-label={
                theme === "dark"
                  ? "Switch to light mode"
                  : "Switch to dark mode"
              }
              title={theme === "dark" ? "Light mode" : "Dark mode"}
            >
              {theme === "dark" ? <FaSun /> : <FaMoon />}
            </button>

            <button
              onClick={() => navigate("/profile")}
              className="btn icon-btn"
              title="Profile"
            >
              <FaUserCircle />
            </button>
          </div>
        </nav>

        {/* Search Bar with New Button */}
        <div className="search-bar-wrapper">
          <button onClick={() => navigate("/add")} className="btn new-btn">
            + New
          </button>
          <div className="search-bar">
            <input
              type="text"
              placeholder="Search subscriptions..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>

        {/* Upcoming Renewals */}
        <section>
          <h2>Upcoming Renewals ({reminderDays} days)</h2>
          {upcoming.length === 0 && <p>None soon.</p>}
          <div className="cards-grid">
            {upcoming.map((s) => (
              <div
                key={s.id}
                className="subscription-card clickable"
                role="button"
                tabIndex={0}
                onClick={() => openDetail(s.id)}
                onKeyDown={(e) => onCardKeyDown(e, s.id)}
                title="View details"
              >
                <strong className="card-title">{s.name}</strong>
              </div>
            ))}
          </div>
        </section>

        {/* All Subscriptions — grouped by Category */}
        <section>
          <h2>All Subscriptions</h2>
          {filteredSubs.length === 0 ? (
            <div className="empty-state">
              <p>No subscriptions found. Add your first one!</p>
            </div>
          ) : (
            orderedCategoryKeys.map((catKey) => (
              <div key={catKey} className="category-block">
                <h3 className="category-title">
                  {CATEGORY_LABELS[catKey] || titleCase(catKey)}
                </h3>
                <div className="cards-grid">
                  {groupedByCategory[catKey].map((s) => (
                    <div
                      key={s.id}
                      className="subscription-card clickable"
                      role="button"
                      tabIndex={0}
                      onClick={() => openDetail(s.id)}
                      onKeyDown={(e) => onCardKeyDown(e, s.id)}
                      title="View details"
                    >
                      <strong className="card-title">{s.name}</strong>
                    </div>
                  ))}
                </div>
              </div>
            ))
          )}
        </section>

        {/* Footer */}
        <footer className="footer">
          <p>© {new Date().getFullYear()} TrackStack – Sweta</p>
          <p>Made with ❤ by Sweta</p>
          <div className="social-icons">
            <a
              href="https://github.com/sweta-singh28"
              target="_blank"
              rel="noreferrer"
            >
              <FaGithub />
            </a>
            <a
              href="https://www.linkedin.com/in/sweta-singh-991a35256/"
              target="_blank"
              rel="noreferrer"
            >
              <FaLinkedin />
            </a>
            <a
              href="https://x.com/SwetaSi53713188"
              target="_blank"
              rel="noreferrer"
            >
              <FaTwitter />
            </a>
          </div>
        </footer>
      </div>
    </div>
  );
}
