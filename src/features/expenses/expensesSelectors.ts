import { RootState } from "../../app/store";

export const selectAllExpenses = (state: RootState) => state.expenses.items;
export const selectExpensesLoading = (state) => state.expenses.loading;
export const selectExpensesError = (state) => state.expenses.error;
