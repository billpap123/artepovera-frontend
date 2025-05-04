// src/components/ChatWindow.tsx
import React, { useState, useEffect, useRef, useCallback } from "react";
import axios from "axios";
import RatingForm from "./RatingForm"; // <<< Import the new component
import "../styles/ChatWindow.css"; // Ensure this includes styles for the modal overlay too

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
  receiverName?: string;
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
  const [isLoading, setIsLoading] = useState(false); // State for Send button loading
  // --- ADD State for Rating Form Modal ---
  const [isRatingFormOpen, setIsRatingFormOpen] = useState(false);
  // --- END ADD ---


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
            setMessages(response.data.messages || []); setError(null);
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
                setShowRatingPrompt(true); setRatingPromptLevel(response.data.level || 0);
                console.log(`[Rating Prompt] Should show prompt level ${response.data.level} for chat ${chatId}`);
            } else if (isMounted) {
                 setShowRatingPrompt(false); console.log(`[Rating Prompt] Should NOT show prompt for chat ${chatId}`);
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
    setIsLoading(true); setError(null);
    try {
      const token = localStorage.getItem("token");
      await axios.post( `${API_BASE_URL}/api/chats/send`, { chat_id: chatId, sender_id: userId, message: newMessage.trim() }, { headers: { Authorization: `Bearer ${token}` } } );
      setNewMessage("");
    } catch (err) { console.error("❌ Error sending message:", err); setError("Failed to send message."); }
    finally { setIsLoading(false); }
  };

  // --- Handle Prompt Response function ---
  const handlePromptResponse = async (action: 'declined' | 'maybe_later') => {
    if (!chatId || isPromptUpdating) return;
    setIsPromptUpdating(true);
    const token = localStorage.getItem("token");
    if (!token) { alert("Authentication Error"); setIsPromptUpdating(false); return; }
    try {
      await axios.put( `${API_BASE_URL}/api/chats/${chatId}/rating-status`, { action: action }, { headers: { Authorization: `Bearer ${token}` } } );
      setShowRatingPrompt(false);
    } catch (error: any) { console.error(`Error updating rating status with action ${action}:`, error); const message = error.response?.data?.message || "Failed to update rating status."; alert(message); }
    finally { setIsPromptUpdating(false); }
  };

  // --- MODIFIED Handler for "Yes" / "Rate Now" button ---
  const handleInitiateRating = () => {
       console.log(`User wants to rate! Opening form for chat: ${chatId}, reviewer: ${userId}, reviewed: ${receiverId}`);
       setIsRatingFormOpen(true); // <<< SET STATE TO OPEN FORM/MODAL
       setShowRatingPrompt(false); // Hide the prompt banner
  };
  // --- END MODIFICATION ---

  // --- ADD Handler to close the rating form ---
  const handleCloseRatingForm = (submitted: boolean = false) => {
      setIsRatingFormOpen(false);
      if (submitted) {
          // Optionally show a different confirmation or refresh data
          console.log("Rating submitted successfully action detected in ChatWindow.");
          // Maybe show a temporary success message in the chat area?
      }
  };
  // --- END ADD ---


  return (
    <div className="chat-window">
      {/* ... messages container ... */}
      <div className="messages-container">
        {messages.length > 0 ? (
          messages.map((msg) => (
            <div key={msg.message_id} title={`Sent by user ${msg.sender_id} at ${new Date(msg.created_at).toLocaleTimeString()}`} className={`message-bubble ${msg.sender_id === userId ? "sent" : "received"}`}>
              <p>{msg.message}</p>
            </div>
          ))
        ) : ( <p className="no-messages">No messages yet. Start the conversation!</p> )}
        <div ref={messagesEndRef} />
      </div>

      {error && <div className="error-message">{error}</div>}

      {/* Conditional Rating Prompt */}
      {showRatingPrompt && (
        <div className="rating-prompt-banner">
          <p> Rate your collaboration with {receiverName || 'this user'}? {ratingPromptLevel === 20 && <span> (Reminder)</span>} </p>
          <div className="prompt-buttons">
            {/* Calls the modified handler */}
            <button onClick={handleInitiateRating} disabled={isPromptUpdating} className="prompt-yes"> Rate Now </button>
            <button onClick={() => handlePromptResponse('maybe_later')} disabled={isPromptUpdating} className="prompt-later"> Maybe Later </button>
            <button onClick={() => handlePromptResponse('declined')} disabled={isPromptUpdating} className="prompt-no"> No Thanks </button>
          </div>
        </div>
      )}

      {/* Message Input Area */}
      <div className="message-input-area">
        <input type="text" placeholder="Type a message..." value={newMessage} onChange={(e) => setNewMessage(e.target.value)} onKeyPress={(e) => { if (e.key === "Enter" && !isLoading) { sendMessage(); } }} disabled={isLoading} />
        <button onClick={sendMessage} disabled={isLoading || !newMessage.trim()}> {isLoading ? "..." : "Send"} </button>
      </div>

      {/* --- ADD Conditional Rendering for Rating Form/Modal --- */}
      {/* This renders the RatingForm when isRatingFormOpen is true */}
      {isRatingFormOpen && (
        // Basic modal structure: an overlay and the form component
        // You'll need CSS for .rating-form-modal-overlay
        <div className="rating-form-modal-overlay">
          <RatingForm
            chatId={chatId}
            reviewerId={userId} // Pass current user ID as reviewer
            reviewedUserId={receiverId} // Pass other user ID as reviewed
            reviewedUserName={receiverName || 'User'} // Pass other user's name
            onClose={handleCloseRatingForm} // Pass the close handler
          />
        </div>
      )}
      {/* --- END ADD --- */}

    </div> // End chat-window
  );
};

export default ChatWindow;