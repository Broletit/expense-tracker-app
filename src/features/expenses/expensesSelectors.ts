import { RootState } from "../../app/store";

export const selectAllExpenses = (state: RootState) => state.expenses.items;
export const selectExpensesLoading = (state: RootState) =>
  state.expenses.loading;
export const selectExpensesError = (state: RootState) => state.expenses.error;
