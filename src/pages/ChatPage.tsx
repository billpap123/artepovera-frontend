// src/pages/ChatPage.tsx
import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, Link, useSearchParams } from 'react-router-dom';
import axios from 'axios';
import Navbar from '../components/Navbar';
import { useUserContext } from '../context/UserContext';
import '../styles/ChatPage.css'; // We will provide new CSS for this layout

const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:50001";

// --- Interfaces for our data ---
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

const ChatPage = () => {
    const { userId: loggedInUserId } = useUserContext();
    const navigate = useNavigate();
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

    // Fetch the list of user's chats
    useEffect(() => {
        const fetchUserChats = async () => {
            setLoadingChats(true);
            setError(null);
            try {
                const token = localStorage.getItem('token');
                // Call the new, correct endpoint
                const response = await axios.get(`${API_BASE_URL}/api/chats/my-chats`, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                const fetchedChats = response.data.chats || [];
                setChats(fetchedChats);

                // Check if URL has a chat to auto-open
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

    // Fetch messages when a chat becomes active
    useEffect(() => {
        if (!activeChat) {
            setMessages([]);
            return;
        }
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

    // Scroll to bottom when new messages appear
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);


    const handleSendMessage = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newMessage.trim() || !activeChat) return;

        try {
            const token = localStorage.getItem('token');
            const response = await axios.post(`${API_BASE_URL}/api/chats/send`, 
                { chat_id: activeChat.chat_id, message: newMessage.trim() },
                { headers: { Authorization: `Bearer ${token}` } }
            );
            
            setMessages(prev => [...prev, response.data.data]);
            setNewMessage('');
        } catch (err) { alert("Failed to send message."); }
    };
    
    const getImageUrl = (path?: string | null): string => {
        if (!path) return '/default-profile.png';
        if (path.startsWith('http')) return path;
        return `${API_BASE_URL}/${path.replace(/^uploads\/uploads\//, 'uploads/')}`;
    };

    return (
        <>
            <Navbar />
            <div className="chat-page-layout">
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

                <main className="chat-window">
                    {activeChat ? (
                        <>
                            <header className="chat-window-header">
                                <h3>{activeChat.otherUser?.fullname || 'Chat'}</h3>
                                <Link to={`/user-profile/${activeChat.otherUser?.user_id}`}>View Profile</Link>
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