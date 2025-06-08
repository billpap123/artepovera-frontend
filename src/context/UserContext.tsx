// src/context/UserContext.tsx
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

type UserContextType = {
  userId: number | null;
  artistId: number | null;
  employerId: number | null;
  userType: string | null;
  fullname: string | null; // <<< ADD fullname
  setUserId: (userId: number | null) => void;
  setArtistId: (artistId: number | null) => void;
  setEmployerId: (employerId: number | null) => void;
  setUserType: (type: string | null) => void;
  setFullname: (name: string | null) => void; // <<< ADD setter for fullname
};

const UserContext = createContext<UserContextType | undefined>(undefined);

export const UserProvider = ({ children }: { children: ReactNode }) => {
  const [userId, setUserIdState] = useState<number | null>(null);
  const [artistId, setArtistIdState] = useState<number | null>(null);
  const [employerId, setEmployerIdState] = useState<number | null>(null);
  const [userType, setUserTypeState] = useState<string | null>(null);
  const [fullname, setFullnameState] = useState<string | null>(null); // <<< ADD fullname state

  useEffect(() => {
    console.log("[UserContext] Attempting to load user from localStorage on mount.");
    const storedUserString = localStorage.getItem('user');
    if (storedUserString) {
      try {
        const parsedUser = JSON.parse(storedUserString);
        console.log("[UserContext] Parsed user from localStorage:", parsedUser);
        if (parsedUser && parsedUser.user_id) {
          setUserIdState(Number(parsedUser.user_id));
          setUserTypeState(parsedUser.user_type || null);
          setFullnameState(parsedUser.fullname || null); // <<< ADD: Set fullname from localStorage

          if (parsedUser.user_type === 'Artist' && parsedUser.artist_id) {
            setArtistIdState(Number(parsedUser.artist_id));
          } else {
            setArtistIdState(null);
          }

          if (parsedUser.user_type === 'Employer' && parsedUser.employer_id) {
            setEmployerIdState(Number(parsedUser.employer_id));
          } else {
            setEmployerIdState(null);
          }
        }
      } catch (e) {
        console.error("[UserContext] Failed to parse stored user from localStorage:", e);
        localStorage.removeItem('user');
        setUserIdState(null);
        setArtistIdState(null);
        setEmployerIdState(null);
        setUserTypeState(null);
        setFullnameState(null); // <<< ADD: Reset on error
      }
    } else {
        console.log("[UserContext] No user found in localStorage on mount.");
    }
  }, []);

  const setUserId = (id: number | null) => setUserIdState(id);
  const setArtistId = (id: number | null) => setArtistIdState(id);
  const setEmployerId = (id: number | null) => setEmployerIdState(id);
  const setUserType = (type: string | null) => setUserTypeState(type);
  const setFullname = (name: string | null) => setFullnameState(name); // <<< ADD setter function

  return (
    <UserContext.Provider
      value={{
        userId,
        artistId,
        employerId,
        userType,
        fullname, // <<< ADD to provided value
        setUserId,
        setArtistId,
        setEmployerId,
        setUserType,
        setFullname, // <<< ADD to provided value
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