"use client";

import React, {
  useMemo,
  useState,
  useEffect,
  useContext,
  createContext,
} from "react";

import { safeParse } from "src/utils/helper";

const AppContext = createContext(null);


export const AppProvider = ({ children }) => {
  // Core state
  const [userState, setUserState] = useState(null); // full user object or null

  // ---- Load from localStorage (once) ----
  useEffect(() => {
    if (typeof window === "undefined") return;
    const storedUser = safeParse(localStorage.getItem("user"));
    if (storedUser) {
      setUserState(storedUser);
    } 
  }, []);

  // ---- Public setters that also persist ----
  const setUser = (data) => {
    setUserState(data);
    if (typeof window !== "undefined") {
      if (data) localStorage.setItem("user", JSON.stringify(data));
      else localStorage.removeItem("user");
    }
  };

  
  const value = useMemo(
    () => ({
      // data
      user: userState,

      // setters
      setUser,
    }),
    [
      userState,
    ]
  );

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};

export const useAppContext = () => {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useAppContext must be used within an AppProvider");
  return ctx;
};
