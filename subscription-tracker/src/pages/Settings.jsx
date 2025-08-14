import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

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
  updateDoc,
  collection,
  query,
  where,
  getDocs,
  writeBatch,
} from "firebase/firestore";

import { auth, db } from "../firebase";

export default function Settings() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [newPassword, setNewPassword] = useState("");
  const [needReauth, setNeedReauth] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");

  const [reminderDays, setReminderDays] = useState(7);

  const [deletingAll, setDeletingAll] = useState(false);
  const [deletingAccount, setDeletingAccount] = useState(false);
  const [confirmPasswordForDeletion, setConfirmPasswordForDeletion] =
    useState("");

  useEffect(() => {
    if (!user) return;
    const load = async () => {
      const ref = doc(db, "users", user.uid);
      const snap = await getDoc(ref);
      if (snap.exists()) {
        const d = snap.data();
        if (typeof d.reminderDays === "number") setReminderDays(d.reminderDays);
      } else {
        await setDoc(
          ref,
          {
            reminderDays: 7,
          },
          { merge: true }
        );
      }
    };
    load();
  }, [user]);

  if (!user) {
    return (
      <div className="settings-wrap">
        <div className="settings-card">
          <h2>Settings</h2>
          <p>You’re not logged in.</p>
        </div>
      </div>
    );
  }

  const savePrefs = async () => {
    try {
      // FIX: Use setDoc with { merge: true } to create the document if it doesn't exist.
      await setDoc(
        doc(db, "users", user.uid),
        {
          reminderDays,
        },
        { merge: true }
      );
      alert("Settings saved!");
    } catch (e) {
      console.error(e);
      alert("Failed to save settings: " + e.message);
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    if (!newPassword || newPassword.length < 6) {
      alert("Please enter a new password (at least 6 characters).");
      return;
    }
    try {
      await updatePassword(auth.currentUser, newPassword);
      setNewPassword("");
      setNeedReauth(false);
      setCurrentPassword("");
      alert("Password updated!");
    } catch (e) {
      if (e.code === "auth/requires-recent-login") {
        setNeedReauth(true);
      } else {
        console.error(e);
        alert("Failed to update password: " + e.message);
      }
    }
  };

  const handleReauthAndChange = async (e) => {
    e.preventDefault();
    if (!currentPassword) {
      alert("Please enter your current password to continue.");
      return;
    }
    try {
      const cred = EmailAuthProvider.credential(user.email, currentPassword);
      await reauthenticateWithCredential(auth.currentUser, cred);
      await updatePassword(auth.currentUser, newPassword);
      setNewPassword("");
      setNeedReauth(false);
      setCurrentPassword("");
      alert("Password updated!");
    } catch (e) {
      console.error(e);
      alert("Re-authentication failed: " + e.message);
    }
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
      navigate("/login");
    } catch (e) {
      console.error(e);
      alert("Logout failed: " + e.message);
    }
  };

  const handleDeleteAllSubscriptions = async () => {
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
      alert("All subscriptions deleted.");
    } catch (e) {
      console.error(e);
      alert("Failed to delete all: " + e.message);
    } finally {
      setDeletingAll(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (
      !window.confirm(
        "This will permanently delete your account and subscriptions. Continue?"
      )
    )
      return;

    if (!confirmPasswordForDeletion) {
      alert("Please enter your current password to confirm.");
      return;
    }

    setDeletingAccount(true);
    try {
      const cred = EmailAuthProvider.credential(
        user.email,
        confirmPasswordForDeletion
      );
      await reauthenticateWithCredential(auth.currentUser, cred);

      const q = query(
        collection(db, "subscriptions"),
        where("userId", "==", user.uid)
      );
      const snap = await getDocs(q);
      const batch = writeBatch(db);
      snap.forEach((docSnap) => batch.delete(docSnap.ref));
      batch.delete(doc(db, "users", user.uid));
      await batch.commit();

      await deleteUser(auth.currentUser);

      alert("Your account has been deleted. Goodbye!");
      navigate("/register");
    } catch (e) {
      console.error(e);
      alert("Failed to delete account: " + e.message);
    } finally {
      setDeletingAccount(false);
    }
  };

  return (
    <div className="settings-wrap">
      <div className="settings-card">
        <h2>Settings</h2>

        {/* Account Info */}
        <section className="settings-section">
          <h3>Account</h3>
          <div className="settings-row">
            <div>
              <div className="settings-label">Signed in as</div>
              <div className="settings-value">{user.email}</div>
            </div>
            <div className="settings-btn-group">
              <button className="btn" onClick={handleLogout}>
                Logout
              </button>
            </div>
          </div>
        </section>

        {/* Change Password */}
        <section className="settings-section">
          <h3>Change Password</h3>
          <form
            onSubmit={needReauth ? handleReauthAndChange : handleChangePassword}
          >
            <div className="settings-row-cols">
              <div className="flex-1">
                <label className="settings-label">New Password</label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Enter new password"
                  required
                  minLength={6}
                />
              </div>

              {needReauth && (
                <div className="flex-1">
                  <label className="settings-label">
                    Current Password (required)
                  </label>
                  <input
                    type="password"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    placeholder="Enter current password"
                    required
                  />
                </div>
              )}
            </div>

            <button type="submit" className="btn">
              {needReauth ? "Confirm & Update" : "Update Password"}
            </button>
            {needReauth && (
              <p className="settings-help">
                For security, please confirm your current password to finish.
              </p>
            )}
          </form>
        </section>

        {/* Reminder Settings */}
        <section className="settings-section">
          <h3>Reminder Settings</h3>
          <p className="settings-help">
            Choose how many days in advance your Dashboard “Upcoming renewals”
            should look ahead.
          </p>
          <div className="settings-row">
            <select
              value={reminderDays}
              onChange={(e) => setReminderDays(Number(e.target.value))}
            >
              <option value={1}>1 day before</option>
              <option value={3}>3 days before</option>
              <option value={7}>7 days before</option>
            </select>
            <button className="btn" onClick={savePrefs}>
              Save
            </button>
          </div>
        </section>

        {/* Danger Zone */}
        <section className="settings-section-danger">
          <h3>Danger Zone</h3>

          <div className="settings-row">
            <button
              className="btn-warn"
              onClick={handleDeleteAllSubscriptions}
              disabled={deletingAll}
            >
              {deletingAll ? "Deleting…" : "Delete ALL Subscriptions"}
            </button>
          </div>

          <div className="margin-top-16">
            <label className="settings-label">
              Confirm password (for account deletion)
            </label>
            <input
              type="password"
              value={confirmPasswordForDeletion}
              onChange={(e) => setConfirmPasswordForDeletion(e.target.value)}
              placeholder="Enter current password"
            />
          </div>

          <button
            className="btn-danger"
            onClick={handleDeleteAccount}
            disabled={deletingAccount}
          >
            {deletingAccount
              ? "Deleting account…"
              : "Delete Account Permanently"}
          </button>
        </section>
      </div>
    </div>
  );
}
