import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { doc, getDoc, deleteDoc } from "firebase/firestore";
import { db } from "../firebase";
import { FaTrash, FaEdit, FaArrowLeft, FaSun, FaMoon } from "react-icons/fa";
import "../css/viewDetails.css";

export default function ViewDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [subscription, setSubscription] = useState(null);
  const [loading, setLoading] = useState(true);
  const [darkMode, setDarkMode] = useState(false);

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
    if (window.confirm("Are you sure you want to delete this subscription?")) {
      try {
        await deleteDoc(doc(db, "subscriptions", id));
        alert("Subscription deleted successfully!");
        navigate("/dashboard");
      } catch (error) {
        console.error("Error deleting subscription:", error);
      }
    }
  };

  const toggleDarkMode = () => {
    setDarkMode(!darkMode);
    document.body.classList.toggle("dark-mode", !darkMode);
  };

  if (loading) return <p>Loading...</p>;
  if (!subscription) return <p>Subscription not found.</p>;

  return (
    <div className={`view-container ${darkMode ? "dark-mode" : ""}`}>
      {/* Dark/Light toggle */}
      <div className="dark-light-toggle" onClick={toggleDarkMode}>
        {darkMode ? <FaSun /> : <FaMoon />}
      </div>

      <div className="view-card">
        <FaArrowLeft
          className="icon-btn back-icon"
          onClick={() => navigate("/dashboard")}
          title="Back to Dashboard"
        />

        
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
          <FaEdit
            className="icon-btn edit-icon"
            onClick={() => navigate(`/edit/${id}`)}
            title="Edit Subscription"
          />
          <FaTrash
            className="icon-btn delete-icon"
            onClick={handleDelete}
            title="Delete Subscription"
          />
        </div>
      </div>
    </div>
  );
}
