import React, { useState, useEffect, useRef, useCallback } from "react";
import axios from "axios";
import "../styles/ChatWindow.css"; // Make sure to add styles for .rating-prompt-banner etc.

interface Message {
  message_id: number;
  chat_id: number;
  sender_id: number;
  receiver_id: number;
  message: string;
  created_at: string;
  messageSender?: { fullname?: string };
  messageReceiver?: { fullname?: string };
}

interface ChatWindowProps {
  chatId: number;
  userId: number; // Current logged-in user's ID
  receiverId: number; // The other user's ID
  receiverName?: string; // Pass the other user's name for the prompt
}

const ChatWindow: React.FC<ChatWindowProps> = ({ chatId, userId, receiverId, receiverName }) => {
  // --- State Declarations ---
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [error, setError] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const [showRatingPrompt, setShowRatingPrompt] = useState(false);
  const [ratingPromptLevel, setRatingPromptLevel] = useState<number>(0);
  const [isPromptUpdating, setIsPromptUpdating] = useState(false);
  // --- FIX: Moved isLoading state declaration INSIDE the component ---
  const [isLoading, setIsLoading] = useState(false); // State for Send button loading
  // --- END FIX ---

  const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:50001";

  // --- Fetch Messages useEffect ---
  useEffect(() => {
    let isMounted = true;
    const fetchMessages = async () => {
      if (!isMounted || !chatId) return;
      try {
        const token = localStorage.getItem("token");
        const response = await axios.get(`${API_BASE_URL}/api/chats/${chatId}/messages`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (isMounted) {
            setMessages(response.data.messages || []);
            setError(null);
        }
      } catch (err) {
        console.error("❌ Error fetching messages:", err);
         if (isMounted) { setError("Failed to load messages."); }
      }
    };
    fetchMessages();
    const interval = setInterval(fetchMessages, 5000);
    return () => { isMounted = false; clearInterval(interval); };
  }, [chatId, API_BASE_URL]);

  // --- Check Rating Status useEffect ---
  useEffect(() => {
    let isMounted = true;
    const checkRatingStatus = async () => {
        if (!chatId || !isMounted) return;
        const token = localStorage.getItem("token");
        if (!token) return;
        setShowRatingPrompt(false); // Reset
        try {
            const response = await axios.get(`${API_BASE_URL}/api/chats/${chatId}/rating-status`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            if (isMounted && response.data.showPrompt) {
                setShowRatingPrompt(true);
                setRatingPromptLevel(response.data.level || 0);
                console.log(`[Rating Prompt] Should show prompt level ${response.data.level} for chat ${chatId}`);
            } else if (isMounted) {
                 setShowRatingPrompt(false);
                 console.log(`[Rating Prompt] Should NOT show prompt for chat ${chatId}`);
            }
        } catch (error) {
            console.error("Error fetching rating prompt status:", error);
            if (isMounted) { setShowRatingPrompt(false); }
        }
    };
    checkRatingStatus();
    return () => { isMounted = false; };
  }, [chatId, API_BASE_URL]);

  // --- Scroll to bottom effect ---
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // --- Send message function ---
  const sendMessage = async () => {
    if (!newMessage.trim() || !chatId) return;
    setIsLoading(true); // Use the setter
    setError(null);
    try {
      const token = localStorage.getItem("token");
      await axios.post(
        `${API_BASE_URL}/api/chats/send`,
        { chat_id: chatId, sender_id: userId, message: newMessage.trim() },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setNewMessage("");
    } catch (err) {
      console.error("❌ Error sending message:", err);
      setError("Failed to send message.");
    } finally {
        setIsLoading(false); // Use the setter
    }
  };

  // --- Handle Prompt Response function ---
  const handlePromptResponse = async (action: 'declined' | 'maybe_later') => {
    if (!chatId || isPromptUpdating) return;
    setIsPromptUpdating(true);
    const token = localStorage.getItem("token");
    if (!token) { alert("Authentication Error"); setIsPromptUpdating(false); return; }
    try {
      await axios.put(
        `${API_BASE_URL}/api/chats/${chatId}/rating-status`,
        { action: action },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setShowRatingPrompt(false);
    } catch (error: any) {
      console.error(`Error updating rating status with action ${action}:`, error);
      const message = error.response?.data?.message || "Failed to update rating status.";
      alert(message);
    } finally {
      setIsPromptUpdating(false);
    }
  };

  // --- Handle Initiate Rating function ---
  const handleInitiateRating = () => {
       console.log(`User wants to rate! chat: ${chatId}, reviewer: ${userId}, reviewed: ${receiverId}`);
       alert("Rating form would open now!"); // Placeholder
       setShowRatingPrompt(false);
  };

  return (
    <div className="chat-window">
      <div className="messages-container">
        {messages.length > 0 ? (
          messages.map((msg) => (
            <div
              key={msg.message_id}
              title={`Sent by user ${msg.sender_id} at ${new Date(msg.created_at).toLocaleTimeString()}`}
              className={`message-bubble ${msg.sender_id === userId ? "sent" : "received"}`}
            >
              <p>{msg.message}</p>
            </div>
          ))
        ) : (
          <p className="no-messages">No messages yet. Start the conversation!</p>
        )}
        <div ref={messagesEndRef} />
      </div>

      {error && <div className="error-message">{error}</div>}

      {/* Conditional Rating Prompt */}
      {showRatingPrompt && (
        <div className="rating-prompt-banner">
          <p> Rate your collaboration with {receiverName || 'this user'}? {ratingPromptLevel === 20 && <span> (Reminder)</span>} </p>
          <div className="prompt-buttons">
            <button onClick={handleInitiateRating} disabled={isPromptUpdating} className="prompt-yes"> Rate Now </button>
            <button onClick={() => handlePromptResponse('maybe_later')} disabled={isPromptUpdating} className="prompt-later"> Maybe Later </button>
            <button onClick={() => handlePromptResponse('declined')} disabled={isPromptUpdating} className="prompt-no"> No Thanks </button>
          </div>
        </div>
      )}

      <div className="message-input-area">
        <input
          type="text"
          placeholder="Type a message..."
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          onKeyPress={(e) => { if (e.key === "Enter" && !isLoading) { sendMessage(); } }}
          disabled={isLoading} // Use isLoading state
        />
        <button onClick={sendMessage} disabled={isLoading || !newMessage.trim()}>
            {isLoading ? "..." : "Send"} {/* Use isLoading state */}
        </button>
      </div>
    </div>
  );
};

// --- REMOVED stray useState call from here ---

export default ChatWindow;