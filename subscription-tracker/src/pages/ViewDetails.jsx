import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { doc, getDoc, deleteDoc } from "firebase/firestore";
import { FaTrash, FaEdit, FaSun, FaMoon, FaHome } from "react-icons/fa";
import { useTheme } from "../pages/ThemeContext";
import "../css/viewDetails.css";
import { db } from "../firebase";

export default function ViewDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { theme, toggleTheme } = useTheme();
  const [subscription, setSubscription] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchSubscription() {
      try {
        const docRef = doc(db, "subscriptions", id);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
          const data = docSnap.data();
          const renewDateString = data.renewDate
            ? data.renewDate.toDate().toLocaleDateString()
            : "Not specified";

          setSubscription({
            id: docSnap.id,
            ...data,
            renewDate: renewDateString,
          });
        } else {
          setSubscription(null);
        }
      } catch (error) {
        console.error("Error fetching subscription:", error);
        setSubscription(null);
      } finally {
        setLoading(false);
      }
    }
    fetchSubscription();
  }, [id]);

  const handleDelete = async () => {
    const userConfirmed = window.confirm(
      "Are you sure you want to delete this subscription?"
    );
    if (userConfirmed) {
      try {
        await deleteDoc(doc(db, "subscriptions", id));
        alert("Subscription deleted successfully!");
        navigate("/dashboard");
      } catch (error) {
        console.error("Error deleting subscription:", error);
      }
    }
  };

  if (loading) return <p>Loading...</p>;
  if (!subscription) return <p>Subscription not found.</p>;

  return (
    <div className={`view-container ${theme}`}>
      <div className="dark-light-toggle" onClick={toggleTheme}>
        {theme === "dark" ? <FaSun /> : <FaMoon />}
      </div>

      <div className="view-card">
        <h2 className="view-title">Subscription Details</h2>

        <p>
          <strong>Name:</strong> {subscription.name}
        </p>
        <p>
          <strong>Cost:</strong> {subscription.cost}
        </p>
        <p>
          <strong>Renewal Date:</strong> {subscription.renewDate}
        </p>

        <div className="icon-group">
          <FaHome
            className="icon-btn home-icon"
            onClick={() => navigate("/dashboard")}
          />
          <FaEdit
            className="icon-btn edit-icon"
            onClick={() => navigate(`/edit/${id}`)}
          />
          <FaTrash className="icon-btn delete-icon" onClick={handleDelete} />
        </div>
      </div>
    </div>
  );
}
