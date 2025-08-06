import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { FilterState } from "../../types";

const initialState: FilterState = {
  dateRange: null,
  categories: [],
  minAmount: null,
  maxAmount: null,
  search: "",
  sortOption: "date-desc", 
};

const filtersSlice = createSlice({
  name: "filters",
  initialState,
  reducers: {
    setDateRange: (state, action: PayloadAction<[string, string] | null>) => {
      state.dateRange = action.payload;
    },
    setCategories: (state, action: PayloadAction<string[]>) => {
      state.categories = action.payload;
    },
    setMinAmount: (state, action: PayloadAction<number | null>) => {
      state.minAmount = action.payload;
    },
    setMaxAmount: (state, action: PayloadAction<number | null>) => {
      state.maxAmount = action.payload;
    },
    setSearch: (state, action: PayloadAction<string>) => {
      state.search = action.payload;
    },
    setSortOption: (state, action: PayloadAction<string>) => {
      state.sortOption = action.payload;
    },
    resetFilters: () => initialState,
  },
});

export const {
  setDateRange,
  setCategories,
  setMinAmount,
  setMaxAmount,
  setSearch,
  setSortOption,
  resetFilters,
} = filtersSlice.actions;

export default filtersSlice.reducer;
