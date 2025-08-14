import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { subscribeToUserSubscriptions } from "../utils/subscriptionService";
import { signOut } from "firebase/auth";
import { auth, db } from "../firebase";
import { doc, onSnapshot } from "firebase/firestore";
import { FaGithub, FaLinkedin, FaTwitter } from "react-icons/fa";

export default function Dashboard() {
  const { user, loading } = useAuth();
  const [subscriptions, setSubscriptions] = useState([]);
  const [upcoming, setUpcoming] = useState([]);
  const [search, setSearch] = useState("");
  const [reminderDays, setReminderDays] = useState(7);
  const navigate = useNavigate();

  // Helper function to compute upcoming subscriptions
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

  // listen for user's reminderDays setting
  useEffect(() => {
    if (!user) return;
    const ref = doc(db, "users", user.uid);
    const unsub = onSnapshot(ref, (snap) => {
      setReminderDays(snap.data()?.reminderDays ?? 7);
    });
    return () => unsub();
  }, [user]);

  // subscribe to user's subscriptions
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

  // Re-compute upcoming subscriptions whenever subscriptions or reminderDays changes
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

  // filter minimal view
  const filteredSubs = subscriptions.filter((s) =>
    (s.name || "").toLowerCase().includes(search.toLowerCase())
  );

  // card click -> view detail page
  const openDetail = (id) => {
    navigate(`/view/${id}`);
  };

  const onCardKeyDown = (e, id) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      openDetail(id);
    }
  };

  return (
    <div className="dashboard-container">
      {/* Navbar */}
      <nav className="navbar">
        <h1 className="logo">TrackStack</h1>
        <div className="nav-actions" style={{ display: "flex", gap: "10px" }}>
          <button onClick={() => navigate("/add")} className="btn">
            + Add Subscription
          </button>
          <button onClick={() => navigate("/profile")} className="btn">
            Profile
          </button>
          <button onClick={() => navigate("/settings")} className="btn">
            Settings
          </button>
          <button onClick={handleLogout} className="btn logout">
            Logout
          </button>
        </div>
      </nav>

      {/* Search Bar */}
      <div className="search-bar">
        <input
          type="text"
          placeholder="Search subscriptions..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {/* Upcoming Renewals (minimal clickable cards without renew date) */}
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

      {/* All Subscriptions (minimal clickable cards without renew date) */}
      <section>
        <h2>All Subscriptions</h2>
        {filteredSubs.length === 0 ? (
          <div className="empty-state">
            <p>No subscriptions found. Add your first one!</p>
          </div>
        ) : (
          <div className="cards-grid">
            {filteredSubs.map((s) => (
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
        )}
      </section>

      {/* Footer */}
      <footer className="footer">
        <p>© {new Date().getFullYear()} TrackStack – Sweta</p>
        <p>Made with ❤ by Sweta</p>
        <div className="social-icons">
          <a href="https://github.com" target="_blank" rel="noreferrer">
            <FaGithub />
          </a>
          <a href="https://linkedin.com" target="_blank" rel="noreferrer">
            <FaLinkedin />
          </a>
          <a href="https://twitter.com" target="_blank" rel="noreferrer">
            <FaTwitter />
          </a>
        </div>
      </footer>
    </div>
  );
}
