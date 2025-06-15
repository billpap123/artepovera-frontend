// src/components/NotificationItem.tsx
import React from "react";
import { Trans } from "react-i18next";
import { Link } from "react-router-dom";

// Update the interface to include the generic 'profileLink'
interface NotificationItemProps {
  notif: {
    message?: string;
    message_key?: string;
    message_params?: {
      artistProfileLink?: string;
      chatLink?: string;
      profileLink?: string; // <-- Add this new property
      [key: string]: any;
    };
  };
}

const NotificationItem: React.FC<NotificationItemProps> = ({ notif }) => {
  return (
    <div className="notification-item" style={{ marginBottom: "10px" }}>
      
      {notif.message_key ? (
        <Trans
          i18nKey={notif.message_key} 
          values={notif.message_params}
          components={{
            // --- This is the only line that changes ---
            // Update the link to check for all possible link types
            a: (
              <Link to={notif.message_params?.chatLink || notif.message_params?.profileLink || notif.message_params?.artistProfileLink || '#'} />
            ),
          }}
        />
      ) : (
        <span>{notif.message}</span>
      )}
    </div>
  );
};

export default NotificationItem;