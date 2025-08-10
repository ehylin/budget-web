import { useState } from "react";
import Modal from "../ui/Modal";
import type { Goal } from "../../types/planning";

export default function GoalModal({
  open,
  initial,
  onCancel,
  onSave,
}: {
  open: boolean;
  initial?: Goal;
  onCancel: () => void;
  onSave: (goal: Goal) => void;
}) {
  const [model, setModel] = useState<Goal>(
    initial ?? {
      id: "",
      title: "",
      target: 0,
      monthlyPlan: 0,
      contributions: [],
    }
  );
  if (open && initial && model.id !== initial.id) setModel(initial);

  const patch = (p: Partial<Goal>) => setModel({ ...model, ...p });

  return (
    <Modal
      isOpen={open}
      title={initial ? "Editar objetivo" : "Nuevo objetivo"}
      onClose={onCancel}
      footer={
        <div className="flex justify-end gap-2">
          <button onClick={onCancel} className="px-3 py-1 rounded border">
            Cancelar
          </button>
          <button
            onClick={() => onSave(model)}
            className="px-3 py-1 rounded bg-black text-white"
          >
            Guardar
          </button>
        </div>
      }
    >
      <div className="grid gap-3">
        <label className="text-sm">
          Título
          <input
            className="mt-1 w-full border rounded px-2 py-1"
            value={model.title}
            onChange={(e) => patch({ title: e.target.value })}
            placeholder="Viaje a Ibiza"
          />
        </label>

        <div className="grid grid-cols-2 gap-3">
          <label className="text-sm">
            Objetivo (€)
            <input
              type="number"
              step="0.01"
              className="mt-1 w-full border rounded px-2 py-1 text-right"
              value={model.target}
              onChange={(e) => patch({ target: Number(e.target.value || 0) })}
            />
          </label>
          <label className="text-sm">
            Plan mensual (€)
            <input
              type="number"
              step="0.01"
              className="mt-1 w-full border rounded px-2 py-1 text-right"
              value={model.monthlyPlan ?? 0}
              onChange={(e) =>
                patch({ monthlyPlan: Number(e.target.value || 0) })
              }
            />
          </label>
        </div>
      </div>
    </Modal>
  );
}
