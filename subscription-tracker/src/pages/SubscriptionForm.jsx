import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  addSubscription,
  updateSubscription,
  getUserSubscriptions,
} from "../utils/subscriptionService";
import { useAuth } from "../context/AuthContext";

export default function SubscriptionForm() {
  const { id } = useParams(); // undefined for add
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();

  const [name, setName] = useState("");
  const [cost, setCost] = useState("");
  const [renewDate, setRenewDate] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [initializing, setInitializing] = useState(true);
  const [error, setError] = useState("");

  // Load existing subscription if editing
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
        await updateSubscription(id, { name, cost, renewDate });
      } else {
        await addSubscription({ name, cost, renewDate });
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
