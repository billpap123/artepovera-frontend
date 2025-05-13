// src/pages/ChatList.tsx
import React, { useEffect, useState, useCallback } from "react";
import axios from "axios";
import Navbar from "../components/Navbar";
import ChatWindow from "./ChatWindow"; // Assuming ChatWindow is in the same 'pages' folder
import "../styles/ChatList.css";

// --- UPDATED Chat and User Interfaces ---
interface OtherUser {
  user_id: number;
  fullname: string;
  profile_picture: string | null;
}

interface ChatData {
  chat_id: number;
  otherUser: OtherUser | null; // Object containing details of the other user
  chatName: string; // Display name for the chat, e.g., "Chat with John Doe"
  message_count?: number;
  artist_rating_status?: string;
  employer_rating_status?: string;
  created_at?: string;
  updated_at?: string;
  // Add any other fields your backend's formattedChats returns
}
// --- END UPDATED INTERFACES ---

const ChatList: React.FC = () => { // Removed unused generic for FC
  const [chats, setChats] = useState<ChatData[]>([]);
  const [activeChatId, setActiveChatId] = useState<number | null>(null);
  const [selectedChat, setSelectedChat] = useState<ChatData | null>(null); // Store the whole selected chat object
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true); // Added loading state

  // Get current user from localStorage (or context if you prefer)
  const [currentUser, setCurrentUser] = useState<{ user_id?: number; [key: string]: any; }>({});

  const BACKEND_URL = import.meta.env.VITE_API_URL || "http://localhost:50001";

  // Fetch chats when component mounts or currentUser.user_id changes
  useEffect(() => {
    const fetchChatsForUser = async () => {
      const token = localStorage.getItem("token");
      const storedUser = JSON.parse(localStorage.getItem("user") || "{}");
      
      if (!token || !storedUser?.user_id) {
        setError("User not authenticated. Please log in.");
        setLoading(false);
        setChats([]); // Clear chats
        return;
      }
      setCurrentUser(storedUser); // Set current user
      setLoading(true);
      setError(null);

      try {
        // Backend now returns chats with 'otherUser' details included
        const response = await axios.get(
          `${BACKEND_URL}/api/chats/user/${storedUser.user_id}`, // Endpoint for fetching user's chats
          { headers: { Authorization: `Bearer ${token}` } }
        );

        const fetchedChats = response.data.chats || [];
        console.log("[ChatList] Fetched and Formatted Chats from API:", fetchedChats);
        setChats(fetchedChats);

      } catch (err: any) { // Added type for err
        console.error("Error fetching chats:", err);
        setError(err.response?.data?.message || "Failed to fetch chats. Please try again.");
      } finally {
        setLoading(false);
      }
    };

    fetchChatsForUser();
  }, [BACKEND_URL, setCurrentUser]); // Re-fetch if BACKEND_URL changes (though unlikely)
                                     // Consider adding storedUser.user_id or a context userId if it can change

  const handleSelectChat = (chat: ChatData) => {
    setSelectedChat(chat);
    setActiveChatId(chat.chat_id);
  };

  if (loading) {
    return (
        <>
            <Navbar />
            <div className="loading-container"> {/* Style this container */}
                <p>Loading your chats...</p>
            </div>
        </>
    );
  }

  if (error) {
    return (
        <>
            <Navbar />
            <div className="error-container"> {/* Style this container */}
                <p className="error-message">{error}</p>
            </div>
        </>
    );
  }

  return (
    <>
      <Navbar />
      <div className="page-container chat-page-container"> {/* Added general page container */}
        {activeChatId === null && selectedChat === null ? (
          // Chat List View
          <div className="chat-list-container">
            <h2>Your Chats</h2>
            {chats.length > 0 ? (
              <ul className="chat-list">
                {chats.map((chat) => (
                  <li
                    key={chat.chat_id}
                    onClick={() => handleSelectChat(chat)}
                    className="chat-list-item" // Added class for styling
                  >
                    {/* Use chatName or otherUser.fullname directly from backend */}
                    <img
                        src={chat.otherUser?.profile_picture || "/default-profile.png"}
                        alt={chat.otherUser?.fullname || "User"}
                        className="chat-list-avatar"
                    />
                    <div className="chat-list-info">
                        <span className="chat-list-name">{chat.chatName || chat.otherUser?.fullname || "Unknown User"}</span>
                        {/* You can add last message preview here if backend provides it */}
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="no-chats-message">No chats yet. Like some users to start a conversation!</p>
            )}
          </div>
        ) : (
          // Chat Window View
          <div className="chat-window-container">
            <button className="back-to-chats-button" onClick={() => {setActiveChatId(null); setSelectedChat(null);}}>
              &larr; Back to Chats
            </button>
            {selectedChat && currentUser?.user_id && (
              <ChatWindow
                chatId={selectedChat.chat_id}
                userId={currentUser.user_id}
                receiverId={selectedChat.otherUser?.user_id || 0} // Pass other user's ID
                receiverName={selectedChat.otherUser?.fullname || "Chat Partner"} // Pass other user's name
              />
            )}
          </div>
        )}
      </div>
    </>
  );
};

export default ChatList;