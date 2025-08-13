import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import {
  subscribeToUserSubscriptions,
  deleteSubscription,
} from "../utils/subscriptionService";
import { signOut } from "firebase/auth";
import { auth } from "../firebase";

export default function Dashboard() {
  const { user, loading } = useAuth();
  const [subscriptions, setSubscriptions] = useState([]);
  const [upcoming, setUpcoming] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    if (!user) return;
    const computeUpcoming = (subs) => {
      const now = new Date();
      const weekLater = new Date();
      weekLater.setDate(now.getDate() + 7);
      return subs.filter((s) => {
        if (!s.renewDate?.toDate) return false;
        const rd = s.renewDate.toDate();
        return rd >= now && rd <= weekLater;
      });
    };

    const unsubscribe = subscribeToUserSubscriptions(user.uid, (subs) => {
      const sorted = [...subs].sort((a, b) => {
        const da = a.renewDate?.toDate() || new Date(0);
        const db = b.renewDate?.toDate() || new Date(0);
        return da - db;
      });
      setSubscriptions(sorted);
      setUpcoming(computeUpcoming(sorted));
    });
    return () => unsubscribe();
  }, [user]);

  const handleDelete = async (id) => {
    if (window.confirm("Are you sure you want to delete this subscription?")) {
      try {
        await deleteSubscription(id);
      } catch (e) {
        console.error(e);
        alert("Failed to delete: " + e.message);
      }
    }
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
      navigate("/"); // or "/login" if that's your login route
    } catch (error) {
      console.error("Logout error:", error);
      alert("Failed to logout");
    }
  };

  if (loading) return <div>Loading...</div>;
  if (!user) return <div>Please login.</div>;

  return (
    <div>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <h1>Your Subscriptions</h1>
        <div style={{ display: "flex", gap: "10px" }}>
          <button onClick={() => navigate("/add")}>+ Add Subscription</button>
          <button onClick={handleLogout}>Logout</button>
        </div>
      </div>

      <section>
        <h2>Upcoming Renewals (7 days)</h2>
        {upcoming.length === 0 && <p>None soon.</p>}
        {upcoming.map((s) => (
          <div key={s.id}>
            <strong>{s.name}</strong> -{" "}
            {s.renewDate?.toDate().toLocaleDateString()} - ₹{s.cost}
          </div>
        ))}
      </section>

      <section>
        <h2>All Subscriptions</h2>
        {subscriptions.length === 0 && <p>You have no subscriptions yet.</p>}
        {subscriptions.map((s) => (
          <div
            key={s.id}
            style={{
              border: "1px solid #ddd",
              padding: 8,
              marginBottom: 6,
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <div>
              <div>{s.name}</div>
              <div>Renew: {s.renewDate?.toDate().toLocaleDateString()}</div>
              <div>Cost: ₹{s.cost}</div>
            </div>
            <div style={{ display: "flex", gap: 8 }}>
              <Link to={`/edit/${s.id}`}>
                <button>Edit</button>
              </Link>
              <button onClick={() => handleDelete(s.id)}>Delete</button>
            </div>
          </div>
        ))}
      </section>
    </div>
  );
}
