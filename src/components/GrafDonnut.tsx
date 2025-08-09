import { useMemo } from "react";
import { ResponsiveContainer, PieChart, Pie, Tooltip, Cell } from "recharts";
import type { Row } from "../types/generics";

const COLORS = ["#00C49F", "#FF8042", "#FF6384", "#8884D8", "#36A2EB"];

type Props = {
  expenses: Row[];
  height?: number;
};

export default function ExpensesDonut({ expenses, height = 260 }: Props) {
  const total = expenses.reduce((sum, e) => sum + (e.amount ?? 0), 0);

  const data = useMemo(
    () =>
      expenses
        .filter((e) => (e.amount ?? 0) > 0)
        .map((e, i) => ({
          name: e.label || "Sin nombre",
          value: e.amount,
          color: COLORS[i % COLORS.length],
          percent: total ? ((e.amount / total) * 100).toFixed(1) : "0",
        })),
    [expenses, total]
  );

  if (data.length === 0) {
    return (
      <div className="text-sm text-gray-500 mt-2">Sin datos de gastos aún.</div>
    );
  }

  // Leyenda personalizada
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

  return (
    <div style={{ height }} className="w-full flex text-xs">
      <ResponsiveContainer width="50%" height="100%">
        <PieChart>
          <Pie
            dataKey="value"
            data={data}
            innerRadius={60}
            outerRadius={90}
            paddingAngle={2}
            labelLine={false}
          >
            {data.map((entry, i) => (
              <Cell key={i} fill={entry.color} />
            ))}
          </Pie>
          <Tooltip />
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
