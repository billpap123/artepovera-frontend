import React from "react";
import axios from "axios";
import "../styles/Notifications.css";
import { useTranslation, Trans } from "react-i18next";
import { Link } from "react-router-dom";
import { useUserContext } from '../context/UserContext'; // <-- 1. Get the context

// The Notification type definition remains the same
type Notification = {
  notification_id: number;
  user_id: number;
  message: string | null;
  message_key: string | null;
  message_params: any | null;
  read_status: boolean;
  createdAt: string;
  sender_name: string;
};

const NotificationList: React.FC = () => {
  // --- 2. Get the global state and setter from the context ---
  // We no longer need local useState for notifications, loading, or error.
  const { notifications, setNotifications } = useUserContext();
  const { t } = useTranslation();
  
  const token = localStorage.getItem("token");
  const BACKEND_URL = import.meta.env.VITE_API_URL || "http://localhost:50001";

  // --- 3. DELETE the entire useEffect for fetching notifications. ---
  // The UserContext now handles all fetching and real-time updates.

  const handleMarkAsRead = async (notificationId: number) => {
    try {
      await axios.put(
        `${BACKEND_URL}/api/notifications/${notificationId}`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      // This now updates the GLOBAL notifications list
      setNotifications((prev) =>
        prev.map((notif) =>
          notif.notification_id === notificationId
            ? { ...notif, read_status: true }
            : notif
        )
      );
    } catch (err) {
      console.error("Error marking as read:", err);
    }
  };

  const handleDelete = async (notificationId: number) => {
    try {
      await axios.delete(`${BACKEND_URL}/api/notifications/${notificationId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      // This now updates the GLOBAL notifications list
      setNotifications((prev) =>
        prev.filter((notif) => notif.notification_id !== notificationId)
      );
    } catch (err) {
      console.error("Error deleting notification:", err);
    }
  };

  // We no longer need the 'loading' or 'error' checks here.
  // The context provides the list as soon as you log in.
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
                {notif.message_key && notif.message_params ? (
                  <Trans
                    i18nKey={notif.message_key}
                    values={{ ...notif.message_params }}
                    components={{
                      a: <Link to={notif.message_params.profileLink || notif.message_params.chatLink || '#'} />,
                    }}
                  />
                ) : (
                  <span>{notif.message}</span>
                )}
              </div>

              <small
                style={{ display: "block", marginTop: "5px", color: "#555" }}
              >
                {new Date(notif.createdAt).toLocaleString()}
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