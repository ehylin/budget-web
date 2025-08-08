import { useEffect, useState } from "react";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { db } from "../lib/firebase";
import type { BudgetMonth } from "../types/generics";

export function useBudget(uid: string | undefined, ym: string) {
  const [data, setData] = useState<BudgetMonth | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // cuando cambia uid o mes, empieza en loading y limpia data
    setData(null);
    if (!uid) {
      setLoading(false);
      return;
    }

    setLoading(true);
    const ref = doc(db, "users", uid, "budgets", ym);
    getDoc(ref).then((snap) => {
      setData(snap.exists() ? (snap.data() as BudgetMonth) : null);
      setLoading(false);
    });
  }, [uid, ym]);

  const save = async (payload: BudgetMonth) => {
    if (!uid) return;
    const ref = doc(db, "users", uid, "budgets", ym);
    await setDoc(ref, { ...payload, createdAt: Date.now() }, { merge: true });
    setData(payload);
  };

  return { data, save, loading };
}
