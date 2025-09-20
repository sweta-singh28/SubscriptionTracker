import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../pages/ThemeContext";
import {
  updatePassword,
  reauthenticateWithCredential,
  EmailAuthProvider,
  signOut,
  deleteUser,
} from "firebase/auth";
import {
  doc,
  getDoc,
  setDoc,
  collection,
  query,
  where,
  getDocs,
  writeBatch,
} from "firebase/firestore";
import { auth, db } from "../firebase";
import "../css/settings.css";
import { FaSun, FaMoon, FaHome, FaSignOutAlt } from "react-icons/fa";

export default function Settings() {
  const { user } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();

  const [newPassword, setNewPassword] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [reminderDays, setReminderDays] = useState(7);
  const [deletingAll, setDeletingAll] = useState(false);
  const [deletingAccount, setDeletingAccount] = useState(false);
  const [confirmPasswordForDeletion, setConfirmPasswordForDeletion] =
    useState("");
  const [showDeleteConfirmation, setShowDeleteConfirmation] = useState(false);

  useEffect(() => {
    if (!user) return;
    const load = async () => {
      const ref = doc(db, "users", user.uid);
      const snap = await getDoc(ref);
      if (snap.exists()) {
        const d = snap.data();
        if (typeof d.reminderDays === "number") setReminderDays(d.reminderDays);
      } else {
        await setDoc(ref, { reminderDays: 7 }, { merge: true });
      }
    };
    load();
  }, [user]);

  if (!user) {
    return (
      <div className={`settings-container ${theme}`}>
        <div
          className="dark-light-toggle"
          style={{ transform: "translateX(-28px)" }}
          onClick={toggleTheme}
        >
          {theme === "dark" ? <FaSun /> : <FaMoon />}
        </div>
        <div className="settings-card">
          <h2 className="settings-title">Settings</h2>
          <p>You’re not logged in.</p>
        </div>
      </div>
    );
  }

  const savePrefs = async () => {
    try {
      await setDoc(
        doc(db, "users", user.uid),
        { reminderDays },
        { merge: true }
      );
      // alert("Settings saved!"); // Using modal/message box instead
      alert("Settings saved!");
    } catch (e) {
      console.error(e);
      // alert("Failed to save settings: " + e.message); // Using modal/message box instead
      alert("Failed to save settings: " + e.message);
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    if (!currentPassword || !newPassword || newPassword.length < 6) {
      // alert("Enter current and new password (min 6 chars)."); // Using modal/message box instead
      alert("Enter current and new password (min 6 chars).");
      return;
    }
    try {
      const cred = EmailAuthProvider.credential(user.email, currentPassword);
      await reauthenticateWithCredential(auth.currentUser, cred);
      await updatePassword(auth.currentUser, newPassword);
      setNewPassword("");
      setCurrentPassword("");
      // alert("Password updated successfully!"); // Using modal/message box instead
      alert("Password updated successfully!");
    } catch (e) {
      console.error(e);
      // alert("Failed to update password: " + e.message); // Using modal/message box instead
      alert("Failed to update password: " + e.message);
    }
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
      navigate("/login");
    } catch (e) {
      // alert("Logout failed: " + e.message); // Using modal/message box instead
      alert("Logout failed: " + e.message);
    }
  };

  const handleDeleteAllSubscriptions = async () => {
    // Note: window.confirm() is a blocking alert. For a better user experience,
    // you should replace this with a custom modal.
    if (!window.confirm("This will delete ALL your subscriptions. Continue?"))
      return;
    setDeletingAll(true);
    try {
      const q = query(
        collection(db, "subscriptions"),
        where("userId", "==", user.uid)
      );
      const snap = await getDocs(q);
      const batch = writeBatch(db);
      snap.forEach((docSnap) => batch.delete(docSnap.ref));
      await batch.commit();
      // alert("All subscriptions deleted."); // Using modal/message box instead
      alert("All subscriptions deleted.");
    } catch (e) {
      console.error(e);
      // alert("Failed to delete all: " + e.message); // Using modal/message box instead
      alert("Failed to delete all: " + e.message);
    } finally {
      setDeletingAll(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (!confirmPasswordForDeletion) {
      // alert("Enter current password to confirm."); // Using modal/message box instead
      alert("Enter current password to confirm.");
      return;
    }
    setDeletingAccount(true);
    try {
      // Reauthenticate
      const cred = EmailAuthProvider.credential(
        user.email,
        confirmPasswordForDeletion
      );
      await reauthenticateWithCredential(auth.currentUser, cred);

      // Delete all subscriptions
      const q = query(
        collection(db, "subscriptions"),
        where("userId", "==", user.uid)
      );
      const snap = await getDocs(q);
      const batch = writeBatch(db);
      snap.forEach((docSnap) => batch.delete(docSnap.ref));
      await batch.commit();

      // Delete user doc
      await deleteUser(auth.currentUser);

      // alert("Account and all subscriptions deleted."); // Using modal/message box instead
      alert("Account and all subscriptions deleted.");
      navigate("/login");
    } catch (e) {
      console.error(e);
      // alert("Failed to delete account: " + e.message); // Using modal/message box instead
      alert("Failed to delete account: " + e.message);
    } finally {
      setDeletingAccount(false);
      setShowDeleteConfirmation(false);
    }
  };

  return (
    <div className={`settings-container ${theme}`}>
      <div
        className="dark-light-toggle"
        style={{ transform: "translateX(-28px)" }}
        onClick={toggleTheme}
      >
        {theme === "dark" ? <FaSun /> : <FaMoon />}
      </div>
      <div className="settings-card">
        <h2 className="settings-title">Settings</h2>
        <div className="top-right-actions">
          <div
            className="icon-button home-icon"
            onClick={() => navigate("/dashboard")}
          >
            <FaHome />
          </div>
          <div className="icon-button logout-icon" onClick={handleLogout}>
            <FaSignOutAlt />
          </div>
        </div>
        <div className="setting-item">
          <label>Reminder Days:</label>
          <select
            value={reminderDays}
            onChange={(e) => setReminderDays(Number(e.target.value))}
          >
            <option value={1}>1 day</option>
            <option value={3}>3 days</option>
            <option value={7}>7 days</option>
          </select>
          <button onClick={savePrefs}>Save</button>
        </div>

        <form onSubmit={handleChangePassword} className="setting-item">
          <h3 className="section-title">Change Password</h3>
          <input
            type="password"
            placeholder="Current Password"
            required
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
          />
          <input
            type="password"
            placeholder="New Password"
            required
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
          />
          <button type="submit">Update Password</button>
        </form>

        <div className="setting-item">
          <h3 className="section-title">Account Actions</h3>
          <button onClick={handleDeleteAllSubscriptions} disabled={deletingAll}>
            {deletingAll ? "Deleting All..." : "Delete All Subscriptions"}
          </button>
        </div>

        <div className="setting-item">
          <button
            onClick={() => {
              if (
                window.confirm(
                  "This will permanently delete your account. Continue?"
                )
              ) {
                setShowDeleteConfirmation(true);
              }
            }}
            disabled={deletingAccount}
          >
            {deletingAccount ? "Deleting Account..." : "Delete Account"}
          </button>
        </div>

        {showDeleteConfirmation && (
          <div className="setting-item confirmation-section">
            <input
              type="password"
              placeholder="Confirm Current Password"
              required
              value={confirmPasswordForDeletion}
              onChange={(e) => setConfirmPasswordForDeletion(e.target.value)}
            />
            <button onClick={handleDeleteAccount} disabled={deletingAccount}>
              {deletingAccount ? "Confirming..." : "Confirm Deletion"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
