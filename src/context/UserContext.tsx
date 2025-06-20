// src/context/UserContext.tsx
import React, {
  createContext, useContext, useState, useEffect,
  ReactNode, useCallback,
} from 'react';
import axios from 'axios';
import { io, Socket } from 'socket.io-client';

const API_BASE_URL =
  import.meta.env.VITE_API_URL || 'https://artepovera-backend.onrender.com';

/* ---------- types ---------- */
interface UserData {
  user_id: number;
  artist_id?: number;
  employer_id?: number;
  user_type: string;
  fullname: string;
}
type Ctx = {
  userId: number | null;
  artistId: number | null;
  employerId: number | null;
  userType: string | null;
  fullname: string | null;
  loginUser: (u: UserData, t: string) => void;
  logoutUser: () => void;
  setUserId: (n: number | null) => void;
  setArtistId: (n: number | null) => void;
  setEmployerId: (n: number | null) => void;
  setUserType: (s: string | null) => void;
  setFullname: (s: string | null) => void;
  notifications: any[];
  setNotifications: React.Dispatch<React.SetStateAction<any[]>>;
  socket: Socket | null;
};
const UserContext = createContext<Ctx | undefined>(undefined);

/* ---------- helper ---------- */
const updateLocal = (u: Partial<UserData>) => {
  const raw = localStorage.getItem('user');
  if (!raw) return;
  localStorage.setItem('user', JSON.stringify({ ...JSON.parse(raw), ...u }));
};

/* ---------- provider ---------- */
export const UserProvider = ({ children }: { children: ReactNode }) => {
  const [userId, setUserIdState]             = useState<number | null>(null);
  const [artistId, setArtistIdState]         = useState<number | null>(null);
  const [employerId, setEmployerIdState]     = useState<number | null>(null);
  const [userType, setUserTypeState]         = useState<string | null>(null);
  const [fullname, setFullnameState]         = useState<string | null>(null);
  const [notifications, setNotifications]    = useState<any[]>([]);
  const [socket, setSocket]                  = useState<Socket | null>(null);

  /* ---- login / logout ---- */
  const loginUser = useCallback((u: UserData, tok: string) => {
    setUserIdState(u.user_id);
    setUserTypeState(u.user_type);
    setFullnameState(u.fullname);
    setArtistIdState(u.artist_id ?? null);
    setEmployerIdState(u.employer_id ?? null);
    localStorage.setItem('user', JSON.stringify(u));
    localStorage.setItem('token', tok);
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

  /* ---- bootstrap από localStorage ---- */
  useEffect(() => {
    const raw   = localStorage.getItem('user');
    const token = localStorage.getItem('token');
    if (raw && token) {
      try { loginUser(JSON.parse(raw), token); }
      catch { logoutUser(); }
    }
  }, [loginUser, logoutUser]);

  /* ---- setters που sync-άρουν localStorage ---- */
  const setUserId      = (n: number | null) => { setUserIdState(n); updateLocal({ user_id: n! }); };
  const setArtistId    = (n: number | null) => { setArtistIdState(n); updateLocal({ artist_id: n! }); };
  const setEmployerId  = (n: number | null) => { setEmployerIdState(n); updateLocal({ employer_id: n! }); };
  const setUserType    = (s: string | null)  => { setUserTypeState(s); updateLocal({ user_type: s! }); };
  const setFullname    = (s: string | null)  => { setFullnameState(s); updateLocal({ fullname: s! }); };

  /* ---------------------------------------------------------------------- */
  /*  Socket.IO lifecycle – ΧΩΡΙΣ credentials και με έλεγχο polling         */
  /* ---------------------------------------------------------------------- */
  useEffect(() => {
    if (!userId) { socket?.disconnect(); setSocket(null); return; }

    const newSocket = io(API_BASE_URL, {
      transports: ['websocket'],      // 🚫 απενεργοποιεί Polling
      withCredentials: false,
      // ακόμη κι αν «πέσει» σε polling (π.χ. Render free),
      // βεβαιώσου ότι δεν θα στείλει credentials:
      transportOptions: { polling: { withCredentials: false } },
    });

    newSocket.emit('add_user', userId);
    setSocket(newSocket);

    const token = localStorage.getItem('token');
    if (token) {
      axios
        .get(`${API_BASE_URL}/api/notifications/${userId}`, {
          headers: { Authorization: `Bearer ${token}` },
        })
        .then(r => setNotifications(r.data.notifications || []))
        .catch(err => console.error('Failed to fetch notifications', err));
    }
    return () => { newSocket.disconnect(); };
  }, [userId]);

  /* ---- live notifications ---- */
  useEffect(() => {
    if (!socket) return;
    const handler = (n: any) => setNotifications(p => [n, ...p]);
    socket.on('new_notification', handler);
    return () => { socket.off('new_notification', handler); };
  }, [socket]);

  /* ---- provider value ---- */
  return (
    <UserContext.Provider value={{
      userId, artistId, employerId, userType, fullname,
      loginUser, logoutUser,
      setUserId, setArtistId, setEmployerId, setUserType, setFullname,
      notifications, setNotifications, socket,
    }}>
      {children}
    </UserContext.Provider>
  );
};

/* ---------- hook ---------- */
export const useUserContext = () => {
  const ctx = useContext(UserContext);
  if (!ctx) throw new Error('useUserContext must be used within UserProvider');
  return ctx;
};
