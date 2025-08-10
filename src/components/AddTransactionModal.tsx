import { useEffect, useState } from "react";
import MoneyInput from "./MoneyInput";
import BreakdownEditor from "./BreakdownEditor";
import type { Row } from "../types/generics";

type Mode = "create" | "edit";

type TransactionModalProps = {
  type: "income" | "expense";
  mode: Mode;
  isOpen: boolean;
  initial?: Row; // cuando mode = "edit"
  onClose: () => void;
  onSubmit: (row: Row) => void; // devuelve la fila final
};

export default function TransactionModal({
  type,
  mode,
  isOpen,
  initial,
  onClose,
  onSubmit,
}: TransactionModalProps) {
  const [label, setLabel] = useState("");
  const [amount, setAmount] = useState(0);
  const [breakdown, setBreakdown] = useState<Row["breakdown"]>([]);

  useEffect(() => {
    if (!isOpen) return;
    if (mode === "edit" && initial) {
      setLabel(initial.label);
      setAmount(initial.amount ?? 0);
      setBreakdown(
        initial.breakdown?.map((b) => ({
          label: b.label,
          amount: b.amount ?? 0,
        })) ?? []
      );
    } else {
      setLabel("");
      setAmount(0);
      setBreakdown([]);
    }
  }, [isOpen, mode, initial]);

  if (!isOpen) return null;

  const title =
    mode === "edit"
      ? `Editar ${type === "income" ? "ingreso" : "gasto"}`
      : `Añadir ${type === "income" ? "ingreso" : "gasto"}`;

  const handleSave = () => {
    if (!label.trim()) return;
    const row: Row = {
      label: label.trim(),
      amount: amount ?? 0,
      breakdown: breakdown && breakdown.length > 0 ? breakdown : undefined,
    };
    onSubmit(row);
    onClose();
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black/40 z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md">
        <h2 className="text-lg font-semibold mb-4">{title}</h2>

        <label className="text-xs text-gray-600">Nombre</label>
        <input
          value={label}
          onChange={(e) => setLabel(e.target.value)}
          placeholder="Ej. Vivienda"
          className="border rounded px-2 py-1 w-full mb-3"
        />

        <label className="text-xs text-gray-600">Monto</label>
        <MoneyInput
          value={amount}
          onChangeNumber={setAmount}
          className="w-full mb-3"
        />

        {/* Editor de breakdown (especialmente útil en gastos) */}
        <div className="mt-2">
          <div className="text-xs text-gray-600 mb-1">Desglose (opcional)</div>
          <BreakdownEditor
            items={breakdown ?? []}
            presets={[]}
            onChange={setBreakdown}
          />
        </div>

        <div className="mt-4 flex justify-end gap-2">
          <button className="px-3 py-1 border rounded" onClick={onClose}>
            Cancelar
          </button>
          <button
            className="px-3 py-1 bg-green-600 text-white rounded"
            onClick={handleSave}
          >
            Guardar
          </button>
        </div>
      </div>
    </div>
  );
}
