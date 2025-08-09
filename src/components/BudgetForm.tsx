import { useEffect, useMemo, useState } from "react";
import type { BudgetMonth, Row } from "../types/generics";
import ExpensesDonut from "./GrafDonnut";
import BreakdownEditor from "./BreakdownEditor";
import MoneyInput from "./MoneyInput";
import { formatEUR } from "../utils/money";
import { Trash } from "lucide-react";

const rowTotal = (r: Row) =>
  r.breakdown && r.breakdown.length > 0
    ? r.breakdown.reduce((s, x) => s + (x.amount || 0), 0)
    : r.amount || 0;

const empty: BudgetMonth = {
  incomes: [
    { label: "Nómina", amount: 0 },
    { label: "Ingresos adicionales", amount: 0 },
  ],
  expenses: [
    { label: "Vivienda", amount: 0 },
    { label: "Alimentación", amount: 0 },
    { label: "Transporte", amount: 0 },
    { label: "Gimnasio", amount: 0 },
    { label: "Tarjeta crédito", amount: 0 },
    { label: "Suscripciones", amount: 0 },
  ],
  totals: { income: 0, expense: 0, remaining: 0 },
};

const expensePresets: Record<string, string[]> = {
  Vivienda: ["Renta", "Luz", "Agua", "Internet"],
  Alimentación: ["Pollo", "Cerdo", "Mercadona"],
  Suscripciones: [
    "Disney",
    "Netflix",
    "Movistar",
    "Prime",
    "Antena3",
    "ChatGPT",
  ],
};

