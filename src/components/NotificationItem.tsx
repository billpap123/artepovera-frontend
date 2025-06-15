// src/components/NotificationItem.tsx
import React from "react";
import { Trans } from "react-i18next";
import { Link } from "react-router-dom"; // <-- STEP 1: Import Link

// This defines what a 'notification' looks like now.
// It can handle both old and new types.
interface NotificationItemProps {
  notif: {
    message?: string; // For old notifications
    message_key?: string; // For new notifications
    message_params?: { // The data for new notifications
      artistProfileLink?: string;
      chatLink?: string;
      [key: string]: any;
    };
  };
}

const NotificationItem: React.FC<NotificationItemProps> = ({ notif }) => {
  return (
    <div className="notification-item" style={{ marginBottom: "10px" }}>
      
      {/* If the notification has a 'message_key', use the new safe way */}
      {notif.message_key ? (
        <Trans
          i18nKey={notif.message_key} 
          values={notif.message_params}
          components={{
            // --- STEP 2: Change <a> to <Link> and href to 'to' ---
            a: (
              <Link to={notif.message_params?.artistProfileLink || notif.message_params?.chatLink || '#'} />
            ),
          }}
        />
      ) : (
        /* Otherwise, just show the old message as plain, safe text */
        <span>{notif.message}</span>
      )}
    </div>
  );
};

export default NotificationItem;