export type Loan = {
  id: string;
  title: string;
  monthly: number;
  installments: number;
  paidCount: number;
  notes?: string;
};

export type GoalContribution = { month: string; amount: number };

export type Goal = {
  id: string;
  title: string;
  target: number;
  monthlyPlan?: number;
  contributions: GoalContribution[];
};

export type Account = {
  id: string;
  bank: string;
  balance: number;
};

export type SavingsEntry = { ym: string; amount: number };

export type Planning = {
  loans: Loan[];
  goals: Goal[];
  accounts: Account[];
  savingsGoal?: number;
  savingsEntries?: SavingsEntry[];
  updatedAt: number;
};
