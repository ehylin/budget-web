import { nanoid } from "nanoid";
import { useState } from "react";
import Card from "../components/ui/Card";
import { useAuthState } from "react-firebase-hooks/auth";
import { auth } from "../lib/firebase";
import { usePlanning } from "../hooks/usePlanning";
import type { Planning, Loan, Goal, Account } from "../types/planning";
import LoanModal from "../components/planning/LoanCard";
import GoalModal from "../components/planning/GoalCard";
import AccountModal from "../components/planning/AccountsCard";

export default function PlanningPage() {
  const [user] = useAuthState(auth);
  const [ym] = useState(new Date().toISOString().slice(0, 7));
  const { data, save, loading } = usePlanning(user?.uid, ym);

  const [loanOpen, setLoanOpen] = useState(false);
  const [loanEditing, setLoanEditing] = useState<Loan | undefined>(undefined);

  const [goalOpen, setGoalOpen] = useState(false);
  const [goalEditing, setGoalEditing] = useState<Goal | undefined>(undefined);

  const [accOpen, setAccOpen] = useState(false);
  const [accEditing, setAccEditing] = useState<Account | undefined>(undefined);

  if (!user) return <Card>Inicia sesión para planificar.</Card>;
  if (loading || !data) return <Card>Cargando…</Card>;

  const setPlanning = (updater: (p: Planning) => Planning) =>
    save(updater(data));

  // open modals
  const openNewLoan = () => {
    setLoanEditing(undefined);
    setLoanOpen(true);
  };
  const openEditLoan = (l: Loan) => {
    setLoanEditing(l);
    setLoanOpen(true);
  };

  const openNewGoal = () => {
    setGoalEditing(undefined);
    setGoalOpen(true);
  };
  const openEditGoal = (g: Goal) => {
    setGoalEditing(g);
    setGoalOpen(true);
  };

  const openNewAcc = () => {
    setAccEditing(undefined);
    setAccOpen(true);
  };
  const openEditAcc = (a: Account) => {
    setAccEditing(a);
    setAccOpen(true);
  };

  // save handlers
  const saveLoan = (loan: Loan) =>
    setPlanning((p) => {
      const next = { ...loan, id: loan.id || nanoid() };
      const exists = p.loans.some((x) => x.id === next.id);
      return {
        ...p,
        loans: exists
          ? p.loans.map((x) => (x.id === next.id ? next : x))
          : [...p.loans, next],
      };
    });

  const saveGoal = (goal: Goal) =>
    setPlanning((p) => {
      const next = {
        ...goal,
        id: goal.id || nanoid(),
        contributions: goal.contributions ?? [],
      };
      const exists = p.goals.some((x) => x.id === next.id);
      return {
        ...p,
        goals: exists
          ? p.goals.map((x) => (x.id === next.id ? next : x))
          : [...p.goals, next],
      };
    });

  const saveAcc = (acc: Account) =>
    setPlanning((p) => {
      const next = { ...acc, id: acc.id || nanoid() };
      const exists = p.accounts.some((x) => x.id === next.id);
      return {
        ...p,
        accounts: exists
          ? p.accounts.map((x) => (x.id === next.id ? next : x))
          : [...p.accounts, next],
      };
    });

  // delete
  const deleteLoan = (id: string) =>
    setPlanning((p) => ({ ...p, loans: p.loans.filter((x) => x.id !== id) }));
  const deleteGoal = (id: string) =>
    setPlanning((p) => ({ ...p, goals: p.goals.filter((x) => x.id !== id) }));
  const deleteAcc = (id: string) =>
    setPlanning((p) => ({
      ...p,
      accounts: p.accounts.filter((x) => x.id !== id),
    }));

  return (
    <div className="grid gap-6">
      {/* PRÉSTAMOS */}
      <Card>
        <div className="flex justify-between items-center mb-3">
          <h2 className="font-semibold">Préstamos</h2>
          <button
            className="px-3 py-1 border rounded text-sm"
            onClick={openNewLoan}
          >
            Añadir préstamo
          </button>
        </div>
        <div className="grid gap-3">
          {data.loans.map((l) => (
            <div
              key={l.id}
              className="border rounded-lg p-4 bg-white shadow-sm"
            >
              <div className="flex justify-between items-center">
                <div className="font-semibold">{l.title || "Préstamo"}</div>
                <div className="flex gap-2">
                  <button
                    className="px-2 py-1 border rounded text-sm"
                    onClick={() => openEditLoan(l)}
                  >
                    Editar
                  </button>
                  <button
                    className="px-2 py-1 border rounded text-sm text-red-600"
                    onClick={() => deleteLoan(l.id)}
                  >
                    Eliminar
                  </button>
                </div>
              </div>
              <div className="mt-2 text-sm text-gray-600">
                Cuota {l.monthly} · Cuotas {l.installments} · Pagadas{" "}
                {l.paidCount}
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* OBJETIVOS */}
      <Card>
        <div className="flex justify-between items-center mb-3">
          <h2 className="font-semibold">Objetivos / Ahorros</h2>
          <button
            className="px-3 py-1 border rounded text-sm"
            onClick={openNewGoal}
          >
            Añadir objetivo
          </button>
        </div>
        <div className="grid gap-3">
          {data.goals.map((g) => (
            <div
              key={g.id}
              className="border rounded-lg p-4 bg-white shadow-sm"
            >
              <div className="flex justify-between items-center">
                <div className="font-semibold">{g.title || "Objetivo"}</div>
                <div className="flex gap-2">
                  <button
                    className="px-2 py-1 border rounded text-sm"
                    onClick={() => openEditGoal(g)}
                  >
                    Editar
                  </button>
                  <button
                    className="px-2 py-1 border rounded text-sm text-red-600"
                    onClick={() => deleteGoal(g.id)}
                  >
                    Eliminar
                  </button>
                </div>
              </div>
              <div className="mt-2 text-sm text-gray-600">
                Objetivo {g.target} · Plan mensual {g.monthlyPlan ?? 0}
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* CUENTAS */}
      <Card>
        <div className="flex justify-between items-center mb-3">
          <h2 className="font-semibold">Efectivo & Cuentas</h2>
          <button
            className="px-3 py-1 border rounded text-sm"
            onClick={openNewAcc}
          >
            Añadir cuenta
          </button>
        </div>
        <div className="grid gap-3">
          {data.accounts.map((a) => (
            <div
              key={a.id}
              className="border rounded-lg p-4 bg-white shadow-sm"
            >
              <div className="flex justify-between items-center">
                <div className="font-semibold">{a.bank || "Cuenta"}</div>
                <div className="flex gap-2">
                  <button
                    className="px-2 py-1 border rounded text-sm"
                    onClick={() => openEditAcc(a)}
                  >
                    Editar
                  </button>
                  <button
                    className="px-2 py-1 border rounded text-sm text-red-600"
                    onClick={() => deleteAcc(a.id)}
                  >
                    Eliminar
                  </button>
                </div>
              </div>
              <div className="mt-2 text-sm text-gray-600">
                Saldo {a.balance}
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* MODALES */}
      <LoanModal
        open={loanOpen}
        initial={loanEditing}
        onCancel={() => setLoanOpen(false)}
        onSave={(loan) => {
          saveLoan(loan);
          setLoanOpen(false);
        }}
      />
      <GoalModal
        open={goalOpen}
        initial={goalEditing}
        onCancel={() => setGoalOpen(false)}
        onSave={(goal) => {
          saveGoal(goal);
          setGoalOpen(false);
        }}
      />
      <AccountModal
        open={accOpen}
        initial={accEditing}
        onCancel={() => setAccOpen(false)}
        onSave={(acc) => {
          saveAcc(acc);
          setAccOpen(false);
        }}
      />
    </div>
  );
}
