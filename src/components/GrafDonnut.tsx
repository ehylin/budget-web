import { useMemo } from "react";
import { ResponsiveContainer, PieChart, Pie, Tooltip, Cell } from "recharts";
import type { Row } from "../types/generics";
import type { Payload } from "recharts/types/component/DefaultTooltipContent";

const COLORS = [
  "#3b82f6",
  "#22c55e",
  "#f59e0b",
  "#ef4444",
  "#a855f7",
  "#06b6d4",
  "#e11d48",
  "#84cc16",
];

// total por categoría: usa breakdown si existe
function rowTotal(r: Row): number {
  return r.breakdown?.length
    ? r.breakdown.reduce((s, x) => s + (x.amount || 0), 0)
    : r.amount || 0;
}

type Props = {
  expenses: Row[];
  height?: number;
};

export default function ExpensesDonut({ expenses, height }: Props) {
  const total = useMemo(
    () => expenses.reduce((sum, e) => sum + rowTotal(e), 0),
    [expenses]
  );

  const data = useMemo(() => {
    return expenses
      .map((e, i) => {
        const value = rowTotal(e);
        return {
          name: e.label || "Sin nombre",
          value,
          color: COLORS[i % COLORS.length],
          percent: total ? ((value / total) * 100).toFixed(1) : "0",
        };
      })
      .filter((d) => d.value > 0);
  }, [expenses, total]);

  if (data.length === 0) {
    return (
      <div className="text-sm text-gray-500 mt-2">Sin datos de gastos aún.</div>
    );
  }

  const renderLegend = () => (
    <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
      {data.map((entry, index) => (
        <li
          key={index}
          style={{ display: "flex", alignItems: "center", marginBottom: 4 }}
        >
          <div
            style={{
              width: 12,
              height: 12,
              backgroundColor: entry.color,
              marginRight: 8,
            }}
          />
          <span>
            {entry.name} — {entry.percent}%
          </span>
        </li>
      ))}
    </ul>
  );

  const fmtEUR = (n: number) =>
    new Intl.NumberFormat("es-ES", {
      style: "currency",
      currency: "EUR",
    }).format(n);

  return (
    <div style={{ height }} className="w-full flex text-xs">
      <ResponsiveContainer width="50%" height="100%">
        <PieChart>
          <Pie
            dataKey="value"
            data={data}
            innerRadius={60}
            outerRadius={80}
            paddingAngle={2}
            labelLine={false}
          >
            {data.map((entry, i) => (
              <Cell key={i} fill={entry.color} />
            ))}
          </Pie>
          <Tooltip
            formatter={(
              value: number,
              _name: string,
              item: Payload<number, string>
            ) => [fmtEUR(Number(value)), item?.name ?? ""]}
          />
        </PieChart>
      </ResponsiveContainer>

      <div
        style={{
          width: "50%",
          paddingLeft: 20,
          display: "flex",
          alignItems: "center",
        }}
      >
        {renderLegend()}
      </div>
    </div>
  );
}
