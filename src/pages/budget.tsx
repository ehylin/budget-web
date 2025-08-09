import { useState } from "react";
import { useAuthState } from "react-firebase-hooks/auth";
import { auth } from "../lib/firebase";
import { useBudget } from "../hooks/useBudget";
import { BudgetForm } from "../components/BudgetForm";
import Card from "../components/ui/Card";
import BottomNav from "../components/BottomNav";
import type { TabKey } from "../components/BottomNav";
import { doc, getDoc } from "firebase/firestore";
import type { DocumentSnapshot } from "firebase/firestore";
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
  const [tab, setTab] = useState<TabKey>("home");
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
        await save(snap.data()!);
      }
    } finally {
      setDupLoading(false);
    }
  };

  return (
    <div className="min-h-dvh bg-neutral-50 pb-20">
      <main className="mx-auto max-w-3xl p-4 grid gap-4">
        <Card className="top-0 z-10 bg-white/90 backdrop-blur">
          <div className="flex items-center gap-3">
            <label className="text-sm">Mes</label>
            <input
              type="month"
              value={ym}
              onChange={(e) => setYm(e.target.value)}
              className="border rounded px-2 py-1"
            />
            {user && (
              <button
                className="ml-auto border px-3 py-1 rounded disabled:opacity-50"
                onClick={duplicateFromPrevious}
                disabled={dupLoading}
              >
                {dupLoading ? "Duplicando…" : "Duplicar mes anterior"}
              </button>
            )}
          </div>
        </Card>

        {tab === "home" && (
          <Card>
            {!user ? (
              <p className="mt-2">
                Inicia sesión para guardar y ver tus meses.
              </p>
            ) : loading ? (
              <p className="mt-2">Cargando…</p>
            ) : (
              <BudgetForm initial={data} onSave={save} />
            )}
          </Card>
        )}

        {tab === "plan" && (
          <Card>
            <h2 className="font-semibold mb-2">Planificación</h2>
            <p className="text-sm text-gray-600">
              Aquí pondremos metas, sobres y objetivos (próximamente).
            </p>
          </Card>
        )}

        {tab === "stats" && (
          <Card>
            <h2 className="font-semibold mb-2">Estadísticas</h2>
            <p className="text-sm text-gray-600">
              Aquí moveremos/duplicaremos la gráfica y comparativas por mes/año.
            </p>
          </Card>
        )}
      </main>

      <BottomNav active={tab} onChange={setTab} />
    </div>
  );
}
