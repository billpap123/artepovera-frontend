import React, { useEffect, useState } from "react";
import axios from "axios";
import "../styles/Notifications.css";
import { useTranslation } from "react-i18next";

// --- UPDATED TYPE DEFINITION ---
// This now matches the data structure from your backend,
// allowing for both old (message) and new (message_key) notifications.
type Notification = {
  notification_id: number;
  user_id: number;
  message: string | null; // Kept for backward compatibility
  message_key: string | null; // NEW: The key for i18next
  message_params: any | null; // NEW: The variables for the key
  read_status: boolean;
  created_at: string;
  sender_name: string;
};

const NotificationList: React.FC = () => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const { t } = useTranslation();

  const user = JSON.parse(localStorage.getItem("user") || "{}");
  const token = localStorage.getItem("token");
  const BACKEND_URL = import.meta.env.VITE_API_URL || "http://localhost:50001";

  useEffect(() => {
    const fetchNotifications = async () => {
      if (!user?.user_id || !token) {
        setLoading(false);
        setError("No user or token found. Please log in.");
        return;
      }
      
      try {
        const response = await axios.get(
          `${BACKEND_URL}/api/notifications/${user.user_id}`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        setNotifications(response.data.notifications || []);
      } catch (err) {
        setError("Failed to fetch notifications.");
        console.error("❌ Error fetching notifications:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchNotifications();
  }, [user.user_id, token, BACKEND_URL]);

  const handleMarkAsRead = async (notificationId: number) => {
    try {
      await axios.put(
        `${BACKEND_URL}/api/notifications/${notificationId}`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setNotifications((prev) =>
        prev.map((notif) =>
          notif.notification_id === notificationId
            ? { ...notif, read_status: true }
            : notif
        )
      );
    } catch (err) {
      setError("Failed to mark notification as read.");
      console.error("❌ Error marking as read:", err);
    }
  };

  const handleDelete = async (notificationId: number) => {
    try {
      await axios.delete(`${BACKEND_URL}/api/notifications/${notificationId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setNotifications((prev) =>
        prev.filter((notif) => notif.notification_id !== notificationId)
      );
    } catch (err) {
      setError("Failed to delete notification.");
      console.error("❌ Error deleting notification:", err);
    }
  };

  if (loading) return <div>{t('notificationList.status.loading')}</div>;
  if (error) return <div style={{ color: "red" }}>{error}</div>;

  return (
    <div className="notification-list">
      <h2>{t('notificationList.title')}</h2>
      {notifications.length === 0 ? (
        <p>{t('notificationList.status.none')}</p>
      ) : (
        <ul>
          {notifications.map((notif) => (
            <li
              key={notif.notification_id}
              className={notif.read_status ? "read" : "unread"}
              style={{ marginBottom: "15px" }}
            >
              <div>
                {/* --- THIS IS THE FIX --- */}
                {/* It now checks if a message_key exists. If so, it translates it. */}
                {/* If not, it falls back to displaying the old message string. */}
                <span dangerouslySetInnerHTML={{ 
                  __html: notif.message_key 
                    ? t(notif.message_key, { 
                        name: notif.sender_name, 
                        ...(notif.message_params || {})
                      })
                    : notif.message || ''
                }} />
              </div>

              <small
                style={{ display: "block", marginTop: "5px", color: "#555" }}
              >
                {new Date(notif.created_at).toLocaleString()}
              </small>

              <div style={{ marginTop: "8px" }}>
                {!notif.read_status && (
                  <button
                    onClick={() => handleMarkAsRead(notif.notification_id)}
                    style={{ marginRight: "8px" }}
                  >
                    {t('notificationList.actions.markAsRead')}
                  </button>
                )}
                <button onClick={() => handleDelete(notif.notification_id)}>
                  {t('notificationList.actions.delete')}
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default NotificationList;
