"use client";

import { useState } from "react";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";

type AdminAuthProps = {
  unauthorizedEmail?: string;
};

export default function AdminAuth({ unauthorizedEmail }: AdminAuthProps) {
  const supabase = createSupabaseBrowserClient();
  const [email, setEmail] = useState(unauthorizedEmail ?? "");
  const [password, setPassword] = useState("");
  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleLogin(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus("");
    setLoading(true);

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    setLoading(false);

    if (error) {
      setStatus(error.message);
      return;
    }

    setStatus("Login correcto. Recarga si no ves el panel.");
  }

  async function handleSignOut() {
    setStatus("");
    await supabase.auth.signOut();
  }

  return (
    <main className="min-h-screen bg-slate-950 text-slate-50">
      <div className="mx-auto flex max-w-lg flex-col gap-6 px-6 py-20">
        <div className="rounded-3xl border border-slate-800 bg-slate-900/70 p-6 shadow-2xl shadow-black/30">
          <h1 className="text-2xl font-semibold">Admin login</h1>
          <p className="mt-2 text-sm text-slate-400">
            Inicia sesion con tu cuenta de Supabase Auth.
          </p>

          {unauthorizedEmail ? (
            <div className="mt-5 rounded-2xl border border-rose-500/40 bg-rose-500/10 p-4 text-sm text-rose-200">
              El email <strong>{unauthorizedEmail}</strong> no esta autorizado.
              <div className="mt-3">
                <button
                  type="button"
                  onClick={handleSignOut}
                  className="rounded-full bg-rose-500/20 px-4 py-2 text-xs font-semibold text-rose-100 ring-1 ring-rose-400/40"
                >
                  Cerrar sesion
                </button>
              </div>
            </div>
          ) : null}

          <form onSubmit={handleLogin} className="mt-6 space-y-4">
            <div>
              <label className="text-xs uppercase tracking-[0.2em] text-slate-400">Email</label>
              <input
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                className="mt-2 w-full rounded-xl border border-slate-800 bg-slate-950 px-4 py-2 text-sm text-slate-100"
                placeholder="admin@empresa.com"
                required
              />
            </div>
            <div>
              <label className="text-xs uppercase tracking-[0.2em] text-slate-400">Password</label>
              <input
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                className="mt-2 w-full rounded-xl border border-slate-800 bg-slate-950 px-4 py-2 text-sm text-slate-100"
                placeholder="Tu clave segura"
                required
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-xl bg-emerald-500/80 px-4 py-2 text-sm font-semibold text-slate-950 transition hover:bg-emerald-400 disabled:cursor-not-allowed disabled:opacity-70"
            >
              {loading ? "Ingresando..." : "Ingresar"}
            </button>
          </form>

          {status ? <p className="mt-4 text-sm text-amber-200">{status}</p> : null}
        </div>
      </div>
    </main>
  );
}
