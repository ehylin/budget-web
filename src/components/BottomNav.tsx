import { Home, CalendarCheck, PieChart } from "lucide-react";

export type TabKey = "home" | "plan" | "stats";

type Item = { key: TabKey; label: string; icon: React.ElementType };

const items: Item[] = [
  { key: "home", label: "Inicio", icon: Home },
  { key: "plan", label: "Planificación", icon: CalendarCheck },
  { key: "stats", label: "Estadística", icon: PieChart },
];

export default function BottomNav({
  active = "home",
  onChange,
}: {
  active?: TabKey;
  onChange?: (key: TabKey) => void;
}) {
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 border-t bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/75">
      <ul className="mx-auto max-w-3xl grid grid-cols-3">
        {items.map(({ key, label, icon: Icon }) => {
          const isActive = active === key;
          return (
            <li key={key}>
              <button
                onClick={() => onChange?.(key)}
                className="w-full flex flex-col items-center justify-center py-2 gap-1"
              >
                <Icon
                  className={`h-6 w-6 ${
                    isActive ? "text-black" : "text-gray-400"
                  }`}
                  strokeWidth={isActive ? 2.5 : 2}
                />
                <span
                  className={`text-xs ${
                    isActive ? "text-black" : "text-gray-500"
                  }`}
                >
                  {label}
                </span>
              </button>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
