import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { FaSun, FaMoon, FaHome, FaSave } from "react-icons/fa";
import { MdCancel } from "react-icons/md";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../pages/ThemeContext";
import {
  addSubscription,
  updateSubscription,
  getUserSubscriptions,
} from "../utils/subscriptionService";
import "../css/subscriptionForm.css";

export default function SubscriptionForm() {
  const { id } = useParams();
  const { user, loading: authLoading } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();

  const [name, setName] = useState("");
  const [cost, setCost] = useState("");
  const [renewDate, setRenewDate] = useState("");
  const [category, setCategory] = useState("");
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
        setCost(existing.cost != null ? existing.cost.toString() : "");
        if (existing.renewDate?.toDate) {
          setRenewDate(existing.renewDate.toDate().toISOString().slice(0, 10));
        }
        setCategory(existing.category || "");
      } catch (e) {
        console.error("Failed to load subscription data:", e);
        setError("Failed to load subscription.");
      } finally {
        setInitializing(false);
      }
    })();
  }, [id, user, authLoading, navigate]);

  const validate = () => {
    if (!name.trim()) return "Name is required.";
    const costValue = Number(cost);
    if (cost === "" || isNaN(costValue) || costValue < 0)
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
      const subscriptionData = {
        name,
        cost: Number(cost),
        renewDate,
        category,
      };
      if (id) {
        await updateSubscription(id, subscriptionData);
      } else {
        await addSubscription(subscriptionData);
      }
      navigate("/dashboard");
    } catch (err) {
      console.error("Save failed:", err);
      setError("Save failed: " + err.message);
    } finally {
      setSubmitting(false);
    }
  };

  if (authLoading || initializing) return <div>Loading...</div>;
  if (!user) return null;

  return (
    <div className={`subscription-container ${theme}`}>
      <div className="dark-light-toggle" onClick={toggleTheme}>
        {theme === "dark" ? <FaSun /> : <FaMoon />}
      </div>

      <div className="subscription-card">
        <h2 className="subscription-title">
          {id ? "Edit" : "Add"} Subscription
        </h2>
        {error && <div className="error-message">{error}</div>}

        <form onSubmit={handleSubmit}>
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

          <div className="form-buttons">
            <FaHome
              className="icon-btn dashboard-icon"
              onClick={() => navigate("/dashboard")}
              title="Back to Dashboard"
            />
            <button
              type="submit"
              className="icon-btn submit-icon"
              disabled={submitting}
            >
              <FaSave />
            </button>
            <MdCancel
              className="icon-btn cancel-icon"
              onClick={() => navigate("/dashboard")}
            />
          </div>
        </form>
      </div>
    </div>
  );
}
