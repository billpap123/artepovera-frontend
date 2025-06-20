// src/pages/ChatPage.tsx
import React, { useState, useEffect, useRef } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import axios from 'axios';
import { io, Socket } from 'socket.io-client';
import { useTranslation } from 'react-i18next';
import Navbar from '../components/Navbar';
import { useUserContext } from '../context/UserContext';
import '../styles/ChatPage.css';
import { FaArrowLeft } from 'react-icons/fa';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001';

/* -------------------------------------------------------------------------- */
/*  types                                                                     */
/* -------------------------------------------------------------------------- */
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

/* -------------------------------------------------------------------------- */
/*  component                                                                 */
/* -------------------------------------------------------------------------- */
const ChatPage = () => {
  const { t } = useTranslation();
  const { userId: loggedInUserId } = useUserContext();
  const [searchParams] = useSearchParams();

  /* ------------------------------ state ---------------------------------- */
  const [chats, setChats]             = useState<Chat[]>([]);
  const [activeChat, setActiveChat]   = useState<Chat | null>(null);
  const [messages, setMessages]       = useState<Message[]>([]);
  const [newMessage, setNewMessage]   = useState('');

  const [loadingChats, setLoadingChats]       = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [error, setError]                     = useState<string | null>(null);

  const socketRef        = useRef<Socket | null>(null);
  const messagesEndRef   = useRef<HTMLDivElement>(null);

  /* ---------------------------------------------------------------------- */
  /*  1. Socket.io – δημιουργείται ΜΙΑ φορά ανά tab                         */
  /* ---------------------------------------------------------------------- */
  useEffect(() => {
    if (!loggedInUserId) return;

    if (!socketRef.current) {
      socketRef.current = io(API_BASE_URL, {
        transports       : ['websocket'],      // ⭐ direct WS
        withCredentials  : false,              // ⭐ no cookies
        transportOptions : {                   // ⭐ even if it falls back
          polling: { withCredentials: false }  //   don't send creds
        }
      });
      socketRef.current.emit('add_user', loggedInUserId);
    }


    /* ---------- handle incoming message (dedup guard) ---------- */
    const handleNewMessage = (incoming: Message) => {
      // αγνόησε μήνυμα που το στείλαμε εμείς
      if (incoming.sender_id === loggedInUserId) return;

      setMessages(prev => {
        // αν υπάρχει ήδη, skip (dedup)
        if (prev.some(m => m.message_id === incoming.message_id)) return prev;
        // αν το chat είναι άλλο, απλώς αφήνουμε το badge για αργότερα
        if (!activeChat || activeChat.chat_id !== incoming.chat_id) return prev;
        return [...prev, incoming];
      });
    };

    socketRef.current.on('new_message', handleNewMessage);
    return () => {
      socketRef.current?.off('new_message', handleNewMessage);
    };
  }, [loggedInUserId, activeChat]);

  /* ---------------------------------------------------------------------- */
  /*  2. Φόρτωση λίστας συνομιλιών                                          */
  /* ---------------------------------------------------------------------- */
  useEffect(() => {
    const fetchUserChats = async () => {
      if (!loggedInUserId) return;
      setLoadingChats(true);
      setError(null);
      try {
        const token  = localStorage.getItem('token');
        const { data } = await axios.get(`${API_BASE_URL}/api/chats/my-chats`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        setChats(data.chats || []);

        // αν υπάρχει query ?open=<id>
        const open = searchParams.get('open');
        if (open) {
          const toOpen = data.chats.find((c: Chat) => c.chat_id === Number(open));
          if (toOpen) setActiveChat(toOpen);
        }
      } catch (err: any) {
        setError(err.response?.data?.message || t('chatPage.errors.loadFailed'));
      } finally {
        setLoadingChats(false);
      }
    };
    fetchUserChats();
  }, [loggedInUserId, searchParams, t]);

  /* ---------------------------------------------------------------------- */
  /*  3. Φόρτωση μηνυμάτων όταν αλλάζει chat                                */
  /* ---------------------------------------------------------------------- */
  useEffect(() => {
    if (!activeChat) {
      setMessages([]);
      return;
    }

    socketRef.current?.emit('join_chat', String(activeChat.chat_id));

    const fetchMessages = async () => {
      setLoadingMessages(true);
      try {
        const token = localStorage.getItem('token');
        const { data } = await axios.get(
          `${API_BASE_URL}/api/chats/${activeChat.chat_id}/messages`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        setMessages(data.messages || []);
      } catch (err) {
        console.error('Error fetching messages:', err);
      } finally {
        setLoadingMessages(false);
      }
    };
    fetchMessages();
  }, [activeChat]);

  /* ---------------------------------------------------------------------- */
  /*  4. Scroll to bottom όταν έρχονται νέα                                 */
  /* ---------------------------------------------------------------------- */
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  /* ---------------------------------------------------------------------- */
  /*  5. Send message                                                       */
  /* ---------------------------------------------------------------------- */
  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !activeChat || !loggedInUserId) return;
  
    /* ---------- 1. optimistic local bubble ---------- */
    const tmpId = -Date.now();          // negative → never collides with real ids
    const optimisticMsg: Message = {
      message_id : tmpId,               // 👈  no cast needed
      chat_id    : activeChat.chat_id,
      sender_id  : loggedInUserId,
      message    : newMessage.trim(),
      createdAt  : new Date().toISOString(),
    };
    setMessages(prev => [...prev, optimisticMsg]);
    setNewMessage('');
  
    /* ---------- 2. send to server in background ------ */
    try {
      const token   = localStorage.getItem('token');
      const { data } = await axios.post(
        `${API_BASE_URL}/api/chats/send`,
        { chat_id: activeChat.chat_id, message: optimisticMsg.message },
        { headers: { Authorization: `Bearer ${token}` } }
      );
  
      /* ---------- 3. reconcile: replace tmp with real -- */
      setMessages(prev =>
        prev.map(m => m.message_id === tmpId ? data.data : m)
      );
    } catch (err) {
      /* ---------- 4. roll back on error ---------------- */
      setMessages(prev => prev.filter(m => m.message_id !== tmpId));
      alert(t('chatPage.errors.sendFailed'));
    }
  };
    

  /* ---------------------------------------------------------------------- */
  /*  6. Helpers                                                            */
  /* ---------------------------------------------------------------------- */
  const getImageUrl = (path?: string | null) => {
    if (!path) return '/default-profile.png';
    return path.startsWith('http') ? path : `${API_BASE_URL}/${path.replace(/^uploads\/uploads\//, 'uploads/')}`;
  };

  /* ---------------------------------------------------------------------- */
  /*  7. Render                                                             */
  /* ---------------------------------------------------------------------- */
  return (
    <>
      <Navbar />

      <div className={`chat-page-layout ${activeChat ? 'chat-view-active' : ''}`}>
        {/* ------------------------ LISTA CHATS ------------------------ */}
        <aside className="chat-sidebar">
          <div className="sidebar-header"><h2>{t('chatPage.sidebar.title')}</h2></div>

          <div className="chat-list">
            {loadingChats   ? <p>{t('chatPage.sidebar.loading')}</p> :
             error          ? <p className="error-message">{error}</p> :
             chats.length === 0
                            ? <p className="no-chats-message">{t('chatPage.sidebar.noChats')}</p> :
             chats.map(chat => (
              <div key={chat.chat_id}
                   className={`chat-list-item ${activeChat?.chat_id === chat.chat_id ? 'active' : ''}`}
                   onClick={() => setActiveChat(chat)}>
                <img src={getImageUrl(chat.otherUser?.profile_picture)}
                     alt={chat.otherUser?.fullname || t('chatPage.sidebar.item.unknownUser')}
                     className="avatar" />
                <div className="chat-item-details">
                  <p className="chat-item-name">{chat.otherUser?.fullname || t('chatPage.sidebar.item.unknownUser')}</p>
                  <p className="chat-item-preview">{t('chatPage.sidebar.item.preview')}</p>
                </div>
              </div>
            ))}
          </div>
        </aside>

        {/* ------------------------ MAIN CHAT ------------------------ */}
        <main className="chat-window">
          {activeChat ? (
            <>
              <header className="chat-window-header">
                <button className="back-to-chats-btn" onClick={() => setActiveChat(null)}>
                  <FaArrowLeft />
                </button>
                <div className="chat-header-info">
                  <h3>{activeChat.otherUser?.fullname || t('chatPage.main.header.fallbackTitle')}</h3>
                  <Link to={`/user-profile/${activeChat.otherUser?.user_id}`}>
                    {t('chatPage.main.header.viewProfile')}
                  </Link>
                </div>
              </header>

              <div className="messages-container">
                {loadingMessages
                  ? <p>{t('chatPage.main.messages.loading')}</p>
                  : messages.map(m => (
                      <div key={m.message_id}
                           className={`message-bubble ${m.sender_id === loggedInUserId ? 'sent' : 'received'}`}>
                        <p>{m.message}</p>
                      </div>
                    ))}
                <div ref={messagesEndRef} />
              </div>

              <form onSubmit={handleSendMessage} className="message-input-area">
                <input
                  type="text"
                  placeholder={t('chatPage.main.input.placeholder')}
                  value={newMessage}
                  onChange={e => setNewMessage(e.target.value)}
                />
                <button type="submit" disabled={!newMessage.trim()}>
                  {t('chatPage.main.input.sendButton')}
                </button>
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
