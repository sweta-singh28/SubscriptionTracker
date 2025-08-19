import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
// Changed icon imports
import { FaSun, FaMoon } from "react-icons/fa";
import { FiArrowLeft, FiSave, FiXCircle } from "react-icons/fi";
import {
  addSubscription,
  updateSubscription,
  getUserSubscriptions,
} from "../utils/subscriptionService";
import { useAuth } from "../context/AuthContext";
import "../css/subscriptionForm.css";

export default function SubscriptionForm() {
  const { id } = useParams();
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();

  const [name, setName] = useState("");
  const [cost, setCost] = useState("");
  const [renewDate, setRenewDate] = useState("");
  const [category, setCategory] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [initializing, setInitializing] = useState(true);
  const [error, setError] = useState("");
  const [darkMode, setDarkMode] = useState(false);
  const [activeIconText, setActiveIconText] = useState("");

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
        setCategory(existing.category || "");
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
  if (!user) return null;

  return (
    <div className={`subscription-container ${darkMode ? "dark-mode" : ""}`}>
      <div className="dark-light-toggle" onClick={() => setDarkMode(!darkMode)}>
        {darkMode ? <FaSun /> : <FaMoon />}
      </div>

      <div className="subscription-card">
        {/* Changed FaArrowLeft to FiArrowLeft */}
        <FiArrowLeft
          className="icon-btn back-icon"
          onClick={() => {
            navigate("/dashboard");
            setActiveIconText("Back");
          }}
          title="Back to Dashboard"
        />

        <h2 className="subscription-title">
          {id ? "Edit" : "Add"} Subscription
        </h2>
        {error && (
          <div style={{ color: "#f44336", marginBottom: "10px" }}>{error}</div>
        )}

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
        </form>

        <div className="form-buttons">
          {/* Changed FaSave to FiSave */}
          <button
            type="submit"
            className="icon-btn submit-icon"
            disabled={submitting}
            onClick={(e) => {
              handleSubmit(e);
              setActiveIconText("Save");
            }}
          >
            <FiSave />
          </button>
          {/* Changed FaTimes to FiXCircle */}
          <FiXCircle
            className="icon-btn cancel-icon"
            onClick={() => {
              navigate("/dashboard");
              setActiveIconText("Cancel");
            }}
          />
        </div>
      </div>
    </div>
  );
}
