import { useState } from "react";
import type { SubItem } from "../types/generics";

export default function BreakdownEditor({
  items,
  onChange,
  presets = [],
}: {
  items: SubItem[];
  onChange: (next: SubItem[]) => void;
  presets?: string[];
}) {
  const [local, setLocal] = useState<SubItem[]>(items ?? []);

  const commit = (next: SubItem[]) => {
    setLocal(next);
    onChange(next);
  };

  return (
    <div className="mt-2 border rounded-md p-3 bg-gray-50">
      <div className="flex flex-wrap gap-2 mb-2">
        {presets.map((p) => (
          <button
            key={p}
            type="button"
            className="text-xs border rounded px-2 py-1"
            onClick={() => commit([...local, { label: p, amount: 0 }])}
          >
            + {p}
          </button>
        ))}
      </div>

      {local.length === 0 && (
        <button
          type="button"
          className="text-sm underline"
          onClick={() => commit([{ label: "", amount: 0 }])}
        >
          + Añadir sub-ítem
        </button>
      )}

      {local.map((it, i) => (
        <div key={i} className="flex gap-2 items-center mb-2">
          <input
            className="flex-1 border rounded px-2 py-1"
            placeholder="Concepto"
            value={it.label}
            onChange={(e) => {
              const next = [...local];
              next[i] = { ...it, label: e.target.value };
              commit(next);
            }}
          />
          <input
            type="number"
            step="0.01"
            className="w-28 border rounded px-2 py-1 text-right"
            value={it.amount}
            onChange={(e) => {
              const next = [...local];
              next[i] = { ...it, amount: Number(e.target.value || 0) };
              commit(next);
            }}
          />
          <button
            type="button"
            className="text-xs text-red-600"
            onClick={() => {
              const next = [...local];
              next.splice(i, 1);
              commit(next);
            }}
          >
            Eliminar
          </button>
        </div>
      ))}

      {local.length > 0 && (
        <button
          type="button"
          className="text-sm underline"
          onClick={() => commit([...local, { label: "", amount: 0 }])}
        >
          + Añadir sub-ítem
        </button>
      )}
    </div>
  );
}
