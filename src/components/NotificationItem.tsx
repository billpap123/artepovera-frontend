// src/components/NotificationItem.tsx

// PASTE ALL OF THIS CODE INTO YOUR FILE

import React from "react";
import { Trans } from "react-i18next"; // You need to import this

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
      
      {/* --- This is the new logic --- */}

      {/* If the notification has a 'message_key', use the new safe way */}
      {notif.message_key ? (
        <Trans
          i18nKey={notif.message_key} // The translation key, e.g., "notifications.newApplication"
          values={notif.message_params} // The data, e.g., { artistName: "Maria" }
          components={{
            // This makes the <a> tag in your translation file a real, clickable link
            a: (
              <a href={notif.message_params?.artistProfileLink || notif.message_params?.chatLink} />
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