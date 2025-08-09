import { useAuthState } from "react-firebase-hooks/auth";
import { auth, login, logout } from "../lib/firebase";
import "firebase/compat/auth";
import { CircleUser } from "lucide-react";
import { useState } from "react";

export default function Header() {
  const [user] = useAuthState(auth);
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <div className="p-6 bg-primary">
      <header className="flex items-center justify-between ">
        <h1 className="text-md font-bold text-white">Presupuesto mensual</h1>
        {!user ? (
          <button className="border px-3 py-1 rounded bg-white" onClick={login}>
            Entrar con Google
          </button>
        ) : (
          <div className="flex items-center gap-3 relative">
            {/* Botón con icono de usuario */}
            <button
              className="flex items-center gap-1"
              onClick={() => setMenuOpen((prev) => !prev)}
            >
              <CircleUser size={22} color="white" />
            </button>

            {/* Dropdown */}
            {menuOpen && (
              <div className="absolute top-full right-0 mt-2 w-56 bg-white rounded shadow-lg p-3 text-sm z-50">
                <div className="mb-2">
                  <p className="font-semibold">{user.displayName}</p>
                  <p className="text-gray-500">{user.email}</p>
                </div>
                <button
                  className="w-full text-left text-red-500 hover:text-red-700"
                  onClick={logout}
                >
                  Cerrar sesión
                </button>
              </div>
            )}
          </div>
        )}
      </header>
    </div>
  );
}
