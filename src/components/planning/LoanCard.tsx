import { useState } from "react";
import Modal from "../ui/Modal";
import type { Loan } from "../../types/planning";

export default function LoanModal({
  open,
  initial,
  onCancel,
  onSave,
}: {
  open: boolean;
  initial?: Loan;
  onCancel: () => void;
  onSave: (loan: Loan) => void;
}) {
  const [model, setModel] = useState<Loan>(
    initial ?? { id: "", title: "", monthly: 0, installments: 0, paidCount: 0 }
  );

  // sincroniza si cambian initial/open
  // (opcional si abres modal con datos distintos)
  if (open && initial && model.id !== initial.id) setModel(initial);

  const patch = (p: Partial<Loan>) => setModel({ ...model, ...p });

  return (
    <Modal
      isOpen={open}
      title={initial ? "Editar préstamo" : "Nuevo préstamo"}
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
            placeholder="Préstamo coche"
          />
        </label>

        <div className="grid grid-cols-2 gap-3">
          <label className="text-sm">
            Cuota (€)
            <input
              type="number"
              step="0.01"
              className="mt-1 w-full border rounded px-2 py-1 text-right"
              value={model.monthly}
              onChange={(e) => patch({ monthly: Number(e.target.value || 0) })}
            />
          </label>
          <label className="text-sm">
            Cuotas (totales)
            <input
              type="number"
              className="mt-1 w-full border rounded px-2 py-1 text-right"
              value={model.installments}
              onChange={(e) =>
                patch({
                  installments: Math.max(0, Number(e.target.value || 0)),
                })
              }
            />
          </label>
        </div>

        <label className="text-sm">
          Pagadas
          <input
            type="number"
            className="mt-1 w-full border rounded px-2 py-1 text-right"
            value={model.paidCount}
            onChange={(e) =>
              patch({
                paidCount: Math.max(
                  0,
                  Math.min(Number(e.target.value || 0), model.installments || 0)
                ),
              })
            }
          />
        </label>

        <label className="text-sm">
          Notas
          <textarea
            className="mt-1 w-full border rounded px-2 py-1"
            value={model.notes ?? ""}
            onChange={(e) => patch({ notes: e.target.value })}
            rows={3}
          />
        </label>
      </div>
    </Modal>
  );
}
