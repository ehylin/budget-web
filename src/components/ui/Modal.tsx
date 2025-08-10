import { X } from "lucide-react";
import type { ReactNode } from "react";

export default function Modal({
  isOpen,
  title,
  children,
  onClose,
  footer,
}: {
  isOpen: boolean;
  title: string;
  children: ReactNode;
  footer?: ReactNode;
  onClose: () => void;
}) {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-white rounded-xl w-full max-w-md mx-4 shadow-lg">
        <div className="flex items-center justify-between px-4 py-3 border-b">
          <h3 className="font-semibold">{title}</h3>
          <button onClick={onClose} className="p-1 rounded hover:bg-gray-100">
            <X size={18} />
          </button>
        </div>
        <div className="p-4">{children}</div>
        {footer ? <div className="px-4 py-3 border-t">{footer}</div> : null}
      </div>
    </div>
  );
}
