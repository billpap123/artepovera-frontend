// src/context/UserContext.tsx
import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import axios from 'axios';
import { io, Socket } from 'socket.io-client';

const API_BASE_URL = import.meta.env.VITE_API_URL || "https://artepovera2.vercel.app";

// The full user object shape
interface UserData {
  user_id: number;
  artist_id?: number;
  employer_id?: number;
  user_type: string;
  fullname: string;
}

type UserContextType = {
  userId: number | null;
  artistId: number | null;
  employerId: number | null;
  userType: string | null;
  fullname: string | null;
  
  // Centralized functions to manage login/logout
  loginUser: (userData: UserData, token: string) => void;
  logoutUser: () => void;
  
  // --- FIX: Re-adding individual setters for other pages to use ---
  setUserId: (userId: number | null) => void;
  setArtistId: (artistId: number | null) => void;
  setEmployerId: (employerId: number | null) => void;
  setUserType: (type: string | null) => void;
  setFullname: (name: string | null) => void;
  
  notifications: any[];
  setNotifications: React.Dispatch<React.SetStateAction<any[]>>;
  socket: Socket | null;
};

const UserContext = createContext<UserContextType | undefined>(undefined);

// Helper function to safely update the user in localStorage
const updateUserInStorage = (updates: Partial<UserData>) => {
  const storedUserString = localStorage.getItem('user');
  if (storedUserString) {
    try {
      const currentUser = JSON.parse(storedUserString);
      const updatedUser = { ...currentUser, ...updates };
      localStorage.setItem('user', JSON.stringify(updatedUser));
    } catch (e) {
      console.error("Failed to update user in storage", e);
    }
  }
};


export const UserProvider = ({ children }: { children: ReactNode }) => {
  const [userId, setUserIdState] = useState<number | null>(null);
  const [artistId, setArtistIdState] = useState<number | null>(null);
  const [employerId, setEmployerIdState] = useState<number | null>(null);
  const [userType, setUserTypeState] = useState<string | null>(null);
  const [fullname, setFullnameState] = useState<string | null>(null);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [socket, setSocket] = useState<Socket | null>(null);

  const loginUser = useCallback((userData: UserData, token: string) => {
    console.log("!!!!!!!! FRONTEND CONTEXT received this user object:", userData);

    setUserIdState(userData.user_id);
    setUserTypeState(userData.user_type);
    setFullnameState(userData.fullname);
    setArtistIdState(userData.artist_id || null);
    setEmployerIdState(userData.employer_id || null);

    localStorage.setItem('user', JSON.stringify(userData));
    localStorage.setItem('token', token); // Also manage token here for consistency
  }, []);

  const logoutUser = useCallback(() => {
    setUserIdState(null);
    setArtistIdState(null);
    setEmployerIdState(null);
    setUserTypeState(null);
    setFullnameState(null);
    setNotifications([]);

    localStorage.removeItem('user');
    localStorage.removeItem('token');
  }, []);

  useEffect(() => {
    const storedUserString = localStorage.getItem('user');
    const token = localStorage.getItem('token');
    if (storedUserString && token) {
      try {
        const parsedUser: UserData = JSON.parse(storedUserString);
        loginUser(parsedUser, token);
      } catch (e) {
        console.error("[UserContext] Failed to parse stored user, logging out:", e);
        logoutUser();
      }
    }
  }, [loginUser, logoutUser]);

  // --- FIX: Smart setter functions that update both state and localStorage ---
  const setUserId = (id: number | null) => { setUserIdState(id); updateUserInStorage({ user_id: id! }); };
  const setArtistId = (id: number | null) => { setArtistIdState(id); updateUserInStorage({ artist_id: id! }); };
  const setEmployerId = (id: number | null) => { setEmployerIdState(id); updateUserInStorage({ employer_id: id! }); };
  const setUserType = (type: string | null) => { setUserTypeState(type); updateUserInStorage({ user_type: type! }); };
  const setFullname = (name: string | null) => { setFullnameState(name); updateUserInStorage({ fullname: name! }); };

  // Socket.IO and notification logic
  useEffect(() => {
    if (userId) {
      const newSocket = io(API_BASE_URL);
      setSocket(newSocket);
      newSocket.emit('add_user', userId);

      const token = localStorage.getItem('token');
      if (token) {
        axios.get(`${API_BASE_URL}/api/notifications/${userId}`, {
          headers: { Authorization: `Bearer ${token}` }
        }).then(response => {
          setNotifications(response.data.notifications || []);
        }).catch(err => console.error("Failed to fetch initial notifications:", err));
      }

      // --- FIX: The cleanup function now has a body to satisfy TypeScript ---
      return () => {
        newSocket.disconnect();
      };
    } else {
      if (socket) {
        socket.disconnect();
        setSocket(null);
      }
    }
  }, [userId]);

  useEffect(() => {
    if (socket) {
      socket.on('new_notification', (newNotification) => {
        setNotifications((prev) => [newNotification, ...prev]);
      });
      return () => { socket.off('new_notification'); };
    }
  }, [socket]);

  return (
    <UserContext.Provider
      value={{
        userId,
        artistId,
        employerId,
        userType,
        fullname,
        loginUser,
        logoutUser,
        // Re-add the individual setters to the context value
        setUserId,
        setArtistId,
        setEmployerId,
        setUserType,
        setFullname,
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