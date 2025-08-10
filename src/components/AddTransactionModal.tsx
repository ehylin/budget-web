import { useEffect, useState } from "react";
import type { Row } from "../types/generics";
import Modal from "./ui/Modal";
import MoneyInput from "./MoneyInput";
import BreakdownEditor from "./BreakdownEditor";

type Props = {
  type: "income" | "expense";
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (row: Row) => void; // ← nombre correcto
  initial?: Row; // si existe => modo edición
};

const EMPTY: Row = { label: "", amount: 0, breakdown: [] };

export default function TransactionModal({
  type,
  isOpen,
  onClose,
  onSubmit,
  initial,
}: Props) {
  const isEdit = !!initial;
  const [model, setModel] = useState<Row>(initial ?? EMPTY);

  useEffect(() => {
    if (!isOpen) return;
    setModel(
      initial
        ? {
            ...initial,
            breakdown: initial.breakdown ? [...initial.breakdown] : [],
          }
        : { ...EMPTY }
    );
  }, [isOpen, initial]);

  const hasBreakdown = (model.breakdown?.length ?? 0) > 0;

  const handleSave = () => {
    const payload: Row = {
      label: model.label.trim(),
      amount: hasBreakdown ? 0 : Number(model.amount || 0),
      breakdown: hasBreakdown ? model.breakdown : [],
    };
    onSubmit(payload); // ← usar onSubmit
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      title={`${isEdit ? "Editar" : "Añadir"} ${
        type === "income" ? "ingreso" : "gasto"
      }`}
      onClose={onClose}
      footer={
        <div className="flex justify-end gap-2">
          <button className="px-3 py-1 border rounded" onClick={onClose}>
            Cancelar
          </button>
          <button
            className="px-3 py-1 rounded bg-green-600 text-white"
            onClick={handleSave}
          >
            Guardar
          </button>
        </div>
      }
    >
      <div className="grid gap-3">
        <label className="text-sm">
          Nombre
          <input
            className="mt-1 w-full border rounded px-2 py-1"
            value={model.label}
            onChange={(e) => setModel({ ...model, label: e.target.value })}
            placeholder={type === "income" ? "Nómina…" : "Vivienda…"}
          />
        </label>

        <label className="text-sm">
          Monto
          <div className="mt-1">
            <MoneyInput
              value={model.amount}
              onChangeNumber={(n) => setModel({ ...model, amount: n })}
              disabled={hasBreakdown}
            />
          </div>
        </label>

        <div className="text-sm text-gray-600">Desglose (opcional)</div>
        <BreakdownEditor
          items={model.breakdown ?? []}
          onChange={(next) => setModel({ ...model, breakdown: next })}
          presets={[]}
        />
      </div>
    </Modal>
  );
}