export function BudgetForm({
  initial,
  onSave,
}: {
  initial: BudgetMonth | null;
  onSave: (b: BudgetMonth) => Promise<void>;
}) {
  const [model, setModel] = useState<BudgetMonth>(initial ?? empty);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState<null | "ok" | "error">(null);

  useEffect(() => {
    if (initial) {
      setModel({
        ...initial,
        expenses: [
          ...initial.expenses,
          ...empty.expenses.filter(
            (base) => !initial.expenses.some((e) => e.label === base.label)
          ),
        ],
      });
    } else {
      setModel(empty);
    }
  }, [initial]);

  const totals = useMemo(() => {
    const income = model.incomes.reduce((s, r) => s + rowTotal(r), 0);
    const expense = model.expenses.reduce((s, r) => s + rowTotal(r), 0);
    return { income, expense, remaining: income - expense };
  }, [model]);

  const setAmount = (type: "incomes" | "expenses", idx: number, v: number) => {
    setModel((m) => {
      const copy: BudgetMonth = structuredClone(m);
      copy[type][idx].amount = v || 0;
      copy.totals = totals;
      return copy;
    });
  };

  const addRow = (type: "incomes" | "expenses") =>
    setModel((m) => ({ ...m, [type]: [...m[type], { label: "", amount: 0 }] }));

  const removeRow = (type: "incomes" | "expenses", idx: number) =>
    setModel((m) => {
      const copy: BudgetMonth = structuredClone(m);
      copy[type].splice(idx, 1);
      return copy;
    });

  const save = async () => {
    setSaving(true);
    setSaved(null);
    try {
      await onSave({ ...model, totals });
      setSaved("ok");
    } catch {
      setSaved("error");
    } finally {
      setSaving(false);
      setTimeout(() => setSaved(null), 2000);
    }
  };

  return (
    <div className="mt-2 grid md:grid-cols-2 gap-8">
      {/* Ingresos */}
      <section>
        <h2 className="font-semibold mb-2">Entrada de dinero</h2>
        <div className="space-y-2">
          {model.incomes.map((r, i) => (
            <div key={i} className="flex gap-2 items-center">
              <input
                id={`concepto-income-${i}`}
                value={r.label}
                onChange={(e) => {
                  const v = e.target.value;
                  setModel((m) => {
                    const c: BudgetMonth = structuredClone(m);
                    c.incomes[i].label = v;
                    return c;
                  });
                }}
                className="flex-1 border rounded px-2 py-1 text-xs"
                placeholder="Concepto"
              />
              <MoneyInput
                value={r.amount}
                onChangeNumber={(n) => setAmount("incomes", i, n)}
                className="w-28 text-xs"
              />
              <button
                onClick={() => removeRow("incomes", i)}
                className="text-red-500 hover:text-red-700"
                title="Eliminar ingreso"
              >
                <Trash color="red" size={16} />
              </button>
            </div>
          ))}
          <button
            className="text-sm underline"
            onClick={() => addRow("incomes")}
          >
            + Añadir ingreso
          </button>
        </div>
      </section>

      {/* Gastos */}
      <section>
        <h2 className="font-semibold mb-2">Salida de dinero</h2>
        <div className="space-y-2">
          {model.expenses.map((r, i) => {
            const hasBreakdown = !!r.breakdown && r.breakdown.length > 0;
            const presets = expensePresets[r.label] ?? [];

            return (
              <div key={i} className="border-b-2 rounded p-2 mb-2">
                <div className="flex gap-2 items-center">
                  <input
                    className="flex-1 border rounded px-2 py-1 text-xs"
                    value={r.label}
                    onChange={(e) => {
                      const v = e.target.value;
                      setModel((m) => {
                        const c: BudgetMonth = structuredClone(m);
                        c.expenses[i].label = v;
                        return c;
                      });
                    }}
                    placeholder="Categoría"
                  />

                  {hasBreakdown ? (
                    <div className="w-28 text-right px-2 py-1 border rounded bg-gray-50">
                      {formatEUR(rowTotal(r))}
                    </div>
                  ) : (
                    <MoneyInput
                      value={r.amount}
                      onChangeNumber={(n) => {
                        setModel((m) => {
                          const c: BudgetMonth = structuredClone(m);
                          c.expenses[i].amount = n;
                          return c;
                        });
                      }}
                      className="w-28 text-xs"
                    />
                  )}

                  <button
                    onClick={() => removeRow("expenses", i)}
                    className="text-red-500 hover:text-red-700"
                    title="Eliminar gasto"
                  >
                    <Trash color="red" size={16} />
                  </button>
                </div>

                <details className="mt-2" open={hasBreakdown}>
                  <summary className="cursor-pointer text-sm text-gray-600">
                    {hasBreakdown ? "Editar desglose" : "Añadir desglose"}
                  </summary>

                  <BreakdownEditor
                    items={r.breakdown ?? []}
                    presets={presets}
                    onChange={(next) => {
                      setModel((m) => {
                        const c: BudgetMonth = structuredClone(m);
                        c.expenses[i].breakdown = next;
                        return c;
                      });
                    }}
                  />

                  {hasBreakdown && (
                    <div className="mt-2 text-xs text-gray-500">
                      Total {r.label || "categoría"}:{" "}
                      <b>{formatEUR(rowTotal(r))}</b>
                    </div>
                  )}
                </details>
              </div>
            );
          })}
          <button
            className="text-sm underline"
            onClick={() => addRow("expenses")}
          >
            + Añadir gasto
          </button>
        </div>
      </section>

      {/* Totales */}
      <section className="md:col-span-2">
        <div className="mt-4 grid sm:grid-cols-3 gap-4">
          <Stat label="Ingresos" value={totals.income} />
          <Stat label="Gastos" value={totals.expense} />
          <Stat label="Restante" value={totals.remaining} />
        </div>

        <div className="mt-6">
          <ExpensesDonut expenses={model.expenses} />
        </div>

        {saved === "ok" && (
          <div className="mt-4 rounded-md bg-green-50 text-green-700 px-3 py-2">
            Datos guardados correctamente.
          </div>
        )}
        {saved === "error" && (
          <div className="mt-4 rounded-md bg-red-50 text-red-700 px-3 py-2">
            Error al guardar. Intenta de nuevo.
          </div>
        )}

        <button
          className="mt-6 px-4 py-2 rounded bg-primary text-white"
          onClick={save}
          disabled={saving}
        >
          {saving ? "Guardando…" : "Guardar mes"}
        </button>
      </section>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="border rounded-xl p-4 bg-primary">
      <div className="text-sm text-white">{label}</div>
      <div className="text-2xl font-bold text-white">{formatEUR(value)}</div>
    </div>
  );
}
