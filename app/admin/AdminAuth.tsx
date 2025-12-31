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
    <main className="min-h-screen bg-slate-50 text-slate-900">
      <div className="mx-auto flex max-w-lg flex-col gap-6 px-6 py-20">
        <div className="rounded-3xl border border-slate-200 bg-white/90 p-6 shadow-xl shadow-slate-200/60">
          <h1 className="text-2xl font-semibold text-slate-900">Admin login</h1>
          <p className="mt-2 text-sm text-slate-500">
            Inicia sesion con tu cuenta de Supabase Auth.
          </p>

          {unauthorizedEmail ? (
            <div className="mt-5 rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">
              El email <strong>{unauthorizedEmail}</strong> no esta autorizado.
              <div className="mt-3">
                <button
                  type="button"
                  onClick={handleSignOut}
                  className="rounded-full bg-rose-100 px-4 py-2 text-xs font-semibold text-rose-700 ring-1 ring-rose-200"
                >
                  Cerrar sesion
                </button>
              </div>
            </div>
          ) : null}

          <form onSubmit={handleLogin} className="mt-6 space-y-4">
            <div>
              <label className="text-xs uppercase tracking-[0.2em] text-slate-500">Email</label>
              <input
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm text-slate-900"
                placeholder="admin@empresa.com"
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
                placeholder="Tu clave segura"
                required
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-xl bg-emerald-500 px-4 py-2 text-sm font-semibold text-white transition hover:bg-emerald-600 disabled:cursor-not-allowed disabled:opacity-70"
            >
              {loading ? "Ingresando..." : "Ingresar"}
            </button>
          </form>

          {status ? <p className="mt-4 text-sm text-amber-700">{status}</p> : null}
        </div>
      </div>
    </main>
  );
}
