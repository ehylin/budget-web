import { useState, useMemo, useEffect } from "react";
import { useAuthState } from "react-firebase-hooks/auth";
import { GoogleAuthProvider, signInWithPopup } from "firebase/auth";
import { auth } from "../lib/firebase";
import { useFinanceMonth } from "../hooks/useFinanceMonth";
import type { Source, FinanceExpense, FinanceMonth } from "../types/finance";
import { usePlanning } from "../hooks/usePlanning";
import type { Planning, Loan, Goal, Account } from "../types/planning";
import { nanoid } from "nanoid";
import LoanModal from "../components/planning/LoanCard";
import GoalModal from "../components/planning/GoalCard";
import AccountModal from "../components/planning/AccountsCard";
import LoanSummary from "../components/planning/LoanSummary";

// ─── UTILS ────────────────────────────────────────────────────────────────────
const fmt = (n: number) =>
  new Intl.NumberFormat("es-ES", {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: 0,
  }).format(n);

const MONTHS = ["Ene","Feb","Mar","Abr","May","Jun","Jul","Ago","Sep","Oct","Nov","Dic"];
const FULL_MONTHS = ["Enero","Febrero","Marzo","Abril","Mayo","Junio","Julio","Agosto","Septiembre","Octubre","Noviembre","Diciembre"];

const SOURCE_PALETTES = [
  { accent: "#34d399", bg: "rgba(52,211,153,0.08)",  border: "rgba(52,211,153,0.2)"  },
  { accent: "#60a5fa", bg: "rgba(96,165,250,0.08)",  border: "rgba(96,165,250,0.2)"  },
  { accent: "#c084fc", bg: "rgba(192,132,252,0.08)", border: "rgba(192,132,252,0.2)" },
  { accent: "#fb923c", bg: "rgba(251,146,60,0.08)",  border: "rgba(251,146,60,0.2)"  },
  { accent: "#f472b6", bg: "rgba(244,114,182,0.08)", border: "rgba(244,114,182,0.2)" },
];

const EXP_COLORS = ["#f87171","#fb923c","#facc15","#e879f9","#38bdf8","#a3e635","#f97316"];
const makeId = () => String(Date.now() + Math.floor(Math.random() * 9999));

