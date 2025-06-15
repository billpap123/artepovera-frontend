// src/context/UserContext.tsx
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import axios from 'axios';
import { io, Socket } from 'socket.io-client';

const API_BASE_URL = import.meta.env.VITE_API_URL || "https://artepovera2.vercel.app";

// Define the shape of your context data, now including notifications
type UserContextType = {
  userId: number | null;
  artistId: number | null;
  employerId: number | null;
  userType: string | null;
  fullname: string | null;
  setUserId: (userId: number | null) => void;
  setArtistId: (artistId: number | null) => void;
  setEmployerId: (employerId: number | null) => void;
  setUserType: (type: string | null) => void;
  setFullname: (name: string | null) => void;
  
  // --- NEW: Add notifications and socket state here ---
  notifications: any[];
  setNotifications: React.Dispatch<React.SetStateAction<any[]>>;
  socket: Socket | null;
};

const UserContext = createContext<UserContextType | undefined>(undefined);

export const UserProvider = ({ children }: { children: ReactNode }) => {
  // --- Your existing user state ---
  const [userId, setUserIdState] = useState<number | null>(null);
  const [artistId, setArtistIdState] = useState<number | null>(null);
  const [employerId, setEmployerIdState] = useState<number | null>(null);
  const [userType, setUserTypeState] = useState<string | null>(null);
  const [fullname, setFullnameState] = useState<string | null>(null);

  // --- NEW: Notification and socket state now live here ---
  const [notifications, setNotifications] = useState<any[]>([]);
  const [socket, setSocket] = useState<Socket | null>(null);

  // Your existing effect to load user data from localStorage (this is correct)
  useEffect(() => {
    const storedUserString = localStorage.getItem('user');
    if (storedUserString) {
      try {
        const parsedUser = JSON.parse(storedUserString);
        if (parsedUser && parsedUser.user_id) {
          setUserIdState(Number(parsedUser.user_id));
          setUserTypeState(parsedUser.user_type || null);
          setFullnameState(parsedUser.fullname || null);
          if (parsedUser.user_type === 'Artist' && parsedUser.artist_id) {
            setArtistIdState(Number(parsedUser.artist_id));
          }
          if (parsedUser.user_type === 'Employer' && parsedUser.employer_id) {
            setEmployerIdState(Number(parsedUser.employer_id));
          }
        }
      } catch (e) {
        console.error("[UserContext] Failed to parse stored user:", e);
      }
    }
  }, []);

  // --- NEW: All Socket.IO and notification logic now lives in the context ---
  useEffect(() => {
    // This effect runs when a user logs in (when userId is set)
    if (userId) {
      // 1. Connect to the socket server
      const newSocket = io(API_BASE_URL);
      setSocket(newSocket);
      
      // 2. Tell the server who we are
      newSocket.emit('add_user', userId);

      // 3. Fetch the user's initial list of notifications
      const token = localStorage.getItem('token');
      if (token) {
        axios.get(`${API_BASE_URL}/api/notifications/${userId}`, {
          headers: { Authorization: `Bearer ${token}` }
        }).then(response => {
          setNotifications(response.data.notifications || []);
        }).catch(err => console.error("Failed to fetch initial notifications:", err));
      }

      // 4. Disconnect when the user logs out
      return () => {
        newSocket.disconnect();
      };
    } else {
      // If there's no userId, ensure the socket is disconnected
      if (socket) {
        socket.disconnect();
        setSocket(null);
      }
    }
  }, [userId]); // Dependency: This whole block runs only when userId changes

  // This separate effect listens for incoming messages once the socket is connected
  useEffect(() => {
    if (socket) {
      socket.on('new_notification', (newNotification) => {
        // Add the new notification to the top of our global list
        setNotifications((prev) => [newNotification, ...prev]);
      });

      return () => {
        socket.off('new_notification'); // Clean up the listener
      };
    }
  }, [socket]); // Dependency: This runs only when the socket object itself changes


  // Your existing setter functions
  const setUserId = (id: number | null) => setUserIdState(id);
  const setArtistId = (id: number | null) => setArtistIdState(id);
  const setEmployerId = (id: number | null) => setEmployerIdState(id);
  const setUserType = (type: string | null) => setUserTypeState(type);
  const setFullname = (name: string | null) => setFullnameState(name);

  return (
    <UserContext.Provider
      value={{
        userId,
        artistId,
        employerId,
        userType,
        fullname,
        setUserId,
        setArtistId,
        setEmployerId,
        setUserType,
        setFullname,
        // --- NEW: Provide the global notification state to all components ---
        notifications,
        setNotifications,
        socket,
      }}
    >
      {children}
    </UserContext.Provider>
  );
};

export const useUserContext = () => {
  const context = useContext(UserContext);
  if (!context) {
    throw new Error('useUserContext must be used within a UserProvider');
  }
  return context;
};