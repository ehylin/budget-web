import { useEffect, useMemo, useState } from "react";
import type { BudgetMonth } from "../types/generics";
import ExpensesDonut from "./GrafDonnut";

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
  ],
  totals: { income: 0, expense: 0, remaining: 0 },
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
    setModel(initial ?? empty);
  }, [initial]);

  const totals = useMemo(() => {
    const income = model.incomes.reduce((s, r) => s + (r.amount || 0), 0);
    const expense = model.expenses.reduce((s, r) => s + (r.amount || 0), 0);
    return { income, expense, remaining: income - expense };
  }, [model]);

  const setAmount = (type: "incomes" | "expenses", idx: number, v: number) => {
    setModel((m) => {
      const copy = structuredClone(m) as BudgetMonth;
      copy[type][idx].amount = v || 0;
      copy.totals = totals; // opcional, o recalc al guardar
      return copy;
    });
  };

  const addRow = (type: "incomes" | "expenses") =>
    setModel((m) => ({ ...m, [type]: [...m[type], { label: "", amount: 0 }] }));

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
      setTimeout(() => setSaved(null), 2000); // ocultar banner
    }
  };

  return (
    <div className="mt-8 grid md:grid-cols-2 gap-8">
      <section>
        <h2 className="font-semibold mb-2">Entrada de dinero</h2>
        <div className="space-y-2">
          {model.incomes.map((r, i) => (
            <div key={i} className="flex gap-2">
              <input
                value={r.label}
                onChange={(e) => {
                  const v = e.target.value;
                  setModel((m) => {
                    const c = structuredClone(m);
                    c.incomes[i].label = v;
                    return c;
                  });
                }}
                className="flex-1 border rounded px-2 py-1"
                placeholder="Concepto"
              />
              <input
                type="number"
                step="0.01"
                value={r.amount}
                onChange={(e) =>
                  setAmount("incomes", i, Number(e.target.value))
                }
                className="w-32 border rounded px-2 py-1 text-right"
              />
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

      <section>
        <h2 className="font-semibold mb-2">Salida de dinero</h2>
        <div className="space-y-2">
          {model.expenses.map((r, i) => (
            <div key={i} className="flex gap-2">
              <input
                value={r.label}
                onChange={(e) => {
                  const v = e.target.value;
                  setModel((m) => {
                    const c = structuredClone(m);
                    c.expenses[i].label = v;
                    return c;
                  });
                }}
                className="flex-1 border rounded px-2 py-1"
                placeholder="Categoría"
              />
              <input
                type="number"
                step="0.01"
                value={r.amount}
                onChange={(e) =>
                  setAmount("expenses", i, Number(e.target.value))
                }
                className="w-32 border rounded px-2 py-1 text-right"
              />
            </div>
          ))}
          <button
            className="text-sm underline"
            onClick={() => addRow("expenses")}
          >
            + Añadir gasto
          </button>
        </div>
      </section>

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
          className="mt-6 px-4 py-2 rounded bg-black text-white"
          onClick={save}
        >
          {saving ? "Guardando…" : "Guardar mes"}
        </button>
      </section>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="border rounded p-4">
      <div className="text-sm text-gray-500">{label}</div>
      <div className="text-2xl font-bold">{value.toFixed(2)} €</div>
    </div>
  );
}
