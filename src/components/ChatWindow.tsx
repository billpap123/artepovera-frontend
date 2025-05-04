import React, { useState, useEffect, useRef, useCallback } from "react"; // Added useCallback
import axios from "axios";
import "../styles/ChatWindow.css"; // Make sure to add styles for .rating-prompt-banner etc.

interface Message {
  message_id: number;
  chat_id: number;
  sender_id: number;
  receiver_id: number;
  message: string;
  created_at: string;
  // Add sender/receiver names if included from backend getChatHistory
  messageSender?: { fullname?: string };
  messageReceiver?: { fullname?: string };
}

interface ChatWindowProps {
  chatId: number;
  userId: number; // Current logged-in user's ID
  receiverId: number; // The other user's ID
  receiverName?: string; // <<< ADDED: Pass the other user's name for the prompt
}

const ChatWindow: React.FC<ChatWindowProps> = ({ chatId, userId, receiverId, receiverName }) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [error, setError] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  // --- ADD State for Rating Prompt ---
  const [showRatingPrompt, setShowRatingPrompt] = useState(false);
  const [ratingPromptLevel, setRatingPromptLevel] = useState<number>(0); // 10 or 20
  const [isPromptUpdating, setIsPromptUpdating] = useState(false); // Loading state for prompt buttons
  // --- END ADD ---


  const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:50001";

  // --- Fetch Messages (existing logic) ---
  useEffect(() => {
    let isMounted = true; // Flag to prevent state updates if unmounted
    const fetchMessages = async () => {
      // Don't fetch if component unmounted or no chatId
      if (!isMounted || !chatId) return;
      try {
        const token = localStorage.getItem("token");
        // No need to check token here if API requires it, Axios will error out
        const response = await axios.get(`${API_BASE_URL}/api/chats/${chatId}/messages`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        // Only update state if component is still mounted
        if (isMounted) {
            setMessages(response.data.messages || []);
            setError(null); // Clear error on successful fetch
        }
      } catch (err) {
        console.error("❌ Error fetching messages:", err);
         if (isMounted) {
            setError("Failed to load messages.");
         }
      }
    };

    fetchMessages(); // Initial fetch
    const interval = setInterval(fetchMessages, 5000); // Poll messages every 5 seconds (adjust as needed)

    // Cleanup function
    return () => {
        isMounted = false; // Set flag when component unmounts
        clearInterval(interval);
    };
  }, [chatId, API_BASE_URL]); // Dependency array includes chatId and API_BASE_URL

  // --- ADD useEffect to check rating status ---
  useEffect(() => {
    let isMounted = true;
    const checkRatingStatus = async () => {
        if (!chatId || !isMounted) return; // Don't run if chatId isn't available or unmounted

        const token = localStorage.getItem("token");
        if (!token) return;

        // Reset prompt state before checking
        setShowRatingPrompt(false);

        try {
            const response = await axios.get(`${API_BASE_URL}/api/chats/${chatId}/rating-status`, {
                headers: { Authorization: `Bearer ${token}` },
            });

            if (isMounted && response.data.showPrompt) {
                setShowRatingPrompt(true);
                setRatingPromptLevel(response.data.level || 0);
                console.log(`[Rating Prompt] Should show prompt level ${response.data.level} for chat ${chatId}`);
            } else if (isMounted) {
                 setShowRatingPrompt(false); // Explicitly set false if not shown
                 console.log(`[Rating Prompt] Should NOT show prompt for chat ${chatId}`);
            }
        } catch (error) {
            console.error("Error fetching rating prompt status:", error);
            if (isMounted) {
                setShowRatingPrompt(false); // Default to not showing on error
            }
        }
    };

    checkRatingStatus(); // Check status when chatId changes

    // Cleanup function for this effect
    return () => {
        isMounted = false;
    };
  // Re-run check if chatId changes
  }, [chatId, API_BASE_URL]);
  // --- END ADD ---


  // Scroll to bottom effect (keep as is)
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Send message function (keep as is)
  const sendMessage = async () => {
    if (!newMessage.trim() || !chatId) return;
    setIsLoading(true); // Use isLoading state for send button
    setError(null); // Clear previous errors

    try {
      const token = localStorage.getItem("token");
      const response = await axios.post(
        `${API_BASE_URL}/api/chats/send`,
        { chat_id: chatId, sender_id: userId, message: newMessage.trim() }, // receiver_id determined by backend
        { headers: { Authorization: `Bearer ${token}` } }
      );
      // Instantly add the new message (could refine with backend response)
      // setMessages((prev) => [...prev, response.data.data]); // Assuming backend returns created message in data
      setNewMessage("");
      // No need to manually add, polling will fetch it, prevents duplicates if poll runs quickly
    } catch (err) {
      console.error("❌ Error sending message:", err);
      setError("Failed to send message.");
    } finally {
        // setIsLoading(false); // Let polling handle visual update
    }
  };

  // --- ADD Handler for Prompt Response ("Maybe Later" / "No Thanks") ---
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
      setShowRatingPrompt(false); // Hide prompt after updating status
    } catch (error: any) {
      console.error(`Error updating rating status with action ${action}:`, error);
      const message = error.response?.data?.message || "Failed to update rating status.";
      alert(message);
    } finally {
      setIsPromptUpdating(false);
    }
  };
  // --- END ADD ---


  // --- ADD Handler for "Yes" to Rate (Opens Rating Form/Modal) ---
  const handleInitiateRating = () => {
       // TODO: Implement logic to open your RatingForm component/modal
       // You will need to pass chatId, userId (as reviewer), and receiverId (as reviewed)
       console.log(`User wants to rate! chat: ${chatId}, reviewer: ${userId}, reviewed: ${receiverId}`);
       alert("Rating form would open now!"); // Placeholder

       // Hide prompt after clicking Yes
       setShowRatingPrompt(false);
       // Optionally call backend to mark as maybe_later until submitted?
       // handlePromptResponse('maybe_later'); // Or let the submitReview endpoint handle 'completed' status
  };
   // --- END ADD ---


  return (
    <div className="chat-window">
      {/* Consider adding a chat header with receiverName */}
      {/* <div className="chat-header">{receiverName || 'Chat'}</div> */}

      <div className="messages-container">
        {messages.length > 0 ? (
          messages.map((msg) => (
            <div
              key={msg.message_id}
              // Add sender name if available from include
              title={`Sent by user ${msg.sender_id} at ${new Date(msg.created_at).toLocaleTimeString()}`}
              className={`message-bubble ${msg.sender_id === userId ? "sent" : "received"}`} // Use simpler classes
            >
              <p>{msg.message}</p>
              {/* Optionally show time directly */}
              {/* <span className="message-time">{new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span> */}
            </div>
          ))
        ) : (
          <p className="no-messages">No messages yet. Start the conversation!</p>
        )}
        <div ref={messagesEndRef} /> {/* Element to scroll to */}
      </div>

      {error && <div className="error-message">{error}</div>} {/* Use consistent error class */}

      {/* --- ADD Conditional Rating Prompt --- */}
      {showRatingPrompt && (
        <div className="rating-prompt-banner"> {/* Style this banner */}
          <p>
            Rate your collaboration with {receiverName || 'this user'}?
            {ratingPromptLevel === 20 && <span> (Reminder)</span>}
          </p>
          <div className="prompt-buttons">
            <button onClick={handleInitiateRating} disabled={isPromptUpdating} className="prompt-yes"> Rate Now </button>
            <button onClick={() => handlePromptResponse('maybe_later')} disabled={isPromptUpdating} className="prompt-later"> Maybe Later </button>
            <button onClick={() => handlePromptResponse('declined')} disabled={isPromptUpdating} className="prompt-no"> No Thanks </button>
          </div>
        </div>
      )}
      {/* --- END Conditional Rating Prompt --- */}

      <div className="message-input-area"> {/* Renamed class */}
        <input
          type="text"
          placeholder="Type a message..."
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          onKeyPress={(e) => { if (e.key === "Enter" && !isLoading) { sendMessage(); } }} // Prevent sending while loading
          disabled={isLoading}
        />
        <button onClick={sendMessage} disabled={isLoading || !newMessage.trim()}>
            {isLoading ? "..." : "Send"} {/* Show loading indicator */}
        </button>
      </div>
    </div>
  );
};
const [isLoading, setIsLoading] = useState(false); // State for Send button loading

export default ChatWindow;

// Add styles for .rating-prompt-banner, .prompt-buttons, .prompt-yes, .prompt-later, .prompt-no,
// .message-bubble, .sent, .received, .no-messages, .message-input-area etc. in ChatWindow.css