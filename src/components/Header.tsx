import { useAuthState } from "react-firebase-hooks/auth";
import { auth, login, logout } from "../lib/firebase";
import "firebase/compat/auth";

export default function Header() {
  const [user] = useAuthState(auth);

  return (
    <div className="p-6 bg-green-400">
      <header className="flex items-center justify-between ">
        <h1 className="text-2xl font-bold">Presupuesto mensual</h1>
        {!user ? (
          <button className="border px-3 py-1 rounded bg-white" onClick={login}>
            Entrar con Google
          </button>
        ) : (
          <div className="flex items-center gap-3">
            <span className="text-sm">Hola, {user.displayName}</span>
            <button className="border px-3 py-1 rounded" onClick={logout}>
              Salir
            </button>
          </div>
        )}
      </header>
    </div>
  );
}
