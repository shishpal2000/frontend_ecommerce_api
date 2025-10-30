"use client";

import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";

import { User } from "@/types";
import axios from "axios";
import BaseUrl from "@/BaseUrl";

interface LoginCredentials {
  username: string;
  password: string;
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  login: (credentials: LoginCredentials) => Promise<void>;
  register: (userData: User) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Initialize auth state from localStorage
  useEffect(() => {
    const initAuth = () => {
      try {
        if (typeof window !== "undefined") {
          const storedUser = localStorage.getItem("authUser");
          if (storedUser) {
            const parsedUser = JSON.parse(storedUser);
            setUser(parsedUser);
          }
        }
      } catch (error) {
        console.error("Failed to parse stored user data:", error);
        if (typeof window !== "undefined") {
          localStorage.removeItem("authUser");
        }
      } finally {
        setIsLoading(false);
      }
    };

    initAuth();
  }, []);

  const login = async (credentials: LoginCredentials): Promise<void> => {
    try {
      setIsLoading(true);

      const response = await axios.post(
        `${BaseUrl()}/authentication/login/`,
        credentials
      );

      const { data } = response.data;

      if (response.data.error_status) {
        throw new Error(response.data.message || "Login failed");
      }

      // Save tokens
      if (data.access && data.refresh) {
        localStorage.setItem("access", data.access);
        localStorage.setItem("refresh", data.refresh);
      }

      // Create user object from response
      const userData: User = {
        user_id: data.user_id || "",
        name: data.name || "",
        username: data.username || "",
        role: data.role || "",
        email: data.email || "",
      };

      setUser(userData);
      if (userData) {
        localStorage.setItem("authUser", JSON.stringify(userData));
      }
    } catch (error) {
      console.error("Login error:", error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (userData: User): Promise<void> => {
    try {
      setIsLoading(true);
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 500));

      setUser(userData);
      if (typeof window !== "undefined") {
        localStorage.setItem("authUser", JSON.stringify(userData));
      }
    } catch (error) {
      console.error("Registration error:", error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = (): void => {
    setUser(null);
    if (typeof window !== "undefined") {
      localStorage.removeItem("authUser");
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        login,
        register,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
