import { useEffect, useState } from "react";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { db } from "../lib/firebase";
import type { FinanceMonth } from "../types/finance";

export function useFinanceMonth(uid: string | undefined, ym: string) {
  const [data, setData] = useState<FinanceMonth | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setData(null);
    if (!uid) {
      setLoading(false);
      return;
    }
    setLoading(true);
    const ref = doc(db, "users", uid, "budgets", ym);
    getDoc(ref).then((snap) => {
      setData(snap.exists() ? (snap.data() as FinanceMonth) : null);
      setLoading(false);
    });
  }, [uid, ym]);

  const save = async (payload: FinanceMonth) => {
    if (!uid) return;
    const ref = doc(db, "users", uid, "budgets", ym);
    await setDoc(ref, { ...payload, createdAt: Date.now() }, { merge: true });
    setData(payload);
  };

  return { data, save, loading };
}
