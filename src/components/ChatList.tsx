import React, { useEffect, useState } from "react";
import axios from "axios";
import Navbar from "../components/Navbar";
import ChatWindow from "./ChatWindow";
import "../styles/ChatList.css"; // optional styling

interface Chat {
  chat_id: number;
  // Instead of storing the PK from the `artists` or `employers` table,
  // your backend route should now return the actual user IDs:
  artist_user_id: number;
  employer_user_id: number;
  created_at: string;
}

interface User {
  user_id: number;
  fullname: string;
}

const ChatList = () => {
  const [chats, setChats] = useState<Chat[]>([]);
  const [activeChatId, setActiveChatId] = useState<number | null>(null);
  const [users, setUsers] = useState<{ [key: number]: string }>({});
  const [error, setError] = useState<string | null>(null);

  // The currently logged-in user
  const [currentUser, setCurrentUser] = useState<{
    user_id?: number;
    user_type?: string;
    [key: string]: any;
  }>({});

  // Base URL from your .env or fallback
  const BACKEND_URL = import.meta.env.VITE_API_URL || "http://localhost:50001";

  useEffect(() => {
    const fetchChats = async () => {
      try {
        const token = localStorage.getItem("token");
        const storedUser = JSON.parse(localStorage.getItem("user") || "{}");
        setCurrentUser(storedUser);

        // 1) Call your fixed backend route
        //    which returns an array of chats with
        //    { chat_id, artist_user_id, employer_user_id, created_at }:
        const response = await axios.get(
          `${BACKEND_URL}/api/chats/user/${storedUser.user_id}`,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );

        const fetchedChats = response.data.chats || [];
        setChats(fetchedChats);

        // 2) Gather the user IDs for the "other side" of each chat
        const userIds = new Set<number>();
        fetchedChats.forEach((chat: Chat) => {
          // If the current user is the "artist_user_id", then the other side is "employer_user_id".
          // If the current user is the "employer_user_id", the other side is "artist_user_id".
          const recipientId =
            storedUser.user_id === chat.artist_user_id
              ? chat.employer_user_id
              : chat.artist_user_id;
          userIds.add(recipientId);
        });

        // 3) If we have any user IDs, fetch their names
        if (userIds.size > 0) {
          const userResponse = await axios.post(
            `${BACKEND_URL}/api/users/get-names`,
            { user_ids: Array.from(userIds) },
            { headers: { Authorization: `Bearer ${token}` } }
          );

          // Create a mapping from user_id -> fullname
          const userMap: { [key: number]: string } = {};
          userResponse.data.users.forEach((u: User) => {
            userMap[u.user_id] = u.fullname;
          });
          setUsers(userMap);
        }
      } catch (err) {
        console.error("Error fetching chats:", err);
        setError("Failed to fetch chats. Please try again.");
      }
    };

    fetchChats();
  }, [BACKEND_URL]);

  if (error) {
    return <div className="error">{error}</div>;
  }

  // The UI: if no activeChatId, show the list of chats. Otherwise show the ChatWindow.
  return (
    <>
      <Navbar />

      {activeChatId === null ? (
        <div className="chat-list-container">
          {chats.length > 0 ? (
            <ul className="chat-list">
              {chats.map((chat) => {
                // Identify the "other side" user:
                const otherUserId =
                  currentUser.user_id === chat.artist_user_id
                    ? chat.employer_user_id
                    : chat.artist_user_id;

                const recipientName = users[otherUserId] || "Unknown User";

                return (
                  <li
                    key={chat.chat_id}
                    onClick={() => setActiveChatId(chat.chat_id)}
                  >
                    <span>Chat with {recipientName}</span>
                  </li>
                );
              })}
            </ul>
          ) : (
            <p>No chats yet.</p>
          )}
        </div>
      ) : (
        <div className="chat-window-container">
          <button className="back-button" onClick={() => setActiveChatId(null)}>
            Back to Chats
          </button>
          {/* 
            ChatWindow receives:
              - the chatId
              - the currentUser’s ID
              - the other user’s ID, if needed
          */}
          <ChatWindow
            chatId={activeChatId}
            userId={currentUser?.user_id || 0}
            // Optionally compute the receiverId:
            receiverId={(() => {
              const found = chats.find((c) => c.chat_id === activeChatId);
              if (!found) return 0;
              return currentUser.user_id === found.artist_user_id
                ? found.employer_user_id
                : found.artist_user_id;
            })()}
          />
        </div>
      )}
    </>
  );
};

export default ChatList;
