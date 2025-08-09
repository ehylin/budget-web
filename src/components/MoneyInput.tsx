import { useEffect, useState } from "react";
import { formatNumberEs, parseEuroToNumber } from "../utils/money";

type Props = {
  id?: string;
  value: number;
  onChangeNumber: (n: number) => void; // devuelve número al salir del campo
  disabled?: boolean;
  placeholder?: string;
  className?: string;
};

export default function MoneyInput({
  id,
  value,
  onChangeNumber,
  disabled,
  placeholder,
  className,
}: Props) {
  // estado local "lo que el usuario ve y teclea"
  const [text, setText] = useState<string>(formatNumberEs(value));

  // si cambia el valor externo (p.ej. al cargar un mes), sincroniza
  useEffect(() => {
    setText(formatNumberEs(value));
  }, [value]);

  return (
    <div className={`relative ${disabled ? "opacity-60" : ""}`}>
      <input
        id={id}
        type="text"
        inputMode="decimal"
        disabled={disabled}
        className={`w-full border rounded px-2 py-1 pr-6 text-right ${
          className ?? ""
        }`}
        value={text}
        placeholder={placeholder}
        onChange={(e) => {
          // permite borrar o escribir con coma/punto
          setText(e.target.value);
        }}
        onBlur={() => {
          const parsed = parseEuroToNumber(text);
          const num = parsed ?? 0; // si queda vacío, toma 0
          onChangeNumber(num);
          setText(formatNumberEs(num));
        }}
      />
      {/* sufijo € visual */}
      <span className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-gray-500">
        €
      </span>
    </div>
  );
}
