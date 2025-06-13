// src/pages/ChatPage.tsx

import React, { useState, useEffect, useRef } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import axios from 'axios';
import io, { Socket } from 'socket.io-client'; // Import socket.io-client
import Navbar from '../components/Navbar';
import { useUserContext } from '../context/UserContext';
import '../styles/ChatPage.css';

const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:50001";

// --- Interfaces (no changes needed here) ---
interface OtherUser {
    user_id: number;
    fullname: string;
    profile_picture: string | null;
}
interface Chat {
    chat_id: number;
    updatedAt: string;
    otherUser: OtherUser | null;
}
interface Message {
    message_id: number;
    chat_id: number;
    sender_id: number;
    message: string;
    createdAt: string;
}
// ---

const ChatPage = () => {
    const { userId: loggedInUserId } = useUserContext();
    const [searchParams] = useSearchParams();

    const [chats, setChats] = useState<Chat[]>([]);
    const [activeChat, setActiveChat] = useState<Chat | null>(null);
    const [messages, setMessages] = useState<Message[]>([]);
    const [newMessage, setNewMessage] = useState('');
    
    // UI State
    const [loadingChats, setLoadingChats] = useState(true);
    const [loadingMessages, setLoadingMessages] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    // Use a ref to hold the socket instance to prevent re-renders from creating new connections
    const socketRef = useRef<Socket | null>(null);

    // Effect for initializing and managing the socket connection
    useEffect(() => {
        if (loggedInUserId) {
            // We only establish the connection once when the user is logged in.
            if (!socketRef.current) {
                socketRef.current = io(API_BASE_URL);
            }
    
            // Define the event handler function
            const handleNewMessage = (incomingMessage: Message) => {
                // 1. --- THIS IS THE FIX ---
                // Ignore the event if the logged-in user is the sender.
                // The UI was already updated by the handleSendMessage function.
                if (incomingMessage.sender_id === loggedInUserId) {
                    return; 
                }
    
                // 2. For everyone else, update the UI if the chat is active.
                setActiveChat(currentActiveChat => {
                    if (currentActiveChat && incomingMessage.chat_id === currentActiveChat.chat_id) {
                        setMessages(prevMessages => [...prevMessages, incomingMessage]);
                    }
                    return currentActiveChat;
                });
            };
    
            // Attach the listener
            socketRef.current.on('new_message', handleNewMessage);
    
            // Cleanup: remove the listener when the component unmounts or dependencies change.
            return () => {
                socketRef.current?.off('new_message', handleNewMessage);
            };
        }
    }, [loggedInUserId]); // This effect now only depends on the user's login state.
    

    // Effect to fetch initial chat list (no major changes needed)
    useEffect(() => {
        const fetchUserChats = async () => {
            setLoadingChats(true);
            setError(null);
            try {
                const token = localStorage.getItem('token');
                const response = await axios.get(`${API_BASE_URL}/api/chats/my-chats`, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                const fetchedChats = response.data.chats || [];
                setChats(fetchedChats);

                const openChatId = searchParams.get('open');
                if (openChatId && fetchedChats.length > 0) {
                    const chatToOpen = fetchedChats.find((c: Chat) => c.chat_id === Number(openChatId));
                    if(chatToOpen) setActiveChat(chatToOpen);
                }
            } catch (err: any) {
                setError(err.response?.data?.message || "Failed to load conversations.");
            } finally {
                setLoadingChats(false);
            }
        };

        if (loggedInUserId) fetchUserChats();
    }, [loggedInUserId, searchParams]);

    // Effect to fetch messages and JOIN the socket room when a chat becomes active
    useEffect(() => {
        if (!activeChat) {
            setMessages([]);
            return;
        }

        // When a chat is selected, tell the server we want to join this room.
        socketRef.current?.emit('join_chat', activeChat.chat_id.toString());
        
        const fetchMessages = async () => {
            setLoadingMessages(true);
            try {
                const token = localStorage.getItem('token');
                const response = await axios.get(`${API_BASE_URL}/api/chats/${activeChat.chat_id}/messages`, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                setMessages(response.data.messages || []);
            } catch (err) { console.error("Error fetching messages:", err); } 
            finally { setLoadingMessages(false); }
        };
        fetchMessages();
    }, [activeChat]);

    // Effect to scroll to bottom (no changes needed)
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const handleSendMessage = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newMessage.trim() || !activeChat) return;

        try {
            const token = localStorage.getItem('token');
            // This POST request now also triggers the socket emit on the backend for the other user
            const response = await axios.post(`${API_BASE_URL}/api/chats/send`, 
                { chat_id: activeChat.chat_id, message: newMessage.trim() },
                { headers: { Authorization: `Bearer ${token}` } }
            );
            
            // The sender adds their own message to the UI immediately for a snappy feel.
            // The receiver will get this same message via the socket.
            setMessages(prev => [...prev, response.data.data]);
            setNewMessage('');
        } catch (err) { alert("Failed to send message."); }
    };
    
    // getImageUrl function (no changes needed)
    const getImageUrl = (path?: string | null): string => {
        if (!path) return '/default-profile.png';
        if (path.startsWith('http')) return path;
        return `${API_BASE_URL}/${path.replace(/^uploads\/uploads\//, 'uploads/')}`;
    };

    // The entire JSX return block is the same as before.
    return (
        <>
            <Navbar />
            <div className="chat-page-layout">
                {/* Sidebar */}
                <aside className="chat-sidebar">
                    <div className="sidebar-header"><h2>Conversations</h2></div>
                    <div className="chat-list">
                        {loadingChats ? <p>Loading chats...</p> :
                         error ? <p className="error-message">{error}</p> :
                         chats.length === 0 ? <p className="no-chats-message">No conversations yet.</p> :
                         chats.map(chat => (
                            <div key={chat.chat_id}
                                className={`chat-list-item ${activeChat?.chat_id === chat.chat_id ? 'active' : ''}`}
                                onClick={() => setActiveChat(chat)}>
                                <img src={getImageUrl(chat.otherUser?.profile_picture)} alt={chat.otherUser?.fullname} className="avatar" />
                                <div className="chat-item-details">
                                    <p className="chat-item-name">{chat.otherUser?.fullname || 'Unknown User'}</p>
                                    <p className="chat-item-preview">Click to view messages</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </aside>

                {/* Main Chat Window */}
                <main className="chat-window">
                    {activeChat ? (
                        <>
                            <header className="chat-window-header">
                                <h3>{activeChat.otherUser?.fullname || 'Chat'}</h3>
                                <Link to={`/user-profile/${activeChat.otherUser?.user_id}`}>View profile</Link>
                            </header>
                            <div className="messages-container">
                                {loadingMessages ? <p>Loading messages...</p> : (
                                    messages.map(msg => (
                                        <div key={msg.message_id} className={`message-bubble ${msg.sender_id === loggedInUserId ? 'sent' : 'received'}`}>
                                            <p>{msg.message}</p>
                                        </div>
                                    ))
                                )}
                                <div ref={messagesEndRef} />
                            </div>
                            <form onSubmit={handleSendMessage} className="message-input-area">
                                <input type="text" placeholder="Type a message..." value={newMessage} onChange={(e) => setNewMessage(e.target.value)} />
                                <button type="submit" disabled={!newMessage.trim()}>Send</button>
                            </form>
                        </>
                    ) : (
                        <div className="no-chat-selected">
                            <p>Select a conversation from the left to start chatting.</p>
                        </div>
                    )}
                </main>
            </div>
        </>
    );
};

export default ChatPage;