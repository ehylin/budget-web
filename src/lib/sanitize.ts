import type { BudgetMonth, Row } from "../types/generics";

export function sanitizeRow(r: Row): Row {
  const out: Row = {
    label: r.label ?? "",
    amount: r.amount ?? 0,
  };
  if (r.breakdown && r.breakdown.length > 0) {
    out.breakdown = r.breakdown.map((b) => ({
      label: b.label ?? "",
      amount: b.amount ?? 0,
    }));
  }
  return out;
}

export function sanitizeBudget(b: BudgetMonth): BudgetMonth {
  const incomes = (b.incomes ?? []).map(sanitizeRow);
  const expenses = (b.expenses ?? []).map(sanitizeRow);
  const totals = {
    income: b.totals?.income ?? 0,
    expense: b.totals?.expense ?? 0,
    remaining: b.totals?.remaining ?? 0,
  };
  return { incomes, expenses, totals };
}
