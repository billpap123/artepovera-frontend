// src/context/UserContext.tsx
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

type UserContextType = {
  userId: number | null;       // Changed to number
  artistId: number | null;     // Changed to number
  employerId: number | null;   // Changed to number
  userType: string | null;
  setUserId: (userId: number | null) => void;
  setArtistId: (artistId: number | null) => void;
  setEmployerId: (employerId: number | null) => void;
  setUserType: (type: string | null) => void;
};

const UserContext = createContext<UserContextType | undefined>(undefined);

export const UserProvider = ({ children }: { children: ReactNode }) => {
  const [userId, setUserIdState] = useState<number | null>(null);
  const [artistId, setArtistIdState] = useState<number | null>(null);
  const [employerId, setEmployerIdState] = useState<number | null>(null);
  const [userType, setUserTypeState] = useState<string | null>(null);

  // --- ADDED: useEffect to load from localStorage on initial app load ---
  useEffect(() => {
    console.log("[UserContext] Attempting to load user from localStorage on mount.");
    const storedUserString = localStorage.getItem('user');
    if (storedUserString) {
      try {
        const parsedUser = JSON.parse(storedUserString);
        console.log("[UserContext] Parsed user from localStorage:", parsedUser);
        if (parsedUser && parsedUser.user_id) {
          setUserIdState(Number(parsedUser.user_id)); // Ensure it's a number
          setUserTypeState(parsedUser.user_type || null);

          if (parsedUser.user_type === 'Artist' && parsedUser.artist_id) {
            setArtistIdState(Number(parsedUser.artist_id)); // Ensure it's a number
            console.log("[UserContext] Artist ID set from localStorage:", parsedUser.artist_id);
          } else {
            setArtistIdState(null); // Ensure it's reset if not applicable
          }

          if (parsedUser.user_type === 'Employer' && parsedUser.employer_id) {
            setEmployerIdState(Number(parsedUser.employer_id)); // Ensure it's a number
          } else {
            setEmployerIdState(null); // Ensure it's reset if not applicable
          }
        }
      } catch (e) {
        console.error("[UserContext] Failed to parse stored user from localStorage:", e);
        localStorage.removeItem('user'); // Clear corrupted data
        // Reset states to null
        setUserIdState(null);
        setArtistIdState(null);
        setEmployerIdState(null);
        setUserTypeState(null);
      }
    } else {
        console.log("[UserContext] No user found in localStorage on mount.");
    }
  }, []); // Empty dependency array: runs only once on mount
  // --- END ADDED useEffect ---

  // Custom setters that also update localStorage might be useful
  // For simplicity, current Login/Register directly calls localStorage.setItem AND context setters.

  const setUserId = (id: number | null) => setUserIdState(id);
  const setArtistId = (id: number | null) => setArtistIdState(id);
  const setEmployerId = (id: number | null) => setEmployerIdState(id);
  const setUserType = (type: string | null) => setUserTypeState(type);


  return (
    <UserContext.Provider
      value={{
        userId,
        artistId,
        employerId,
        userType,
        setUserId,
        setArtistId,
        setEmployerId,
        setUserType,
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