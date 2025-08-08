import { useState } from "react";
import { useAuthState } from "react-firebase-hooks/auth";
import { auth } from "../lib/firebase";
import { useBudget } from "../hooks/useBudget";
import "firebase/compat/auth";
import { BudgetForm } from "../components/BudgetForm";
import { doc, DocumentSnapshot, getDoc } from "firebase/firestore";
import { db } from "../lib/firebase";
import type { BudgetMonth } from "../types/generics";

function prevYm(ym: string) {
  const [y, m] = ym.split("-").map(Number);
  const d = new Date(y, m - 1, 1);
  d.setMonth(d.getMonth() - 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

export default function BudgetPage() {
  const [user] = useAuthState(auth);
  const [ym, setYm] = useState(new Date().toISOString().slice(0, 7));
  const { data, save, loading } = useBudget(user?.uid, ym);
  const [dupLoading, setDupLoading] = useState(false);

  const duplicateFromPrevious = async () => {
    if (!user) return;
    setDupLoading(true);
    try {
      const p = prevYm(ym);
      const ref = doc(db, "users", user.uid, "budgets", p);
      const snap = (await getDoc(ref)) as DocumentSnapshot<BudgetMonth>;
      if (!snap.exists()) {
        alert(`No hay datos en ${p}`);
      } else {
        await save(snap.data());
      }
    } finally {
      setDupLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-5xl p-6">
      <div className="mt-4 flex gap-3 items-center">
        <label className="text-sm">Mes</label>
        <input
          type="month"
          value={ym}
          onChange={(e) => setYm(e.target.value)}
          className="border rounded px-2 py-1"
        />
      </div>

      {user && (
        <div className="mt-3">
          <button
            className="border px-3 py-1 rounded disabled:opacity-50"
            onClick={duplicateFromPrevious}
            disabled={dupLoading}
          >
            {dupLoading ? "Duplicando…" : "Duplicar mes anterior"}
          </button>
        </div>
      )}

      {!user ? (
        <p className="mt-8">Inicia sesión para guardar y ver tus meses.</p>
      ) : loading ? (
        <p className="mt-8">Cargando…</p>
      ) : (
        <BudgetForm initial={data} onSave={save} />
      )}
    </div>
  );
}
