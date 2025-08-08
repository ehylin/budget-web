import { useState } from "react";
import { useAuthState } from "react-firebase-hooks/auth";
import { auth } from "../lib/firebase";
import { useBudget } from "../hooks/useBudget";
import "firebase/compat/auth";
import { BudgetForm } from "../components/BudgetForm";

export default function BudgetPage() {
  const [user] = useAuthState(auth);
  const [ym, setYm] = useState(new Date().toISOString().slice(0, 7));
  const { data, save, loading } = useBudget(user?.uid, ym);

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
