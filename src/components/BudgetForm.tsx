import { useEffect, useMemo, useState } from "react";
import type { BudgetMonth, Row } from "../types/generics";
import ExpensesDonut from "./GrafDonnut";
import Totals from "./Totals";
import { Trash, Pencil } from "lucide-react";
import { formatEUR } from "../utils/money";
import TransactionModal from "./AddTransactionModal";
import { sanitizeBudget } from "../lib/sanitize";

/** Total real de una fila: usa breakdown si existe */
const rowTotal = (r: Row): number =>
  r.breakdown && r.breakdown.length > 0
    ? r.breakdown.reduce((s, x) => s + (x.amount || 0), 0)
    : r.amount || 0;

const EMPTY: BudgetMonth = {
  incomes: [],
  expenses: [],
  totals: { income: 0, expense: 0, remaining: 0 },
};

type EditTarget = {
  type: "income" | "expense";
  index: number;
} | null;

export function BudgetForm({
  initial,
  onSave,
}: {
  initial: BudgetMonth | null;
  onSave: (b: BudgetMonth) => Promise<void>;
}) {
  const [model, setModel] = useState<BudgetMonth>(initial ?? EMPTY);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState<null | "ok" | "error">(null);

  // crear
  const [modalType, setModalType] = useState<"income" | "expense" | null>(null);
  // editar
  const [editTarget, setEditTarget] = useState<EditTarget>(null);

  useEffect(() => {
    setModel(initial ?? EMPTY);
  }, [initial]);

  const totals = useMemo(() => {
    const income = model.incomes.reduce((s, r) => s + rowTotal(r), 0);
    const expense = model.expenses.reduce((s, r) => s + rowTotal(r), 0);
    return { income, expense, remaining: income - expense };
  }, [model]);

  const removeRow = (type: "incomes" | "expenses", idx: number) =>
    setModel((m) => {
      const copy: BudgetMonth = structuredClone(m);
      copy[type].splice(idx, 1);
      return copy;
    });

  const handleAddTransaction = (type: "income" | "expense", item: Row) => {
    setModel((m) => {
      const copy: BudgetMonth = structuredClone(m);
      const key = type === "income" ? "incomes" : "expenses";
      copy[key].push({
        label: item.label,
        amount: item.amount ?? 0,
        breakdown:
          item.breakdown && item.breakdown.length > 0
            ? item.breakdown.map((b) => ({
                label: b.label,
                amount: b.amount ?? 0,
              }))
            : undefined,
      });
      return copy;
    });
  };

  const handleEditSubmit = (row: Row) => {
    if (!editTarget) return;
    const key = editTarget.type === "income" ? "incomes" : "expenses";
    setModel((m) => {
      const copy: BudgetMonth = structuredClone(m);
      copy[key][editTarget.index] = {
        label: row.label,
        amount: row.amount ?? 0,
        breakdown:
          row.breakdown && row.breakdown.length > 0
            ? row.breakdown.map((b) => ({
                label: b.label,
                amount: b.amount ?? 0,
              }))
            : undefined,
      };
      return copy;
    });
    setEditTarget(null);
  };

  const save = async () => {
    setSaving(true);
    setSaved(null);
    try {
      await onSave(sanitizeBudget({ ...model, totals }));
      setSaved("ok");
    } catch {
      setSaved("error");
    } finally {
      setSaving(false);
      setTimeout(() => setSaved(null), 2000);
    }
  };

  // obtener la fila inicial al editar
  const getInitialForEdit = (): Row | undefined => {
    if (!editTarget) return undefined;
    const key = editTarget.type === "income" ? "incomes" : "expenses";
    const src = model[key][editTarget.index];
    if (!src) return undefined;
    return {
      label: src.label,
      amount: src.amount ?? 0,
      breakdown: src.breakdown
        ? src.breakdown.map((b) => ({ label: b.label, amount: b.amount ?? 0 }))
        : undefined,
    };
  };

  return (
    <div className="space-y-6">
      {/* Cards: Ingresos y Gastos */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* Ingresos */}
        <div className="border rounded-lg p-4 bg-white shadow">
          <h2 className="font-semibold mb-3">Ingresos</h2>

          {model.incomes.length === 0 && (
            <p className="text-sm text-gray-500">No hay ingresos aún.</p>
          )}

          {model.incomes.map((r, i) => (
            <div key={`${r.label}-${i}`} className="mb-3">
              <div className="flex justify-between items-center">
                <button
                  className="font-medium text-left"
                  onClick={() => setEditTarget({ type: "income", index: i })}
                  title="Editar ingreso"
                >
                  {r.label}
                </button>
                <div className="flex gap-2 items-center">
                  <span className="text-sm">{formatEUR(rowTotal(r))}</span>
                  <button
                    onClick={() => setEditTarget({ type: "income", index: i })}
                    className="text-gray-600 hover:text-black"
                    title="Editar"
                  >
                    <Pencil size={16} />
                  </button>
                  <button
                    onClick={() => removeRow("incomes", i)}
                    className="text-red-500 hover:text-red-700"
                    title="Eliminar ingreso"
                  >
                    <Trash size={16} />
                  </button>
                </div>
              </div>
            </div>
          ))}

          <button
            className="mt-3 px-3 py-1 border rounded w-full"
            onClick={() => setModalType("income")}
          >
            + Añadir ingreso
          </button>
        </div>

        {/* Gastos */}
        <div className="border rounded-lg p-4 bg-white shadow">
          <h2 className="font-semibold mb-3">Gastos</h2>

          {model.expenses.length === 0 && (
            <p className="text-sm text-gray-500">No hay gastos aún.</p>
          )}

          {model.expenses.map((r, i) => {
            const hasBreakdown = !!r.breakdown && r.breakdown.length > 0;
            return (
              <div key={`${r.label}-${i}`} className="mb-3">
                {/* Fila principal */}
                <div className="flex justify-between items-center">
                  <button
                    className="font-medium text-left"
                    onClick={() => setEditTarget({ type: "expense", index: i })}
                    title="Editar gasto"
                  >
                    {r.label}
                  </button>
                  <div className="flex gap-2 items-center">
                    <span className="text-sm">{formatEUR(rowTotal(r))}</span>
                    <button
                      onClick={() =>
                        setEditTarget({ type: "expense", index: i })
                      }
                      className="text-gray-600 hover:text-black"
                      title="Editar"
                    >
                      <Pencil size={16} />
                    </button>
                    <button
                      onClick={() => removeRow("expenses", i)}
                      className="text-red-500 hover:text-red-700"
                      title="Eliminar gasto"
                    >
                      <Trash size={16} />
                    </button>
                  </div>
                </div>

                {/* Subitems (breakdown) */}
                {hasBreakdown && (
                  <ul className="mt-1 pl-4 border-l border-gray-200 space-y-1">
                    {r.breakdown!.map((b, bi) => (
                      <li
                        key={`${b.label}-${bi}`}
                        className="flex justify-between text-xs text-gray-600"
                      >
                        <span className="truncate">{b.label}</span>
                        <span>{formatEUR(b.amount || 0)}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            );
          })}

          <button
            className="mt-3 px-3 py-1 border rounded w-full"
            onClick={() => setModalType("expense")}
          >
            + Añadir gasto
          </button>
        </div>
      </div>

      {/* Totales */}
      <Totals
        income={totals.income}
        expense={totals.expense}
        remaining={totals.remaining}
      />

      {/* Gráfica */}

      <ExpensesDonut expenses={model.expenses} height={200} />

      {/* Guardado */}
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

      {/* Modal crear */}
      {modalType && (
        <TransactionModal
          type={modalType}
          mode="create"
          isOpen={true}
          onClose={() => setModalType(null)}
          onSubmit={(item) => handleAddTransaction(modalType, item)}
        />
      )}

      {/* Modal editar */}
      {editTarget && (
        <TransactionModal
          type={editTarget.type}
          mode="edit"
          isOpen
          initial={getInitialForEdit()}
          onClose={() => setEditTarget(null)}
          onSubmit={handleEditSubmit}
        />
      )}
    </div>
  );
}
