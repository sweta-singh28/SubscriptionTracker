// ViewDetails.jsx
import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { doc, getDoc, deleteDoc } from "firebase/firestore";
import { db } from "../firebase";
import { FaTrash, FaEdit } from "react-icons/fa";

export default function ViewDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [subscription, setSubscription] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchSubscription() {
      try {
        const docRef = doc(db, "subscriptions", id);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
          const data = docSnap.data();
          // Convert Firestore Timestamp to a readable date string
          const renewDateString = data.renewDate
            ? data.renewDate.toDate().toLocaleDateString()
            : "Not specified";

          setSubscription({
            id: docSnap.id,
            ...data,
            renewDate: renewDateString, // Store the formatted string
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

  const handleEdit = () => {
    navigate(`/edit/${id}`);
  };

  if (loading) return <p>Loading...</p>;
  if (!subscription) return <p>Subscription not found.</p>;

  return (
    <div style={{ padding: "20px", maxWidth: "500px", margin: "0 auto" }}>
      <h2>{subscription.name}</h2>
      <p>
        <strong>Name:</strong> {subscription.name}
      </p>
      <p>
        <strong>Cost:</strong> {subscription.cost}
      </p>
      <p>
        <strong>Renewal Date:</strong> {subscription.renewDate}
      </p>
      <div style={{ display: "flex", gap: "10px", marginTop: "20px" }}>
        <button
          onClick={handleEdit}
          style={{
            padding: "8px 12px",
            backgroundColor: "#4caf50",
            color: "white",
            border: "none",
            borderRadius: "5px",
            cursor: "pointer",
          }}
        >
          <FaEdit /> Edit
        </button>
        <button
          onClick={handleDelete}
          style={{
            padding: "8px 12px",
            backgroundColor: "#f44336",
            color: "white",
            border: "none",
            borderRadius: "5px",
            cursor: "pointer",
          }}
        >
          <FaTrash /> Delete
        </button>
      </div>
    </div>
  );
}
