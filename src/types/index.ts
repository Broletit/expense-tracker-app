export interface Expense {
  id: string;
  amount: number;
  description: string;
  category: string;
  date: string; 
}

export interface FilterState {
  dateRange: [string, string] | null; 
  categories: string[];              
  minAmount: number | null;
  maxAmount: number | null;
  search: string;       
  sortOption: string;             
}
