import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { Expense } from "../../types";
import { v4 as uuidv4 } from "uuid";

type State = {
  items: Expense[];
  loading: boolean;
  error: string | null;
};

const initialState: State = {
  items: [],
  loading: false,
  error: null,
};

const expensesSlice = createSlice({
  name: "expenses",
  initialState,
  reducers: {
    addExpense: (state, action: PayloadAction<Omit<Expense, "id">>) => {
      state.items.push({ ...action.payload, id: uuidv4() });
    },
    updateExpense: (state, action: PayloadAction<Expense>) => {
      const index = state.items.findIndex((e) => e.id === action.payload.id);
      if (index !== -1) {
        state.items[index] = action.payload;
      }
    },
    deleteExpense: (state, action: PayloadAction<string>) => {
      state.items = state.items.filter((e) => e.id !== action.payload);
    },
  },
});

export const { addExpense, updateExpense, deleteExpense } = expensesSlice.actions;
export default expensesSlice.reducer;
