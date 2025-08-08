export type Row = { label: string; amount: number };

export type BudgetMonth = {
  incomes: Row[];
  expenses: Row[];
  totals: { income: number; expense: number; remaining: number };
  createdAt?: number;
};
