'use client';

import { configureStore } from "@reduxjs/toolkit";
import expensesReducer from "../features/expenses/expensesSlice";
import filtersReducer from "../features/filters/filtersSlice";
import themeReducer from "../features/theme/themeSlice";

export const store = configureStore({
  reducer: {
    expenses: expensesReducer,
    filters: filtersReducer,
    theme: themeReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
