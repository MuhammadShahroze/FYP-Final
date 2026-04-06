import { createContext, useContext, useState, ReactNode, useEffect } from "react";
import api from "../lib/api";

export type UserRole = "student" | "university" | "scholarship_org" | "admin";
export type StudentTier = "guest" | "registered" | "pro";

export interface ShortlistItem {
  _id: string;
  itemId: any; // populated item
  itemType: "program" | "scholarship";
  addedAt: string;
}

export interface UserProfile {
  _id: string;
  email: string;
  name: string;
  role: UserRole;
  studentTier?: StudentTier;
  institutionName?: string;
  nationality?: string;
  dateOfBirth?: string;
  phone?: string;
  avatar?: string;
  subscriptionStatus?: "active" | "inactive" | "expired";
  profileCompletion: number;
  academicInfo?: any[];
  preferences?: {
    countries: string[];
    subjects: string[];
    degreeLevels: string[];
  };
  documents?: any[];
  shortlist?: ShortlistItem[];
  verified: boolean;
}

interface AuthContextType {
  user: UserProfile | null;
  isAuthenticated: boolean;
  loading: boolean;
  login: (email: string, password: string, returnUrl?: string) => Promise<boolean>;
  register: (data: RegisterData) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
  updateProfile: (updates: Partial<UserProfile>) => Promise<boolean>;
  addToShortlist: (id: string, type: "program" | "scholarship") => Promise<boolean>;
  removeFromShortlist: (id: string) => Promise<boolean>;
  refreshUser: () => Promise<void>;
}

export interface RegisterData {
  name: string;
  email: string;
  password: string;
  role: UserRole;
  institution?: string;
  nationality?: string;
  dateOfBirth?: string;
}

const AuthContext = createContext<AuthContextType>({} as AuthContextType);

// Using token in localStorage rather than the entire user object
const TOKEN_KEY = "token";

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  // Initial load
  useEffect(() => {
    const initUser = async () => {
      const token = localStorage.getItem(TOKEN_KEY);
      if (token) {
        try {
          const res = await api.get("/auth/me");
          setUser(res.data.data);
        } catch (error) {
          console.error("Failed to fetch user, token might be invalid/expired");
          localStorage.removeItem(TOKEN_KEY);
          setUser(null);
        }
      }
      setLoading(false);
    };

    initUser();
  }, []);

  const login = async (email: string, password: string, returnUrl?: string): Promise<boolean> => {
    try {
      const res = await api.post("/auth/login", { email, password });
      
      const { token, user: userData } = res.data;
      localStorage.setItem(TOKEN_KEY, token);
      setUser(userData);
      
      // We can also fetch /auth/me to get the fully populated shortlist, etc.
      const syncRes = await api.get("/auth/me");
      setUser(syncRes.data.data);

      return true;
    } catch (error) {
      console.error(error);
      return false;
    }
  };

  const register = async (data: RegisterData): Promise<{ success: boolean; error?: string }> => {
    try {
      const res = await api.post("/auth/register", data);
      const { token, user: userData } = res.data;
      localStorage.setItem(TOKEN_KEY, token);
      setUser(userData);
      return { success: true };
    } catch (error: any) {
      console.error(error);
      const message = error.response?.data?.error || "Registration failed";
      return { success: false, error: message };
    }
  };

  const logout = () => {
    localStorage.removeItem(TOKEN_KEY);
    setUser(null);
  };

  const updateProfile = async (updates: Partial<UserProfile>): Promise<boolean> => {
    try {
      const res = await api.put("/users/profile", updates);
      setUser(res.data.data);
      return true;
    } catch (error) {
      console.error(error);
      return false;
    }
  };

  const addToShortlist = async (id: string, type: "program" | "scholarship"): Promise<boolean> => {
    try {
      const res = await api.post("/users/shortlist", { itemId: id, itemType: type });
      setUser(res.data.data);
      return true;
    } catch (error) {
      console.error(error);
      return false;
    }
  };

  const removeFromShortlist = async (id: string): Promise<boolean> => {
    try {
      const res = await api.delete(`/users/shortlist/${id}`);
      setUser(res.data.data);
      return true;
    } catch (error) {
      console.error(error);
      return false;
    }
  };

  const refreshUser = async () => {
    try {
      const res = await api.get("/auth/me");
      setUser(res.data.data);
    } catch (error) {
      console.error("Refresh user failed:", error);
    }
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      isAuthenticated: !!user, 
      loading,
      login, 
      register, 
      logout, 
      updateProfile, 
      addToShortlist, 
      removeFromShortlist,
      refreshUser
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
