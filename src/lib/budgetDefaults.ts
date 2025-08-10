// src/lib/budgetDefaults.ts
import type { BudgetMonth, Row } from "../types/generics";

export const DEFAULT_INCOMES = ["Nómina", "Ingresos adicionales"] as const;
export const DEFAULT_EXPENSES = [
  "Vivienda",
  "Alimentación",
  "Transporte",
  "Gimnasio",
  "Tarjeta crédito",
  "Suscripciones",
] as const;

function rowTotal(r: Row): number {
  return r.breakdown?.length
    ? r.breakdown.reduce((s, x) => s + (x.amount || 0), 0)
    : r.amount || 0;
}

function pickByDefaults(
  source: Row[] | undefined,
  defs: readonly string[]
): Row[] {
  const src = source ?? [];
  return defs.map((label) => {
    const found = src.find((r) => r.label === label);

    if (!found) return { label, amount: 0 };

    // Construimos el objeto SIN campos undefined
    const base: Row = {
      label,
      amount: found.amount ?? 0,
    };

    // Solo añadimos breakdown si existe (y normalizamos sus amounts)
    if (found.breakdown && found.breakdown.length > 0) {
      base.breakdown = found.breakdown.map((b) => ({
        label: b.label,
        amount: b.amount ?? 0,
      }));
    }

    return base;
  });
}

function calcTotals(b: BudgetMonth) {
  const income = (b.incomes ?? []).reduce((s, r) => s + rowTotal(r), 0);
  const expense = (b.expenses ?? []).reduce((s, r) => s + rowTotal(r), 0);
  return { income, expense, remaining: income - expense };
}

export function projectToDefaults(prev: BudgetMonth): BudgetMonth {
  const projected: BudgetMonth = {
    incomes: pickByDefaults(prev.incomes, DEFAULT_INCOMES),
    expenses: pickByDefaults(prev.expenses, DEFAULT_EXPENSES),
    totals: { income: 0, expense: 0, remaining: 0 },
  };
  projected.totals = calcTotals(projected);
  return projected;
}
