"use client";

import { useEffect, useState } from "react";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";

type Mode = "login" | "signup";

export default function PublicAuthBar() {
  const supabase = createSupabaseBrowserClient();
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [showAuth, setShowAuth] = useState(false);
  const [mode, setMode] = useState<Mode>("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let active = true;

    async function loadUser() {
      const { data } = await supabase.auth.getUser();
      if (!active) {
        return;
      }
      setUserEmail(data.user?.email ?? null);
    }

    loadUser();

    const { data: subscription } = supabase.auth.onAuthStateChange((_event, session) => {
      setUserEmail(session?.user?.email ?? null);
    });

    return () => {
      active = false;
      subscription?.subscription.unsubscribe();
    };
  }, [supabase]);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus("");
    setLoading(true);

    if (mode === "signup") {
      const { error } = await supabase.auth.signUp({ email, password });
      setLoading(false);
      if (error) {
        setStatus(error.message);
        return;
      }
      setStatus("Cuenta creada. Revisa tu correo si se requiere verificacion.");
      return;
    }

    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (error) {
      setStatus(error.message);
      return;
    }
    setShowAuth(false);
  }

  async function handleSignOut() {
    await supabase.auth.signOut();
  }

  return (
    <div className="flex flex-wrap items-center gap-3">
      {userEmail ? (
        <>
          <span className="text-sm text-slate-600">Sesion: {userEmail}</span>
          <button
            type="button"
            onClick={handleSignOut}
            className="rounded-full border border-slate-300 px-4 py-2 text-xs font-semibold text-slate-600 hover:border-slate-400"
          >
            Cerrar sesion
          </button>
        </>
      ) : (
        <>
          <button
            type="button"
            onClick={() => {
              setMode("signup");
              setShowAuth(true);
            }}
            className="rounded-full bg-slate-900 px-4 py-2 text-xs font-semibold text-white hover:bg-slate-800"
          >
            Crear cuenta
          </button>
          <button
            type="button"
            onClick={() => {
              setMode("login");
              setShowAuth(true);
            }}
            className="rounded-full border border-slate-300 px-4 py-2 text-xs font-semibold text-slate-600 hover:border-slate-400"
          >
            Ingresar
          </button>
        </>
      )}

      {showAuth ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 px-4 py-6">
          <div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl shadow-slate-400/40">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold text-slate-900">
                {mode === "signup" ? "Crear cuenta" : "Iniciar sesion"}
              </h2>
              <button
                type="button"
                onClick={() => setShowAuth(false)}
                className="rounded-full border border-slate-200 px-3 py-1 text-xs font-semibold text-slate-600"
              >
                Cerrar
              </button>
            </div>

            <form onSubmit={handleSubmit} className="mt-5 space-y-4">
              <div>
                <label className="text-xs uppercase tracking-[0.2em] text-slate-500">Email</label>
                <input
                  type="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm text-slate-900"
                  required
                />
              </div>
              <div>
                <label className="text-xs uppercase tracking-[0.2em] text-slate-500">Password</label>
                <input
                  type="password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm text-slate-900"
                  required
                />
              </div>
              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-xl bg-emerald-500 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-600 disabled:cursor-not-allowed disabled:opacity-70"
              >
                {loading ? "Enviando..." : mode === "signup" ? "Crear cuenta" : "Ingresar"}
              </button>
            </form>

            {status ? <p className="mt-4 text-sm text-amber-700">{status}</p> : null}
          </div>
        </div>
      ) : null}
    </div>
  );
}
