import { configureStore } from "@reduxjs/toolkit";
import { persistStore, persistReducer } from "redux-persist";
import storage from "redux-persist/lib/storage";
import IchthusReducer from "./IchthusSlice";

const persistConfig = {
  key: "root",
  version: 1,
  storage,
  blacklist: ["checkedBrands", "checkedCategories", "checkedCategoriesTwo"], // Do not persist these keys
};

const persistedReducer = persistReducer(persistConfig, IchthusReducer);

export const store = configureStore({
  reducer: { orebiReducer: persistedReducer },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: false,
    }),
  devTools: process.env.NODE_ENV !== "production", // Disable Redux DevTools in production
});

export let persistor = persistStore(store);
