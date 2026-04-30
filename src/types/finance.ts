export type FinanceExpense = {
  id: string;
  label: string;
  amount: number;
};

export type Source = {
  id: string;
  name: string;
  income: number;
  expenses: FinanceExpense[];
};

export type FinanceMonth = {
  sources: Source[];
  createdAt?: number;
};
