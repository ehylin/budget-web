import type { Loan } from "../../types/planning";
import { formatEUR } from "../../utils/money";

export default function LoanSummary({ loan }: { loan: Loan }) {
  const monthly = loan.monthly || 0;
  const installments = loan.installments || 0;
  const paidCount = Math.min(loan.paidCount || 0, installments);

  const totalToPay = installments * monthly; // total del préstamo
  const paidMoney = paidCount * monthly; // ya pagado en €
  const remainingInstallments = Math.max(installments - paidCount, 0);
  const remainingMoney = Math.max(totalToPay - paidMoney, 0);
  const progress = totalToPay ? Math.round((paidMoney / totalToPay) * 100) : 0;

  return (
    <div className="mt-2 text-sm text-gray-700">
      {/* Primera línea: cuotas */}
      <div className="mb-1">
        Cuota {formatEUR(monthly)} · Cuotas {installments} · Pagadas {paidCount}{" "}
        · <b>Restantes {remainingInstallments}</b>
      </div>

      {/* Barra de progreso */}
      <div className="h-2 bg-gray-200 rounded">
        <div
          className="h-2 bg-green-500 rounded"
          style={{ width: `${Math.min(100, progress)}%` }}
        />
      </div>

      {/* Dinero: pagado, restante y total */}
      <div className="mt-1 text-xs text-gray-600">
        Pagado {formatEUR(paidMoney)} ·{" "}
        <b>Restante {formatEUR(remainingMoney)}</b> · Total{" "}
        {formatEUR(totalToPay)} ({progress}%)
      </div>
    </div>
  );
}
