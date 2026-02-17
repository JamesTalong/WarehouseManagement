import React, { createContext, useEffect, useState } from "react";
import { useSelector, useDispatch } from "react-redux";
import { selectIsLoggedIn } from "./IchthusSlice";

const INITIAL_STATE = {
  currentUser: JSON.parse(localStorage.getItem("user")) || null,
};

export const AuthContext = createContext(INITIAL_STATE);

export const AuthContextProvider = ({ children }) => {
  const isLoggedIn = useSelector(selectIsLoggedIn);
  const [currentUser, setCurrentUser] = useState(INITIAL_STATE.currentUser);
  const dispatch = useDispatch();

  useEffect(() => {
    if (currentUser) {
      localStorage.setItem("user", JSON.stringify(currentUser));
    }
  }, [currentUser]);

  return (
    <AuthContext.Provider
      value={{ isLoggedIn, currentUser, setCurrentUser, dispatch }}
    >
      {children}
    </AuthContext.Provider>
  );
};
