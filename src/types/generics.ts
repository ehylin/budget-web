export type SubItem = { label: string; amount: number };

export type Row = {
  label: string;
  amount: number;
  breakdown?: SubItem[];
};

export type BudgetMonth = {
  incomes: Row[];
  expenses: Row[];
  totals: { income: number; expense: number; remaining: number };
  createdAt?: number;
};

export type Budget = {
  income: number;
  expenses: Row[];
  remaining: number;
};