function ymToLabel(ym: string): string {
  const [y, m] = ym.split("-").map(Number);
  return `${FULL_MONTHS[m - 1]} ${y}`;
}
function prevYm(ym: string): string {
  const [y, m] = ym.split("-").map(Number);
  const d = new Date(y, m - 1, 1);
  d.setMonth(d.getMonth() - 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}
function nextYm(ym: string): string {
  const [y, m] = ym.split("-").map(Number);
  const d = new Date(y, m - 1, 1);
  d.setMonth(d.getMonth() + 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

// ─── ICONS ────────────────────────────────────────────────────────────────────
type IconProps = { d: string; size?: number; className?: string };
const Icon = ({ d, size = 18, className = "" }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor"
    strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d={d} />
  </svg>
);
const I = {
  plus:    "M12 5v14M5 12h14",
  trash:   "M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6",
  edit:    "M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z",
  check:   "M20 6L9 17l-5-5",
  wallet:  "M20 12V8H6a2 2 0 0 1-2-2c0-1.1.9-2 2-2h12v4M20 12v4H6a2 2 0 0 1-2-2v-2",
  chart:   "M18 20V10M12 20V4M6 20v-6",
  target:  "M12 22c5.52 0 10-4.48 10-10S17.52 2 12 2 2 6.48 2 12s4.48 10 10 10zM12 18a6 6 0 1 0 0-12 6 6 0 0 0 0 12zM12 14a2 2 0 1 0 0-4 2 2 0 0 0 0 4z",
  warning: "M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0zM12 9v4M12 17h.01",
  spark:   "M13 2L3 14h9l-1 8 10-12h-9l1-8z",
  chevL:   "M15 18l-6-6 6-6",
  chevR:   "M9 18l6-6-6-6",
  user:    "M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2M12 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8z",
  logout:  "M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9",
  save:    "M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2zM17 21v-8H7v8M7 3v5h8",
};

// ─── PRIMITIVES ───────────────────────────────────────────────────────────────
type BarProps = { value: number; max: number; color: string; h?: string };
const Bar = ({ value, max, color, h = "h-1.5" }: BarProps) => (
  <div className={`${h} w-full bg-zinc-800 rounded-full overflow-hidden`}>
    <div className="h-full rounded-full transition-all duration-500"
      style={{ width: `${Math.min((value / (max || 1)) * 100, 100)}%`, backgroundColor: color }} />
  </div>
);

type CardProps = { children: React.ReactNode; className?: string; style?: React.CSSProperties };
const Card = ({ children, className = "", style = {} }: CardProps) => (
  <div className={`rounded-2xl border border-zinc-800 bg-zinc-900/70 p-4 ${className}`} style={style}>
    {children}
  </div>
);

// ─── DONUT ────────────────────────────────────────────────────────────────────
type DonutItem = { id: string; label: string; amount: number };
type DonutProps = { items: DonutItem[]; colors: string[]; size?: number; center?: string };
const Donut = ({ items, colors, size = 80, center }: DonutProps) => {
  const total = items.reduce((s, i) => s + i.amount, 0);
  const r = 36, cx = 50, cy = 50, circ = 2 * Math.PI * r;
  if (!total) return (
    <div className="rounded-full border-4 border-zinc-800 flex items-center justify-center"
      style={{ width: size, height: size }}>
      <span className="text-zinc-700 text-xs">—</span>
    </div>
  );
  let off = 0;
  const slices = items.map((item, i) => {
    const dash = (item.amount / total) * circ;
    const s = { dash, off, color: colors[i % colors.length] };
    off += dash;
    return s;
  });
  return (
    <div className="relative flex-shrink-0" style={{ width: size, height: size }}>
      <svg width={size} height={size} viewBox="0 0 100 100">
        <circle cx={cx} cy={cy} r={r} fill="none" stroke="#18181b" strokeWidth="14" />
        {slices.map((s, i) => (
          <circle key={i} cx={cx} cy={cy} r={r} fill="none" stroke={s.color} strokeWidth="14"
            strokeDasharray={`${s.dash} ${circ - s.dash}`}
            strokeDashoffset={circ / 4 - s.off}
            style={{ transition: "all 0.4s ease" }} />
        ))}
      </svg>
      {center && (
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
          <span className="text-white font-bold text-xs">{center}</span>
        </div>
      )}
    </div>
  );
};

// ─── PROJECTION CHART ─────────────────────────────────────────────────────────
type ProjPoint = { month: string; monthIdx: number; val: number };
type ProjChartProps = { data: ProjPoint[]; target: number };
const ProjChart = ({ data, target }: ProjChartProps) => {
  const max = Math.max(target * 1.15, ...data.map(d => d.val), 1);
  const W = 300, H = 130, pad = { t: 12, r: 18, b: 28, l: 38 };
  const iw = W - pad.l - pad.r, ih = H - pad.t - pad.b;
  const pts = data.map((d, i) => ({
    x: pad.l + (i / Math.max(data.length - 1, 1)) * iw,
    y: pad.t + ih - (d.val / max) * ih,
    ...d,
  }));
  const line = pts.map((p, i) => `${i === 0 ? "M" : "L"}${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(" ");
  const area = `${line} L${pts[pts.length - 1].x} ${pad.t + ih} L${pts[0].x} ${pad.t + ih}Z`;
  const ty = (pad.t + ih - (target / max) * ih).toFixed(1);
  return (
    <svg width="100%" viewBox={`0 0 ${W} ${H}`} className="overflow-visible">
      <defs>
        <linearGradient id="gr" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#34d399" stopOpacity=".3" />
          <stop offset="100%" stopColor="#34d399" stopOpacity="0" />
        </linearGradient>
      </defs>
      <line x1={pad.l} y1={ty} x2={pad.l + iw} y2={ty} stroke="#facc15" strokeWidth="1" strokeDasharray="4 3" opacity=".5" />
      <text x={pad.l + iw + 2} y={Number(ty) + 3} fill="#facc15" fontSize="7" opacity=".7">meta</text>
      <path d={area} fill="url(#gr)" />
      <path d={line} fill="none" stroke="#34d399" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      {pts.map((p, i) => (
        <circle key={i} cx={p.x} cy={p.y} r="3.5"
          fill={p.val >= target ? "#facc15" : "#34d399"} stroke="#09090b" strokeWidth="1.5" />
      ))}
      {pts.map((p, i) => (
        <text key={i} x={p.x} y={H - 6} textAnchor="middle" fill="#52525b" fontSize="7.5">{p.month}</text>
      ))}
      {[0, 0.5, 1].map((t, i) => (
        <text key={i} x={pad.l - 4} y={pad.t + ih - t * ih + 3} textAnchor="end" fill="#3f3f46" fontSize="7">
          {((t * max) / 1000).toFixed(0)}k
        </text>
      ))}
    </svg>
  );
};

// ─── SOURCE VIEW ──────────────────────────────────────────────────────────────
type Palette = { accent: string; bg: string; border: string };
type SourceViewProps = {
  source: Source;
  palette: Palette;
  onUpdateIncome: (id: string, income: number) => void;
  onAddExpense: (srcId: string, exp: FinanceExpense) => void;
  onUpdateExpense: (srcId: string, exp: FinanceExpense) => void;
  onDeleteExpense: (srcId: string, expId: string) => void;
};
const SourceView = ({ source, palette, onUpdateIncome, onAddExpense, onUpdateExpense, onDeleteExpense }: SourceViewProps) => {
  const [newLabel, setNewLabel] = useState("");
  const [newAmt, setNewAmt]     = useState("");
  const [editIncome, setEditIncome] = useState(false);
  const [incInput, setIncInput]     = useState(String(source.income));
  const [editingExpId, setEditingExpId] = useState<string | null>(null);
  const [editExpLabel, setEditExpLabel] = useState("");
  const [editExpAmt, setEditExpAmt]     = useState("");

  useEffect(() => {
    setIncInput(String(source.income));
  }, [source.income]);

  const totalExp = source.expenses.reduce((s, e) => s + e.amount, 0);
  const balance  = source.income - totalExp;
  const isNeg    = balance < 0;

  const handleAdd = () => {
    const amt = parseFloat(newAmt);
    if (!newLabel.trim() || !newAmt || isNaN(amt)) return;
    onAddExpense(source.id, { id: makeId(), label: newLabel.trim(), amount: amt });
    setNewLabel(""); setNewAmt("");
  };

  return (
    <div className="space-y-4">
      {/* Income hero */}
      <div className="rounded-2xl p-5 relative overflow-hidden"
        style={{ background: palette.bg, border: `1px solid ${palette.border}` }}>
        <div className="absolute -right-8 -top-8 w-32 h-32 rounded-full"
          style={{ background: palette.accent, opacity: 0.06 }} />
        <p className="text-xs mb-1 font-medium" style={{ color: palette.accent }}>Ingreso mensual</p>

        {editIncome ? (
          <div className="flex items-center gap-2">
            <input type="number" value={incInput}
              onChange={e => setIncInput(e.target.value)}
              autoFocus
              className="text-3xl font-bold bg-transparent border-b-2 text-white w-36 focus:outline-none"
              style={{ borderColor: palette.accent }} />
            <button onClick={() => { onUpdateIncome(source.id, parseFloat(incInput) || 0); setEditIncome(false); }}
              className="p-1.5 rounded-lg bg-zinc-800">
              <Icon d={I.check} size={15} className="text-emerald-400" />
            </button>
          </div>
        ) : (
          <div className="flex items-end gap-2">
            <span className="text-4xl font-bold text-white">{fmt(source.income)}</span>
            <button onClick={() => { setIncInput(String(source.income)); setEditIncome(true); }}
              className="mb-1 text-zinc-600 hover:text-zinc-400 transition-colors">
              <Icon d={I.edit} size={13} />
            </button>
          </div>
        )}

        <div className="mt-3 grid grid-cols-3 gap-3">
          {[
            { label: "Gastos",   val: fmt(totalExp),  color: "#f87171" },
            { label: "Balance",  val: fmt(balance),   color: isNeg ? "#f87171" : "#fff" },
            { label: "% Ahorro", val: source.income > 0 ? `${Math.max(0, ((balance / source.income) * 100)).toFixed(0)}%` : "—", color: palette.accent },
          ].map(item => (
            <div key={item.label}>
              <p className="text-xs text-zinc-600">{item.label}</p>
              <p className="text-sm font-bold" style={{ color: item.color }}>{item.val}</p>
            </div>
          ))}
        </div>
      </div>

      {isNeg && (
        <div className="flex items-center gap-2 bg-red-500/10 border border-red-500/20 rounded-xl px-3 py-2.5">
          <Icon d={I.warning} size={14} className="text-red-400 flex-shrink-0" />
          <p className="text-red-300 text-xs">Gastos superan el ingreso en <strong>{fmt(Math.abs(balance))}</strong></p>
        </div>
      )}

      {/* Expenses */}
      <Card>
        <div className="flex items-center justify-between mb-3">
          <p className="text-xs text-zinc-600 uppercase tracking-widest font-medium">Gastos asignados</p>
          {source.expenses.length > 0 && (
            <Donut items={source.expenses} colors={EXP_COLORS} size={46}
              center={source.income > 0 ? `${((totalExp / source.income) * 100).toFixed(0)}%` : "—"} />
          )}
        </div>

        {source.expenses.length === 0 && (
          <p className="text-zinc-700 text-sm text-center py-6">Sin gastos asignados aún</p>
        )}

        <div className="divide-y divide-zinc-800">
          {source.expenses.map((exp, i) => (
            <div key={exp.id} className="group py-2.5">
              {editingExpId === exp.id ? (
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: EXP_COLORS[i % EXP_COLORS.length] }} />
                  <input value={editExpLabel} onChange={e => setEditExpLabel(e.target.value)}
                    onKeyDown={e => {
                      if (e.key === "Enter") { onUpdateExpense(source.id, { ...exp, label: editExpLabel.trim() || exp.label, amount: parseFloat(editExpAmt) || exp.amount }); setEditingExpId(null); }
                      if (e.key === "Escape") setEditingExpId(null);
                    }}
                    autoFocus
                    className="flex-1 bg-zinc-800 border border-zinc-700 rounded-lg px-2 py-1 text-sm text-zinc-200 focus:outline-none focus:border-zinc-600 min-w-0" />
                  <input value={editExpAmt} onChange={e => setEditExpAmt(e.target.value)}
                    onKeyDown={e => {
                      if (e.key === "Enter") { onUpdateExpense(source.id, { ...exp, label: editExpLabel.trim() || exp.label, amount: parseFloat(editExpAmt) || exp.amount }); setEditingExpId(null); }
                      if (e.key === "Escape") setEditingExpId(null);
                    }}
                    type="number"
                    className="w-20 bg-zinc-800 border border-zinc-700 rounded-lg px-2 py-1 text-sm text-zinc-200 focus:outline-none focus:border-zinc-600" />
                  <button onClick={() => { onUpdateExpense(source.id, { ...exp, label: editExpLabel.trim() || exp.label, amount: parseFloat(editExpAmt) || exp.amount }); setEditingExpId(null); }}
                    className="p-1.5 rounded-lg bg-zinc-800">
                    <Icon d={I.check} size={13} className="text-emerald-400" />
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: EXP_COLORS[i % EXP_COLORS.length] }} />
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-zinc-300 text-sm truncate pr-2">{exp.label}</span>
                      <div className="flex items-center gap-1.5">
                        <span className="text-white text-sm font-semibold">{fmt(exp.amount)}</span>
                        <button onClick={() => { setEditingExpId(exp.id); setEditExpLabel(exp.label); setEditExpAmt(String(exp.amount)); }}
                          className="opacity-0 group-hover:opacity-100 transition-opacity text-zinc-700 hover:text-zinc-300">
                          <Icon d={I.edit} size={13} />
                        </button>
                        <button onClick={() => onDeleteExpense(source.id, exp.id)}
                          className="opacity-0 group-hover:opacity-100 transition-opacity text-zinc-700 hover:text-red-400">
                          <Icon d={I.trash} size={13} />
                        </button>
                      </div>
                    </div>
                    <Bar value={exp.amount} max={source.income} color={EXP_COLORS[i % EXP_COLORS.length]} />
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>

        <div className="flex gap-2 mt-3 pt-3 border-t border-zinc-800">
          <input value={newLabel} onChange={e => setNewLabel(e.target.value)}
            onKeyDown={e => e.key === "Enter" && handleAdd()}
            placeholder="Concepto"
            className="flex-1 bg-zinc-800/80 border border-zinc-700/50 rounded-xl px-3 py-2 text-sm text-zinc-200 placeholder-zinc-600 focus:outline-none focus:border-zinc-600 min-w-0" />
          <input value={newAmt} onChange={e => setNewAmt(e.target.value)}
            onKeyDown={e => e.key === "Enter" && handleAdd()}
            placeholder="€" type="number"
            className="w-20 bg-zinc-800/80 border border-zinc-700/50 rounded-xl px-3 py-2 text-sm text-zinc-200 placeholder-zinc-600 focus:outline-none focus:border-zinc-600" />
          <button onClick={handleAdd}
            className="p-2.5 rounded-xl bg-zinc-800 text-zinc-400 hover:text-white hover:bg-zinc-700 transition-all">
            <Icon d={I.plus} size={16} />
          </button>
        </div>
      </Card>

      {/* Stacked bar breakdown */}
      {source.expenses.length > 0 && (
        <Card>
          <p className="text-xs text-zinc-600 mb-3">Distribución del ingreso</p>
          <div className="h-3 w-full rounded-full overflow-hidden flex">
            {source.expenses.map((exp, i) => (
              <div key={exp.id} className="h-full transition-all duration-500"
                style={{
                  width: `${source.income > 0 ? (exp.amount / source.income) * 100 : 0}%`,
                  backgroundColor: EXP_COLORS[i % EXP_COLORS.length],
                }} />
            ))}
            {balance > 0 && (
              <div className="h-full transition-all duration-500" style={{ flex: 1, backgroundColor: palette.accent }} />
            )}
          </div>
          <div className="flex flex-wrap gap-x-3 gap-y-1.5 mt-2.5">
            {source.expenses.map((exp, i) => (
              <div key={exp.id} className="flex items-center gap-1.5">
                <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: EXP_COLORS[i % EXP_COLORS.length] }} />
                <span className="text-zinc-500 text-xs">{exp.label}</span>
              </div>
            ))}
            {balance > 0 && (
              <div className="flex items-center gap-1.5">
                <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: palette.accent }} />
                <span className="text-xs" style={{ color: palette.accent }}>Disponible</span>
              </div>
            )}
          </div>
        </Card>
      )}
    </div>
  );
};

// ─── OVERVIEW TAB ─────────────────────────────────────────────────────────────
const OverviewTab = ({ sources }: { sources: Source[] }) => {
  const totalIncome = sources.reduce((s, src) => s + src.income, 0);
  const totalExp    = sources.reduce((s, src) => s + src.expenses.reduce((a, e) => a + e.amount, 0), 0);
  const totalBal    = totalIncome - totalExp;

  return (
    <div className="space-y-4">
      <div className="rounded-3xl p-5 bg-gradient-to-br from-zinc-800/80 to-zinc-900 border border-zinc-800">
        <p className="text-zinc-500 text-xs mb-1">Balance total mensual</p>
        <p className={`text-4xl font-black tracking-tight ${totalBal >= 0 ? "text-white" : "text-red-400"}`}>
          {fmt(totalBal)}
        </p>
        <p className="text-zinc-600 text-xs mt-1">
          Tasa de ahorro global:{" "}
          <span className="text-emerald-400 font-semibold">
            {totalIncome > 0 ? Math.max(0, ((totalBal / totalIncome) * 100)).toFixed(0) : 0}%
          </span>
        </p>
      </div>

      <div className="space-y-2">
        {sources.map((src, i) => {
          const p = SOURCE_PALETTES[i % SOURCE_PALETTES.length];
          const exp = src.expenses.reduce((a, e) => a + e.amount, 0);
          const bal = src.income - exp;
          return (
            <Card key={src.id}>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: p.accent }} />
                  <span className="text-sm font-semibold text-zinc-200">{src.name}</span>
                </div>
                <span className="text-xs text-zinc-500 font-medium">{fmt(src.income)}</span>
              </div>
              <Bar value={exp} max={src.income} color={p.accent} h="h-2" />
              <div className="flex justify-between mt-1.5">
                <span className="text-xs text-zinc-700">Gastos: {fmt(exp)}</span>
                <span className={`text-xs font-semibold ${bal >= 0 ? "text-zinc-400" : "text-red-400"}`}>
                  {bal >= 0 ? "+" : ""}{fmt(bal)}
                </span>
              </div>
            </Card>
          );
        })}
      </div>

      {sources.length === 0 && (
        <div className="text-center py-16 text-zinc-700">
          <p className="text-sm">Sin fuentes de ingreso aún.</p>
          <p className="text-xs mt-1">Ve a la pestaña Fuentes para empezar.</p>
        </div>
      )}

      <div className="grid grid-cols-2 gap-2">
        <Card>
          <p className="text-zinc-600 text-xs mb-0.5">Total ingresos</p>
          <p className="text-emerald-400 font-bold text-xl">{fmt(totalIncome)}</p>
        </Card>
        <Card>
          <p className="text-zinc-600 text-xs mb-0.5">Total gastos</p>
          <p className="text-red-400 font-bold text-xl">{fmt(totalExp)}</p>
        </Card>
      </div>
    </div>
  );
};

// ─── MONTH SAVING ROW ────────────────────────────────────────────────────────
type MonthSavingRowProps = {
  monthLabel: string;
  monthAmt: number;
  cumVal: number;
  savingsGoal: number;
  isCurrent: boolean;
  isFuture: boolean;
  onSave: (amount: number) => void;
};
const MonthSavingRow = ({ monthLabel, monthAmt, cumVal, savingsGoal, isCurrent, isFuture, onSave }: MonthSavingRowProps) => {
  const [editing, setEditing] = useState(false);
  const [input, setInput]     = useState("");
  const hitGoal = savingsGoal > 0 && cumVal >= savingsGoal;

  const commit = () => {
    const v = parseFloat(input);
    if (!isNaN(v)) onSave(v);
    setEditing(false);
  };

  return (
    <div className={`flex items-center gap-3 rounded-xl px-3 py-2.5 transition-colors ${isCurrent ? "bg-zinc-800/80 ring-1 ring-emerald-500/30" : "bg-zinc-900/40"}`}>
      <span className={`text-xs font-semibold w-7 flex-shrink-0 ${isCurrent ? "text-emerald-400" : isFuture ? "text-zinc-700" : "text-zinc-500"}`}>
        {monthLabel}
      </span>

      {editing ? (
        <>
          <input type="number" value={input} autoFocus
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => { if (e.key === "Enter") commit(); if (e.key === "Escape") setEditing(false); }}
            className="flex-1 bg-zinc-800 border border-emerald-500/50 rounded-lg px-2 py-1 text-sm text-white focus:outline-none" />
          <button onMouseDown={e => { e.preventDefault(); commit(); }}
            className="p-1.5 rounded-lg bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30 transition-all flex-shrink-0">
            <Icon d={I.check} size={14} />
          </button>
        </>
      ) : (
        <div className="flex-1 min-w-0">
          <div className="flex justify-between items-center mb-1">
            <span className={`text-sm font-semibold ${monthAmt === 0 ? "text-zinc-700" : "text-white"}`}>
              {monthAmt === 0 ? (isFuture ? "—" : fmt(0)) : fmt(monthAmt)}
            </span>
            {cumVal > 0 && (
              <span className={`text-xs ${hitGoal ? "text-yellow-400 font-semibold" : "text-zinc-600"}`}>
                acum. {fmt(cumVal)}{hitGoal ? " 🎉" : ""}
              </span>
            )}
          </div>
          <Bar value={monthAmt} max={savingsGoal > 0 ? savingsGoal / 12 * 2 || 1 : monthAmt || 1} color={hitGoal ? "#facc15" : isFuture ? "#3f3f46" : "#34d399"} />
        </div>
      )}

      {!editing && (
        <button onClick={() => { setInput(String(monthAmt)); setEditing(true); }}
          className="p-1 text-zinc-700 hover:text-zinc-400 transition-colors flex-shrink-0">
          <Icon d={I.edit} size={12} />
        </button>
      )}
    </div>
  );
};

// ─── PLAN TAB ─────────────────────────────────────────────────────────────────
type PlanTabProps = {
  ym: string;
  uid: string;
};
const PlanTab = ({ ym, uid }: PlanTabProps) => {
  const year = ym.split("-")[0];
  const currentMonthIdx = parseInt(ym.split("-")[1], 10) - 1;

  const { data: planData, save: savePlan, loading: planLoading } = usePlanning(uid, year);

  const [loanOpen, setLoanOpen] = useState(false);
  const [loanEditing, setLoanEditing] = useState<Loan | undefined>(undefined);
  const [goalOpen, setGoalOpen] = useState(false);
  const [goalEditing, setGoalEditing] = useState<Goal | undefined>(undefined);
  const [accOpen, setAccOpen] = useState(false);
  const [accEditing, setAccEditing] = useState<Account | undefined>(undefined);
  const [editingGoalInput, setEditingGoalInput] = useState(false);
  const [goalInput, setGoalInput] = useState("");

  const savingsGoal    = planData?.savingsGoal ?? 0;
  const savingsEntries = planData?.savingsEntries ?? [];

  const cumulativeData = useMemo(() =>
    Array.from({ length: 12 }, (_, i) => {
      const acc = Array.from({ length: i + 1 }, (__, j) => {
        const key = `${year}-${String(j + 1).padStart(2, "0")}`;
        return savingsEntries.find(e => e.ym === key)?.amount ?? 0;
      }).reduce((s, v) => s + v, 0);
      return { month: MONTHS[i], monthIdx: i, val: acc };
    }),
  [savingsEntries, year]);

  if (planLoading || !planData) return <p className="text-zinc-600 text-sm text-center py-8">Cargando plan…</p>;

  const setPlanning = (updater: (p: Planning) => Planning) => savePlan(updater(planData));

  const getEntry = (mIdx: number) =>
    savingsEntries.find(e => e.ym === `${year}-${String(mIdx + 1).padStart(2, "0")}`)?.amount ?? 0;
  const setMonthSaving = (mIdx: number, amount: number) => {
    const key = `${year}-${String(mIdx + 1).padStart(2, "0")}`;
    const next = savingsEntries.some(e => e.ym === key)
      ? savingsEntries.map(e => e.ym === key ? { ...e, amount } : e)
      : [...savingsEntries, { ym: key, amount }];
    setPlanning(p => ({ ...p, savingsEntries: next }));
  };

  const totalSaved = cumulativeData[11].val;
  const pctSaved   = Math.min((totalSaved / (savingsGoal || 1)) * 100, 100);
  const hitIdx     = cumulativeData.findIndex(d => d.val >= savingsGoal && savingsGoal > 0);
  const hitMonth   = hitIdx >= 0 ? FULL_MONTHS[hitIdx] : null;

  // ── plan helpers ──
  const saveLoan = (loan: Loan) =>
    setPlanning(p => {
      const next = { ...loan, id: loan.id || nanoid() };
      return { ...p, loans: p.loans.some(x => x.id === next.id) ? p.loans.map(x => x.id === next.id ? next : x) : [...p.loans, next] };
    });
  const saveGoalItem = (g: Goal) =>
    setPlanning(p => {
      const next = { ...g, id: g.id || nanoid(), contributions: g.contributions ?? [] };
      return { ...p, goals: p.goals.some(x => x.id === next.id) ? p.goals.map(x => x.id === next.id ? next : x) : [...p.goals, next] };
    });
  const saveAcc = (a: Account) =>
    setPlanning(p => {
      const next = { ...a, id: a.id || nanoid() };
      return { ...p, accounts: p.accounts.some(x => x.id === next.id) ? p.accounts.map(x => x.id === next.id ? next : x) : [...p.accounts, next] };
    });
  const deleteLoan     = (id: string) => setPlanning(p => ({ ...p, loans: p.loans.filter(x => x.id !== id) }));
  const deleteGoalItem = (id: string) => setPlanning(p => ({ ...p, goals: p.goals.filter(x => x.id !== id) }));
  const deleteAcc      = (id: string) => setPlanning(p => ({ ...p, accounts: p.accounts.filter(x => x.id !== id) }));

  return (
    <div className="space-y-4">

      {/* ── META ANUAL ── */}
      <div className="rounded-3xl p-5 bg-gradient-to-br from-zinc-800/80 to-zinc-900 border border-zinc-800">
        <p className="text-zinc-500 text-xs mb-1">Meta de ahorro {year}</p>

        {editingGoalInput ? (
          <div className="flex items-center gap-2">
            <input type="number" value={goalInput} onChange={e => setGoalInput(e.target.value)} autoFocus
              onKeyDown={e => {
                if (e.key === "Enter") { setPlanning(p => ({ ...p, savingsGoal: parseFloat(goalInput) || 0 })); setEditingGoalInput(false); }
                if (e.key === "Escape") setEditingGoalInput(false);
              }}
              className="text-3xl font-bold bg-transparent border-b-2 border-emerald-400 text-white w-44 focus:outline-none" />
            <button onClick={() => { setPlanning(p => ({ ...p, savingsGoal: parseFloat(goalInput) || 0 })); setEditingGoalInput(false); }}
              className="p-1.5 rounded-lg bg-zinc-800">
              <Icon d={I.check} size={15} className="text-emerald-400" />
            </button>
          </div>
        ) : (
          <div className="flex items-end gap-2">
            <span className="text-4xl font-black text-white tracking-tight">{fmt(savingsGoal)}</span>
            <button onClick={() => { setGoalInput(String(savingsGoal)); setEditingGoalInput(true); }}
              className="mb-1 text-zinc-600 hover:text-zinc-400 transition-colors">
              <Icon d={I.edit} size={13} />
            </button>
          </div>
        )}

        <div className="mt-3">
          <div className="flex justify-between text-xs mb-1.5">
            <span className="text-zinc-500">Ahorrado hasta ahora</span>
            <span className={hitMonth ? "text-emerald-400 font-semibold" : "text-zinc-400"}>{fmt(totalSaved)}</span>
          </div>
          <div className="h-2 bg-zinc-800 rounded-full overflow-hidden">
            <div className="h-full rounded-full transition-all duration-500"
              style={{ width: `${pctSaved}%`, background: hitMonth ? "linear-gradient(90deg,#34d399,#6ee7b7)" : "linear-gradient(90deg,#60a5fa,#818cf8)" }} />
          </div>
          <div className="flex justify-between mt-1.5">
            <span className="text-zinc-700 text-xs">{pctSaved.toFixed(0)}%</span>
            {hitMonth
              ? <span className="text-emerald-400 text-xs font-semibold">Meta alcanzada en {hitMonth} 🎉</span>
              : savingsGoal > 0 && <span className="text-zinc-600 text-xs">Faltan {fmt(savingsGoal - totalSaved)}</span>}
          </div>
        </div>
      </div>

      {/* ── MES A MES ── */}
      <Card>
        <p className="text-xs text-zinc-600 uppercase tracking-widest mb-3">Ahorro mes a mes · {year}</p>
        <div className="space-y-2">
          {Array.from({ length: 12 }, (_, i) => {
            const isCurrent = i === currentMonthIdx;
            const cumVal    = cumulativeData[i].val;
            const monthAmt  = getEntry(i);
            const isFuture  = i > currentMonthIdx;
            return (
              <MonthSavingRow
                key={i}
                monthLabel={MONTHS[i]}
                monthAmt={monthAmt}
                cumVal={cumVal}
                savingsGoal={savingsGoal}
                isCurrent={isCurrent}
                isFuture={isFuture}
                onSave={amount => setMonthSaving(i, amount)}
              />
            );
          })}
        </div>
      </Card>

      {/* ── GRÁFICO ── */}
      {totalSaved > 0 && (
        <Card>
          <p className="text-xs text-zinc-600 mb-3">Evolución acumulada</p>
          <ProjChart data={cumulativeData} target={savingsGoal} />
        </Card>
      )}

      {/* ── PRÉSTAMOS ── */}
      <Card>
        <div className="flex items-center justify-between mb-3">
          <p className="text-xs text-zinc-600 uppercase tracking-widest font-medium">Préstamos</p>
          <button onClick={() => { setLoanEditing(undefined); setLoanOpen(true); }}
            className="p-1.5 rounded-lg bg-zinc-800 text-zinc-400 hover:text-white transition-all">
            <Icon d={I.plus} size={14} />
          </button>
        </div>
        {planData.loans.length === 0 && <p className="text-zinc-700 text-sm text-center py-4">Sin préstamos</p>}
        <div className="space-y-3">
          {planData.loans.map(l => (
            <div key={l.id} className="rounded-xl bg-zinc-800/60 p-3">
              <div className="flex justify-between items-center mb-1">
                <span className="text-zinc-200 text-sm font-medium">{l.title || "Préstamo"}</span>
                <div className="flex gap-1.5">
                  <button onClick={() => { setLoanEditing(l); setLoanOpen(true); }} className="p-1 text-zinc-600 hover:text-zinc-300 transition-colors">
                    <Icon d={I.edit} size={12} />
                  </button>
                  <button onClick={() => deleteLoan(l.id)} className="p-1 text-zinc-600 hover:text-red-400 transition-colors">
                    <Icon d={I.trash} size={12} />
                  </button>
                </div>
              </div>
              <LoanSummary loan={l} />
            </div>
          ))}
        </div>
      </Card>

      {/* ── OBJETIVOS ── */}
      <Card>
        <div className="flex items-center justify-between mb-3">
          <p className="text-xs text-zinc-600 uppercase tracking-widest font-medium">Objetivos</p>
          <button onClick={() => { setGoalEditing(undefined); setGoalOpen(true); }}
            className="p-1.5 rounded-lg bg-zinc-800 text-zinc-400 hover:text-white transition-all">
            <Icon d={I.plus} size={14} />
          </button>
        </div>
        {planData.goals.length === 0 && <p className="text-zinc-700 text-sm text-center py-4">Sin objetivos</p>}
        <div className="space-y-3">
          {planData.goals.map(g => {
            const contributed = g.contributions?.reduce((s, c) => s + c.amount, 0) ?? 0;
            const pctGoal = Math.min((contributed / (g.target || 1)) * 100, 100);
            return (
              <div key={g.id} className="rounded-xl bg-zinc-800/60 p-3">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-zinc-200 text-sm font-medium">{g.title || "Objetivo"}</span>
                  <div className="flex gap-1.5">
                    <button onClick={() => { setGoalEditing(g); setGoalOpen(true); }} className="p-1 text-zinc-600 hover:text-zinc-300 transition-colors">
                      <Icon d={I.edit} size={12} />
                    </button>
                    <button onClick={() => deleteGoalItem(g.id)} className="p-1 text-zinc-600 hover:text-red-400 transition-colors">
                      <Icon d={I.trash} size={12} />
                    </button>
                  </div>
                </div>
                <Bar value={contributed} max={g.target || 1} color="#34d399" h="h-2" />
                <div className="flex justify-between mt-1.5">
                  <span className="text-zinc-600 text-xs">{fmt(contributed)} / {fmt(g.target)}</span>
                  <span className="text-emerald-400 text-xs font-semibold">{pctGoal.toFixed(0)}%</span>
                </div>
              </div>
            );
          })}
        </div>
      </Card>

      {/* ── CUENTAS ── */}
      <Card>
        <div className="flex items-center justify-between mb-3">
          <p className="text-xs text-zinc-600 uppercase tracking-widest font-medium">Cuentas</p>
          <button onClick={() => { setAccEditing(undefined); setAccOpen(true); }}
            className="p-1.5 rounded-lg bg-zinc-800 text-zinc-400 hover:text-white transition-all">
            <Icon d={I.plus} size={14} />
          </button>
        </div>
        {planData.accounts.length === 0 && <p className="text-zinc-700 text-sm text-center py-4">Sin cuentas</p>}
        <div className="space-y-2">
          {planData.accounts.map(a => (
            <div key={a.id} className="flex items-center justify-between rounded-xl bg-zinc-800/60 px-3 py-2.5">
              <span className="text-zinc-200 text-sm">{a.bank || "Cuenta"}</span>
              <div className="flex items-center gap-3">
                <span className="text-white text-sm font-semibold">{fmt(a.balance)}</span>
                <button onClick={() => { setAccEditing(a); setAccOpen(true); }} className="p-1 text-zinc-600 hover:text-zinc-300 transition-colors">
                  <Icon d={I.edit} size={12} />
                </button>
                <button onClick={() => deleteAcc(a.id)} className="p-1 text-zinc-600 hover:text-red-400 transition-colors">
                  <Icon d={I.trash} size={12} />
                </button>
              </div>
            </div>
          ))}
        </div>
      </Card>

      <LoanModal open={loanOpen} initial={loanEditing} onCancel={() => setLoanOpen(false)}
        onSave={loan => { saveLoan(loan); setLoanOpen(false); }} />
      <GoalModal open={goalOpen} initial={goalEditing} onCancel={() => setGoalOpen(false)}
        onSave={g => { saveGoalItem(g); setGoalOpen(false); }} />
      <AccountModal open={accOpen} initial={accEditing} onCancel={() => setAccOpen(false)}
        onSave={a => { saveAcc(a); setAccOpen(false); }} />
    </div>
  );
};

// ─── LOGIN SCREEN ─────────────────────────────────────────────────────────────
const LoginScreen = () => {
  const handleLogin = async () => {
    const provider = new GoogleAuthProvider();
    await signInWithPopup(auth, provider);
  };
  return (
    <div className="min-h-screen bg-zinc-950 flex flex-col items-center justify-center gap-6 px-6">
      <div className="w-12 h-12 rounded-2xl bg-emerald-400 flex items-center justify-center">
        <Icon d={I.spark} size={22} className="text-zinc-900" />
      </div>
      <div className="text-center">
        <h1 className="text-2xl font-black text-white tracking-tight">finflow</h1>
        <p className="text-zinc-600 text-sm mt-1">Gestión de finanzas personales</p>
      </div>
      <button onClick={handleLogin}
        className="px-6 py-3 bg-emerald-500 hover:bg-emerald-400 text-zinc-900 font-semibold rounded-2xl transition-all text-sm">
        Iniciar sesión con Google
      </button>
    </div>
  );
};

// ─── MAIN APP ─────────────────────────────────────────────────────────────────
type MainTab = "overview" | "sources" | "plan";

export default function FinancePage() {
  const [user, authLoading] = useAuthState(auth);
  const [ym, setYm]                         = useState(new Date().toISOString().slice(0, 7));
  const [mainTab, setMainTab]               = useState<MainTab>("overview");
  const [activeSource, setActiveSource]     = useState<string | null>(null);
  const [addingSource, setAddingSource]     = useState(false);
  const [newSrcName, setNewSrcName]         = useState("");
  const [saving, setSaving]                 = useState(false);
  const [savedOk, setSavedOk]               = useState(false);

  const { data, save, loading } = useFinanceMonth(user?.uid, ym);

  const sources: Source[] = data?.sources ?? [];

  useEffect(() => {
    if (sources.length > 0 && !activeSource) {
      setActiveSource(sources[0].id);
    }
  }, [sources, activeSource]);

  // reset active source when month changes
  useEffect(() => {
    setActiveSource(null);
  }, [ym]);

  const persistSources = async (next: Source[]) => {
    setSaving(true);
    try {
      const payload: FinanceMonth = { sources: next };
      await save(payload);
      setSavedOk(true);
      setTimeout(() => setSavedOk(false), 1500);
    } finally {
      setSaving(false);
    }
  };

  const updateIncome = (srcId: string, income: number) => {
    const next = sources.map(s => s.id === srcId ? { ...s, income } : s);
    persistSources(next);
  };
  const addExpense = (srcId: string, exp: FinanceExpense) => {
    const next = sources.map(s => s.id === srcId ? { ...s, expenses: [...s.expenses, exp] } : s);
    persistSources(next);
  };
  const updateExpense = (srcId: string, exp: FinanceExpense) => {
    const next = sources.map(s => s.id === srcId ? { ...s, expenses: s.expenses.map(e => e.id === exp.id ? exp : e) } : s);
    persistSources(next);
  };
  const deleteExpense = (srcId: string, expId: string) => {
    const next = sources.map(s => s.id === srcId ? { ...s, expenses: s.expenses.filter(e => e.id !== expId) } : s);
    persistSources(next);
  };
  const handleAddSource = () => {
    if (!newSrcName.trim()) return;
    const id = "s" + makeId();
    const newSrc: Source = { id, name: newSrcName.trim(), income: 0, expenses: [] };
    const next = [...sources, newSrc];
    persistSources(next);
    setActiveSource(id);
    setMainTab("sources");
    setNewSrcName("");
    setAddingSource(false);
  };

  const currentSrc = sources.find(s => s.id === activeSource) ?? sources[0] ?? null;
  const currentPalette = currentSrc
    ? SOURCE_PALETTES[sources.findIndex(s => s.id === currentSrc.id) % SOURCE_PALETTES.length]
    : SOURCE_PALETTES[0];

  if (authLoading) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
        <div className="w-8 h-8 rounded-full border-2 border-zinc-700 border-t-emerald-400 animate-spin" />
      </div>
    );
  }

  if (!user) {
    return <LoginScreen />;
  }

  return (
    <div className="min-h-screen bg-zinc-950 text-white" style={{ fontFamily: "'DM Sans', system-ui, sans-serif" }}>

      {/* HEADER */}
      <div className="sticky top-0 z-20 bg-zinc-950/95 backdrop-blur-xl border-b border-zinc-800/60">
        <div className="px-4 pt-4 pb-0 max-w-lg mx-auto">

          {/* Top bar: logo + month nav + user */}
          <div className="flex items-center gap-2 mb-3">
            <div className="w-7 h-7 rounded-lg bg-emerald-400 flex items-center justify-center flex-shrink-0">
              <Icon d={I.spark} size={13} className="text-zinc-900" />
            </div>
            <span className="font-black text-lg tracking-tight">finflow</span>

            {/* Month navigator */}
            <div className="flex items-center gap-1 ml-auto">
              <button onClick={() => setYm(prevYm(ym))}
                className="p-1.5 rounded-lg text-zinc-600 hover:text-zinc-300 hover:bg-zinc-800 transition-all">
                <Icon d={I.chevL} size={14} />
              </button>
              <div className="relative">
                <button
                  onClick={() => (document.getElementById("month-input") as HTMLInputElement)?.showPicker?.()}
                  className="px-2.5 py-1 rounded-lg bg-zinc-800/80 text-zinc-300 text-xs font-semibold min-w-[110px] text-center hover:bg-zinc-700 transition-all">
                  {ymToLabel(ym)}
                </button>
                <input id="month-input" type="month" value={ym} onChange={e => setYm(e.target.value)}
                  className="absolute inset-0 opacity-0 w-full cursor-pointer" />
              </div>
              <button onClick={() => setYm(nextYm(ym))}
                className="p-1.5 rounded-lg text-zinc-600 hover:text-zinc-300 hover:bg-zinc-800 transition-all">
                <Icon d={I.chevR} size={14} />
              </button>
            </div>

            {/* Save indicator + user */}
            <div className="flex items-center gap-1.5 ml-1">
              {saving && <div className="w-3.5 h-3.5 rounded-full border border-zinc-600 border-t-emerald-400 animate-spin" />}
              {savedOk && <Icon d={I.check} size={14} className="text-emerald-400" />}
              <button onClick={() => auth.signOut()}
                className="p-1.5 rounded-lg text-zinc-600 hover:text-zinc-400 transition-colors" title="Cerrar sesión">
                <Icon d={I.logout} size={14} />
              </button>
            </div>
          </div>

          {/* Main tabs */}
          <div className="flex border-b border-zinc-800">
            {([
              { id: "overview" as MainTab, label: "Resumen", icon: I.chart  },
              { id: "sources"  as MainTab, label: "Fuentes", icon: I.wallet },
              { id: "plan"     as MainTab, label: "Plan",    icon: I.target },
            ]).map(t => (
              <button key={t.id} onClick={() => setMainTab(t.id)}
                className={`flex items-center gap-1.5 px-4 py-3 text-sm font-medium border-b-2 transition-all -mb-px ${
                  mainTab === t.id
                    ? "border-emerald-400 text-emerald-400"
                    : "border-transparent text-zinc-600 hover:text-zinc-300"
                }`}>
                <Icon d={t.icon} size={13} />
                {t.label}
              </button>
            ))}
          </div>

          {/* Source sub-tabs */}
          {mainTab === "sources" && (
            <div className="flex gap-1.5 py-2.5 overflow-x-auto" style={{ scrollbarWidth: "none" }}>
              {sources.map((src, i) => {
                const p = SOURCE_PALETTES[i % SOURCE_PALETTES.length];
                const isActive = src.id === activeSource;
                return (
                  <button key={src.id} onClick={() => setActiveSource(src.id)}
                    className="flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-semibold transition-all"
                    style={isActive
                      ? { backgroundColor: p.accent, color: "#09090b" }
                      : { backgroundColor: "#18181b", color: "#71717a" }}>
                    {src.name}
                  </button>
                );
              })}
              <button onClick={() => setAddingSource(v => !v)}
                className="flex-shrink-0 w-7 h-7 my-auto rounded-full bg-zinc-800 text-zinc-600 hover:text-zinc-400 flex items-center justify-center transition-all">
                <Icon d={I.plus} size={13} />
              </button>
            </div>
          )}
        </div>
      </div>

      {/* CONTENT */}
      <div className="px-4 py-5 max-w-lg mx-auto pb-10 space-y-4">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="w-8 h-8 rounded-full border-2 border-zinc-700 border-t-emerald-400 animate-spin" />
          </div>
        ) : (
          <>
            {addingSource && mainTab === "sources" && (
              <div className="flex gap-2">
                <input value={newSrcName} onChange={e => setNewSrcName(e.target.value)}
                  onKeyDown={e => e.key === "Enter" && handleAddSource()}
                  placeholder="Ej: Freelance, Alquiler, Inversiones…"
                  autoFocus
                  className="flex-1 bg-zinc-800 border border-zinc-700 rounded-xl px-3 py-2 text-sm text-zinc-200 placeholder-zinc-600 focus:outline-none focus:border-zinc-600" />
                <button onClick={handleAddSource}
                  className="px-4 py-2 bg-emerald-500/20 text-emerald-400 rounded-xl text-sm font-medium hover:bg-emerald-500/30 transition-all">
                  Añadir
                </button>
              </div>
            )}

            {mainTab === "overview" && <OverviewTab sources={sources} />}
            {mainTab === "sources" && currentSrc && (
              <SourceView
                source={currentSrc}
                palette={currentPalette}
                onUpdateIncome={updateIncome}
                onAddExpense={addExpense}
                onUpdateExpense={updateExpense}
                onDeleteExpense={deleteExpense}
              />
            )}
            {mainTab === "sources" && !currentSrc && (
              <div className="text-center py-20 text-zinc-700">
                <p className="text-sm">Añadí una fuente de ingreso para empezar.</p>
              </div>
            )}
            {mainTab === "plan" && (
              <PlanTab ym={ym} uid={user.uid} />
            )}
          </>
        )}
      </div>
    </div>
  );
}
