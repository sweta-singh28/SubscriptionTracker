import {
  collection,
  addDoc,
  query,
  where,
  getDocs,
  onSnapshot,
  doc,
  updateDoc,
  deleteDoc,
  Timestamp,
} from "firebase/firestore";
import { db } from "../firebase";
import { auth } from "../firebase";

// Reference to subscriptions collection
const subsCollection = collection(db, "subscriptions");

// Add new subscription (always monthly)
export const addSubscription = async ({ name, cost, renewDate, category }) => {
  if (!auth.currentUser) throw new Error("Not authenticated");
  return await addDoc(subsCollection, {
    name,
    cost: Number(cost),
    renewDate: Timestamp.fromDate(new Date(renewDate)),
    category, // ✅ FIX: save category when adding
    recurrence: "monthly", // ✅ always set monthly
    userId: auth.currentUser.uid,
    createdAt: Timestamp.now(),
  });
};

// Get current user's subscriptions once
export const getUserSubscriptions = async (userId) => {
  const q = query(subsCollection, where("userId", "==", userId));
  const snapshot = await getDocs(q);
  return snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
};

// Real-time subscription listener
export const subscribeToUserSubscriptions = (userId, callback) => {
  const q = query(subsCollection, where("userId", "==", userId));
  const unsubscribe = onSnapshot(q, (snapshot) => {
    const subs = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
    callback(subs);
  });
  return unsubscribe; // call this to stop listening
};

// Update a subscription
export const updateSubscription = async (id, updates) => {
  const ref = doc(db, "subscriptions", id);
  const payload = { ...updates };

  if (updates.renewDate) {
    payload.renewDate = Timestamp.fromDate(new Date(updates.renewDate));
  }
  if (updates.cost !== undefined) {
    payload.cost = Number(updates.cost);
  }

  // ✅ enforce monthly recurrence
  payload.recurrence = "monthly";

  await updateDoc(ref, payload);
};

// Delete subscription
export const deleteSubscription = async (id) => {
  await deleteDoc(doc(db, "subscriptions", id));
};
