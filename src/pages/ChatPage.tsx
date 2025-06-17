// src/pages/ChatPage.tsx
import React, { useState, useEffect, useRef } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import axios from 'axios';
import io, { Socket } from 'socket.io-client';
import { useTranslation } from 'react-i18next';
import Navbar from '../components/Navbar';
import { useUserContext } from '../context/UserContext';
import '../styles/ChatPage.css';
// --- NEW: Import the back arrow icon ---
import { FaArrowLeft } from 'react-icons/fa';

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
    const { t } = useTranslation();
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

    const socketRef = useRef<Socket | null>(null);

    useEffect(() => {
        if (loggedInUserId) {
            if (!socketRef.current) {
                socketRef.current = io(API_BASE_URL);
            }
    
            const handleNewMessage = (incomingMessage: Message) => {
                if (incomingMessage.sender_id === loggedInUserId) {
                    return; 
                }
    
                setActiveChat(currentActiveChat => {
                    if (currentActiveChat && incomingMessage.chat_id === currentActiveChat.chat_id) {
                        setMessages(prevMessages => [...prevMessages, incomingMessage]);
                    }
                    return currentActiveChat;
                });
            };
    
            socketRef.current.on('new_message', handleNewMessage);
    
            return () => {
                socketRef.current?.off('new_message', handleNewMessage);
            };
        }
    }, [loggedInUserId]);
    

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
                setError(err.response?.data?.message || t('chatPage.errors.loadFailed'));
            } finally {
                setLoadingChats(false);
            }
        };

        if (loggedInUserId) fetchUserChats();
    }, [loggedInUserId, searchParams, t]);

    useEffect(() => {
        if (!activeChat) {
            setMessages([]);
            return;
        }

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
        } catch (err) { 
            alert(t('chatPage.errors.sendFailed')); 
        }
    };
    
    const getImageUrl = (path?: string | null): string => {
        if (!path) return '/default-profile.png';
        if (path.startsWith('http')) return path;
        return `${API_BASE_URL}/${path.replace(/^uploads\/uploads\//, 'uploads/')}`;
    };

    return (
        <>
            <Navbar />
            {/* --- MODIFIED: The chat-view-active class is now dynamically applied --- */}
            <div className={`chat-page-layout ${activeChat ? 'chat-view-active' : ''}`}>
                <aside className="chat-sidebar">
                    <div className="sidebar-header"><h2>{t('chatPage.sidebar.title')}</h2></div>
                    <div className="chat-list">
                        {loadingChats ? <p>{t('chatPage.sidebar.loading')}</p> :
                         error ? <p className="error-message">{error}</p> :
                         chats.length === 0 ? <p className="no-chats-message">{t('chatPage.sidebar.noChats')}</p> :
                         chats.map(chat => (
                            <div key={chat.chat_id}
                                className={`chat-list-item ${activeChat?.chat_id === chat.chat_id ? 'active' : ''}`}
                                onClick={() => setActiveChat(chat)}>
                                <img src={getImageUrl(chat.otherUser?.profile_picture)} alt={chat.otherUser?.fullname || t('chatPage.sidebar.item.unknownUser')} className="avatar" />
                                <div className="chat-item-details">
                                    <p className="chat-item-name">{chat.otherUser?.fullname || t('chatPage.sidebar.item.unknownUser')}</p>
                                    <p className="chat-item-preview">{t('chatPage.sidebar.item.preview')}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </aside>

                <main className="chat-window">
                    {activeChat ? (
                        <>
                            <header className="chat-window-header">
                                {/* --- NEW: "Back to Chats" button for mobile --- */}
                                <button className="back-to-chats-btn" onClick={() => setActiveChat(null)}>
                                    <FaArrowLeft />
                                </button>
                                <div className="chat-header-info">
                                    <h3>{activeChat.otherUser?.fullname || t('chatPage.main.header.fallbackTitle')}</h3>
                                    <Link to={`/user-profile/${activeChat.otherUser?.user_id}`}>{t('chatPage.main.header.viewProfile')}</Link>
                                </div>
                            </header>
                            <div className="messages-container">
                                {loadingMessages ? <p>{t('chatPage.main.messages.loading')}</p> : (
                                    messages.map(msg => (
                                        <div key={msg.message_id} className={`message-bubble ${msg.sender_id === loggedInUserId ? 'sent' : 'received'}`}>
                                            <p>{msg.message}</p>
                                        </div>
                                    ))
                                )}
                                <div ref={messagesEndRef} />
                            </div>
                            <form onSubmit={handleSendMessage} className="message-input-area">
                                <input type="text" placeholder={t('chatPage.main.input.placeholder')} value={newMessage} onChange={(e) => setNewMessage(e.target.value)} />
                                <button type="submit" disabled={!newMessage.trim()}>{t('chatPage.main.input.sendButton')}</button>
                            </form>
                        </>
                    ) : (
                        <div className="no-chat-selected">
                            <p>{t('chatPage.main.placeholder.prompt')}</p>
                        </div>
                    )}
                </main>
            </div>
        </>
    );
};

export default ChatPage;