// src/components/NotificationList.tsx
import React from "react";
import axios from "axios";
import "../styles/Notifications.css";
import { useTranslation, Trans } from "react-i18next";
import { Link } from "react-router-dom";
import { useUserContext } from '../context/UserContext';

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

// 1. Add onClose to the component's props interface
interface NotificationListProps {
  onClose?: () => void;
}

const NotificationList: React.FC<NotificationListProps> = ({ onClose }) => {
  const { notifications, setNotifications } = useUserContext();
  const { t } = useTranslation();
  
  const token = localStorage.getItem("token");
  const BACKEND_URL = import.meta.env.VITE_API_URL || "http://localhost:50001";

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
      console.error("Error marking as read:", err);
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
      console.error("Error deleting notification:", err);
    }
  };

  return (
    <div className="notification-list">
      {/* 2. Create a header to hold the title and the new close button */}
      <div className="notifications-header">
        <h2>{t('notificationList.title')}</h2>
        {/* The button is rendered if the onClose function is provided */}
        {onClose && (
            <button className="close-notifications-btn" onClick={onClose} aria-label="Close notifications">&times;</button>
        )}
      </div>

      {notifications.length === 0 ? (
        <p className="no-notifications-message">{t('notificationList.status.none')}</p>
      ) : (
        <ul>
          {notifications.map((notif) => (
            <li
              key={notif.notification_id}
              className={notif.read_status ? "read" : "unread"}
            >
              <div className="notification-main-content">
                {notif.message_key && notif.message_params ? (
                  <Trans
                    i18nKey={notif.message_key}
                    values={{ ...notif.message_params }}
                    components={{
                      a: <Link to={notif.message_params.profileLink || notif.message_params.chatLink || '#'} onClick={onClose} />,
                    }}
                  />
                ) : (
                  <span>{notif.message}</span>
                )}
                <small className="timestamp">
                  {new Date(notif.createdAt).toLocaleString()}
                </small>
              </div>

              <div className="notification-actions">
                {!notif.read_status && (
                  <button
                    onClick={() => handleMarkAsRead(notif.notification_id)}
                    className="mark-read-btn"
                  >
                    {t('notificationList.actions.markAsRead')}
                  </button>
                )}
                <button onClick={() => handleDelete(notif.notification_id)} className="delete-notif-btn">
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