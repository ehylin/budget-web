import { useEffect, useState } from "react";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { db } from "../lib/firebase";
import type { Planning } from "../types/planning";

const EMPTY: Planning = {
  loans: [],
  goals: [],
  accounts: [],
  updatedAt: Date.now(),
};

export function usePlanning(uid?: string, ym?: string) {
  const [data, setData] = useState<Planning | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!uid || !ym) return;
    const load = async () => {
      setLoading(true);
      const ref = doc(db, "users", uid, "planning", ym);
      const snap = await getDoc(ref);
      setData(snap.exists() ? (snap.data() as Planning) : EMPTY);
      setLoading(false);
    };
    load();
  }, [uid, ym]);

  const save = async (p: Planning) => {
    if (!uid || !ym) return;
    const ref = doc(db, "users", uid, "planning", ym);
    const clean: Planning = {
      loans: p.loans.map((l) => ({
        ...l,
        monthly: l.monthly ?? 0,
        installments: l.installments ?? 0,
        paidCount: l.paidCount ?? 0,
      })),
      goals: p.goals.map((g) => ({
        ...g,
        target: g.target ?? 0,
        contributions: (g.contributions ?? []).map((c) => ({
          month: c.month,
          amount: c.amount ?? 0,
        })),
      })),
      accounts: p.accounts.map((a) => ({ ...a, balance: a.balance ?? 0 })),
      updatedAt: Date.now(),
    };
    await setDoc(ref, clean, { merge: false });
    setData(clean);
  };

  return { data, save, loading };
}
