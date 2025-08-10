import { formatEUR } from "../utils/money";

type TotalsProps = {
  income: number;
  expense: number;
  remaining: number;
};

export default function Totals({ income, expense, remaining }: TotalsProps) {
  return (
    <div className="grid sm:grid-cols-3 gap-4">
      <Stat label="Ingresos" value={income} />
      <Stat label="Gastos" value={expense} />
      <Stat label="Restante" value={remaining} />
    </div>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="border rounded-xl p-4 bg-primary">
      <div className="text-sm text-white">{label}</div>
      <div className="text-2xl font-bold text-white">{formatEUR(value)}</div>
    </div>
  );
}
