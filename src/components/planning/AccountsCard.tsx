import { useState } from "react";
import Modal from "../ui/Modal";
import type { Account } from "../../types/planning";

export default function AccountModal({
  open,
  initial,
  onCancel,
  onSave,
}: {
  open: boolean;
  initial?: Account;
  onCancel: () => void;
  onSave: (account: Account) => void;
}) {
  const [model, setModel] = useState<Account>(
    initial ?? { id: "", bank: "", balance: 0 }
  );
  if (open && initial && model.id !== initial.id) setModel(initial);

  const patch = (p: Partial<Account>) => setModel({ ...model, ...p });

  return (
    <Modal
      isOpen={open}
      title={initial ? "Editar cuenta" : "Nueva cuenta / Efectivo"}
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
          Banco / Efectivo
          <input
            className="mt-1 w-full border rounded px-2 py-1"
            value={model.bank}
            onChange={(e) => patch({ bank: e.target.value })}
            placeholder="ING, BBVA, Efectivo…"
          />
        </label>

        <label className="text-sm">
          Saldo (€)
          <input
            type="number"
            step="0.01"
            className="mt-1 w-full border rounded px-2 py-1 text-right"
            value={model.balance}
            onChange={(e) => patch({ balance: Number(e.target.value || 0) })}
          />
        </label>
      </div>
    </Modal>
  );
}
