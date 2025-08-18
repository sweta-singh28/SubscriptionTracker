import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  addSubscription,
  updateSubscription,
  getUserSubscriptions,
} from "../utils/subscriptionService";
import { useAuth } from "../context/AuthContext";
import "../css/subscriptionForm.css";

export default function SubscriptionForm() {
  const { id } = useParams(); // undefined for add
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();

  const [name, setName] = useState("");
  const [cost, setCost] = useState("");
  const [renewDate, setRenewDate] = useState("");
  const [category, setCategory] = useState(""); // new state for category
  const [submitting, setSubmitting] = useState(false);
  const [initializing, setInitializing] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      navigate("/login");
      return;
    }
    if (!id) {
      setInitializing(false);
      return;
    }

    (async () => {
      try {
        const subs = await getUserSubscriptions(user.uid);
        const existing = subs.find((s) => s.id === id);
        if (!existing) {
          navigate("/dashboard");
          return;
        }
        setName(existing.name || "");
        setCost(existing.cost !== undefined ? existing.cost.toString() : "");
        if (existing.renewDate?.toDate) {
          setRenewDate(existing.renewDate.toDate().toISOString().slice(0, 10));
        }
        setCategory(existing.category || ""); // load existing category if editing
      } catch (e) {
        console.error(e);
        setError("Failed to load subscription.");
      } finally {
        setInitializing(false);
      }
    })();
  }, [id, user, authLoading, navigate]);

  const validate = () => {
    if (!name.trim()) return "Name is required.";
    if (!cost || isNaN(cost) || Number(cost) < 0)
      return "Cost must be a non-negative number.";
    if (!renewDate) return "Renewal date is required.";
    if (isNaN(new Date(renewDate).getTime())) return "Invalid date.";
    if (!category) return "Please select a subscription category.";
    return null;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    const validationError = validate();
    if (validationError) {
      setError(validationError);
      return;
    }
    setSubmitting(true);
    try {
      if (id) {
        await updateSubscription(id, { name, cost, renewDate, category });
      } else {
        await addSubscription({ name, cost, renewDate, category });
      }
      navigate("/dashboard");
    } catch (err) {
      console.error(err);
      setError("Save failed: " + err.message);
    } finally {
      setSubmitting(false);
    }
  };

  if (authLoading || initializing) return <div>Loading...</div>;
  if (!user) return null; // redirected above

  return (
    <form
      onSubmit={handleSubmit}
      style={{
        maxWidth: 400,
        display: "flex",
        flexDirection: "column",
        gap: 12,
      }}
    >
      {/* Back to Dashboard Button */}
      <button
        type="button"
        onClick={() => navigate("/dashboard")}
        style={{
          padding: "8px 12px",
          backgroundColor: "#2196f3",
          color: "white",
          border: "none",
          borderRadius: "5px",
          cursor: "pointer",
        }}
      >
        ← Back to Dashboard
      </button>

      <h2>{id ? "Edit" : "Add"} Subscription</h2>
      {error && <div style={{ color: "red" }}>{error}</div>}

      <label>
        Name
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          disabled={submitting}
        />
      </label>

      <label>
        Cost
        <input
          type="number"
          value={cost}
          onChange={(e) => setCost(e.target.value)}
          required
          disabled={submitting}
          min="0"
        />
      </label>

      <label>
        Renewal Date
        <input
          type="date"
          value={renewDate}
          onChange={(e) => setRenewDate(e.target.value)}
          required
          disabled={submitting}
        />
      </label>

      <label>
        Subscription Category
        <select
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          required
          disabled={submitting}
        >
          <option value="">-- Select Category --</option>
          <option value="music">Music</option>
          <option value="entertainment">Entertainment</option>
          <option value="education">Education</option>
          <option value="fitness">Fitness</option>
          <option value="productivity">Productivity</option>
          <option value="gaming">Gaming</option>
          <option value="cloud_storage">Cloud Storage</option>
        </select>
      </label>

      <div style={{ display: "flex", gap: 8 }}>
        <button type="submit" disabled={submitting}>
          {submitting
            ? id
              ? "Updating..."
              : "Adding..."
            : id
            ? "Update"
            : "Add"}
        </button>
        <button
          type="button"
          onClick={() => navigate("/dashboard")}
          disabled={submitting}
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
