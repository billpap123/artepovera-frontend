// src/context/UserContext.tsx
import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
  useCallback,
} from 'react';
import axios from 'axios';
import { io, Socket } from 'socket.io-client';

/* -------------------------------------------------------------------------- */
/*  CONFIG                                                                    */
/* -------------------------------------------------------------------------- */
const API_BASE_URL =
  import.meta.env.VITE_API_URL || 'https://artepovera-backend.onrender.com';

/* -------------------------------------------------------------------------- */
/*  TYPES                                                                     */
/* -------------------------------------------------------------------------- */
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

  loginUser: (userData: UserData, token: string) => void;
  logoutUser: () => void;

  setUserId: (userId: number | null) => void;
  setArtistId: (id: number | null) => void;
  setEmployerId: (id: number | null) => void;
  setUserType: (t: string | null) => void;
  setFullname: (n: string | null) => void;

  notifications: any[];
  setNotifications: React.Dispatch<React.SetStateAction<any[]>>;
  socket: Socket | null;
};

const UserContext = createContext<UserContextType | undefined>(undefined);

/* -------------------------------------------------------------------------- */
/*  helper – update localStorage                                              */
/* -------------------------------------------------------------------------- */
const updateUserInStorage = (updates: Partial<UserData>) => {
  const raw = localStorage.getItem('user');
  if (!raw) return;
  try {
    const cur = JSON.parse(raw);
    localStorage.setItem('user', JSON.stringify({ ...cur, ...updates }));
  } catch (e) {
    console.error('Failed to update localStorage user', e);
  }
};

/* -------------------------------------------------------------------------- */
/*  PROVIDER                                                                  */
/* -------------------------------------------------------------------------- */
export const UserProvider = ({ children }: { children: ReactNode }) => {
  /* ------------------------------ state ---------------------------------- */
  const [userId, setUserIdState] = useState<number | null>(null);
  const [artistId, setArtistIdState] = useState<number | null>(null);
  const [employerId, setEmployerIdState] = useState<number | null>(null);
  const [userType, setUserTypeState] = useState<string | null>(null);
  const [fullname, setFullnameState] = useState<string | null>(null);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [socket, setSocket] = useState<Socket | null>(null);

  /* ----------------------------- login / logout -------------------------- */
  const loginUser = useCallback((u: UserData, token: string) => {
    setUserIdState(u.user_id);
    setUserTypeState(u.user_type);
    setFullnameState(u.fullname);
    setArtistIdState(u.artist_id || null);
    setEmployerIdState(u.employer_id || null);
    localStorage.setItem('user', JSON.stringify(u));
    localStorage.setItem('token', token);
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

  /* --------------------------- bootstrap from storage -------------------- */
  useEffect(() => {
    const raw = localStorage.getItem('user');
    const token = localStorage.getItem('token');
    if (raw && token) {
      try {
        loginUser(JSON.parse(raw), token);
      } catch (e) {
        console.error('[UserContext] bad stored user', e);
        logoutUser();
      }
    }
  }, [loginUser, logoutUser]);

  /* --------------------------- setters that sync storage ----------------- */
  const setUserId = (id: number | null) => {
    setUserIdState(id);
    updateUserInStorage({ user_id: id! });
  };
  const setArtistId = (id: number | null) => {
    setArtistIdState(id);
    updateUserInStorage({ artist_id: id! });
  };
  const setEmployerId = (id: number | null) => {
    setEmployerIdState(id);
    updateUserInStorage({ employer_id: id! });
  };
  const setUserType = (t: string | null) => {
    setUserTypeState(t);
    updateUserInStorage({ user_type: t! });
  };
  const setFullname = (n: string | null) => {
    setFullnameState(n);
    updateUserInStorage({ fullname: n! });
  };

  /* --------------------------- Socket.IO lifecycle ----------------------- */
  useEffect(() => {
    // 👉 1. Όταν ΔΕΝ υπάρχει userId αποσυνδέσου και καθάρισε state
    if (!userId) {
      socket?.disconnect();
      setSocket(null);
      return;               // early-exit
    }
  
    // 👉 2. Φτιάχνεις ΝΕΑ σύνδεση (δεν ελέγχουμε εδώ το socket)
    const newSocket = io(API_BASE_URL, {
      withCredentials: false,
      transports: ['websocket'],
    });
  
    newSocket.emit('add_user', userId);
    setSocket(newSocket);
  
    // 👉 3. Αρχικές ειδοποιήσεις
    const token = localStorage.getItem('token');
    if (token) {
      axios
        .get(`${API_BASE_URL}/api/notifications/${userId}`, {
          headers: { Authorization: `Bearer ${token}` },
        })
        .then(r => setNotifications(r.data.notifications || []))
        .catch(err => console.error('Failed to fetch initial notifications', err));
    }
  
    // 👉 4. CLEAN-UP — επιστρέφει **function** που ΔΕΝ επιστρέφει τίποτα
    return () => {
      newSocket.disconnect();     // TypeScript OK
    };
  }, [userId]);                   // ← τρέχει μόνο όταν αλλάζει χρήστης
  
  /* --------------------------- live notif listener ----------------------- */
  useEffect(() => {
    if (!socket) return;          // κανένα socket ακόμη
  
    const onNotif = (n: any) => setNotifications(prev => [n, ...prev]);
    socket.on('new_notification', onNotif);
  
    return () => {
      socket.off('new_notification', onNotif);   // clean-up σωστό
    };
  }, [socket]);                    // τρέχει όταν οριστεί ή αλλάξει socket
  
  /* --------------------------- provider value ---------------------------- */
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

/* -------------------------------------------------------------------------- */
/*  Hook                                                                       */
/* -------------------------------------------------------------------------- */
export const useUserContext = () => {
  const ctx = useContext(UserContext);
  if (!ctx) throw new Error('useUserContext must be used within a UserProvider');
  return ctx;
};
