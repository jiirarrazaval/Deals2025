"use client";

import { useEffect, useMemo, useState } from "react";

type Plot = {
  id: string;
  title: string;
  location: string;
  price_usd: number;
  area_m2: number;
  status: string;
  type: string;
  description: string | null;
  image_url: string | null;
  lat: number | null;
  lng: number | null;
};

const statusOptions = [
  { value: "available", label: "Disponible" },
  { value: "reserved", label: "Reservado" },
  { value: "sold", label: "Vendido" },
];

const typeOptions = [
  { value: "residential", label: "Residencial" },
  { value: "agrarian", label: "Agricola" },
  { value: "commercial", label: "Comercial" },
];

export default function ManagePanel() {
  const [plots, setPlots] = useState<Plot[]>([]);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draft, setDraft] = useState<Partial<Plot>>({});
  const [address, setAddress] = useState("");

  useEffect(() => {
    let active = true;

    async function load() {
      setLoading(true);
      setStatus("");
      const response = await fetch("/api/admin/plots");
      const result = await response.json();

      if (!active) {
        return;
      }

      if (!response.ok) {
        setStatus(result?.error ?? "No se pudo cargar los terrenos.");
        setLoading(false);
        return;
      }

      setPlots(result?.plots ?? []);
      setLoading(false);
    }

    load();

    return () => {
      active = false;
    };
  }, []);

  const plotCount = useMemo(() => plots.length, [plots]);

  function startEdit(plot: Plot) {
    setEditingId(plot.id);
    setDraft({
      title: plot.title,
      location: plot.location,
      price_usd: plot.price_usd,
      area_m2: plot.area_m2,
      status: plot.status,
      type: plot.type,
      description: plot.description ?? "",
      image_url: plot.image_url ?? "",
      lat: plot.lat,
      lng: plot.lng,
    });
    setAddress("");
  }

  function cancelEdit() {
    setEditingId(null);
    setDraft({});
    setAddress("");
  }

  async function handleDelete(id: string) {
    setStatus("");
    const response = await fetch("/api/admin/plots", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    const result = await response.json();

    if (!response.ok) {
      setStatus(result?.error ?? "No se pudo eliminar el terreno.");
      return;
    }

    setPlots((prev) => prev.filter((plot) => plot.id !== id));
  }

  async function handleUpdate(id: string) {
    setStatus("");
    const response = await fetch("/api/admin/plots", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, updates: draft }),
    });
    const result = await response.json();

    if (!response.ok) {
      setStatus(result?.error ?? "No se pudo actualizar el terreno.");
      return;
    }

    setPlots((prev) =>
      prev.map((plot) => (plot.id === id ? { ...plot, ...draft } as Plot : plot))
    );
    setEditingId(null);
    setDraft({});
    setStatus("Terreno actualizado.");
  }

  async function handleGeocode() {
    setStatus("");

    if (!address.trim()) {
      setStatus("Escribe una direccion primero.");
      return;
    }

    const response = await fetch("/api/admin/geocode", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ address }),
    });
    const result = await response.json();

    if (!response.ok) {
      setStatus(result?.error ?? "No se pudo geocodificar la direccion.");
      return;
    }

    setDraft((prev) => ({
      ...prev,
      lat: result.lat,
      lng: result.lng,
    }));
    setStatus("Coordenadas actualizadas desde la direccion.");
  }

  return (
    <section className="rounded-3xl border border-slate-200 bg-white/90 p-6 shadow-xl shadow-slate-200/60">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-semibold">Gestionar terrenos</h2>
          <p className="mt-1 text-sm text-slate-500">{plotCount} registros en total.</p>
        </div>
        {status ? <span className="text-sm text-amber-700">{status}</span> : null}
      </div>

      {loading ? (
        <p className="mt-6 text-sm text-slate-500">Cargando catalogo...</p>
      ) : (
        <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {plots.map((plot) => (
            <article
              key={plot.id}
              className="relative rounded-3xl border border-slate-200 bg-white p-4 shadow-md shadow-slate-200/60"
            >
              <button
                type="button"
                onClick={() => handleDelete(plot.id)}
                className="absolute right-3 top-3 rounded-full border border-slate-200 bg-white px-2 py-1 text-xs font-semibold text-slate-600 hover:border-slate-300"
                aria-label="Eliminar"
              >
                X
              </button>
              <div className="h-36 overflow-hidden rounded-2xl border border-slate-200">
                {plot.image_url ? (
                  <img src={plot.image_url} alt={plot.title} className="h-full w-full object-cover" />
                ) : (
                  <div className="h-full w-full bg-slate-100" />
                )}
              </div>
              <div className="mt-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-base font-semibold text-slate-900">{plot.title}</h3>
                  <button
                    type="button"
                    onClick={() => startEdit(plot)}
                    className="text-xs font-semibold text-slate-600 hover:text-slate-800"
                  >
                    Editar
                  </button>
                </div>
                <p className="text-sm text-slate-500">{plot.location}</p>
                <p className="text-sm text-slate-500">
                  {plot.area_m2} m<sup>2</sup> • ${plot.price_usd}
                </p>
              </div>

              {editingId === plot.id ? (
                <div className="mt-4 space-y-3 rounded-2xl border border-slate-200 bg-slate-50 p-3">
                  <input
                    value={String(draft.title ?? "")}
                    onChange={(event) => setDraft({ ...draft, title: event.target.value })}
                    className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900"
                    placeholder="Titulo"
                  />
                  <input
                    value={String(draft.location ?? "")}
                    onChange={(event) => setDraft({ ...draft, location: event.target.value })}
                    className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900"
                    placeholder="Ubicacion"
                  />
                  <div className="grid gap-2 sm:grid-cols-2">
                    <input
                      type="number"
                      value={Number(draft.price_usd ?? 0)}
                      onChange={(event) =>
                        setDraft({ ...draft, price_usd: Number(event.target.value) })
                      }
                      className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900"
                      placeholder="Precio"
                    />
                    <input
                      type="number"
                      value={Number(draft.area_m2 ?? 0)}
                      onChange={(event) =>
                        setDraft({ ...draft, area_m2: Number(event.target.value) })
                      }
                      className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900"
                      placeholder="Area m2"
                    />
                  </div>
                  <div className="grid gap-2 sm:grid-cols-2">
                    <select
                      value={String(draft.status ?? plot.status)}
                      onChange={(event) => setDraft({ ...draft, status: event.target.value })}
                      className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900"
                    >
                      {statusOptions.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                    <select
                      value={String(draft.type ?? plot.type)}
                      onChange={(event) => setDraft({ ...draft, type: event.target.value })}
                      className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900"
                    >
                      {typeOptions.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </div>
                  <textarea
                    value={String(draft.description ?? "")}
                    onChange={(event) => setDraft({ ...draft, description: event.target.value })}
                    className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900"
                    placeholder="Descripcion"
                  />
                  <input
                    value={String(draft.image_url ?? "")}
                    onChange={(event) => setDraft({ ...draft, image_url: event.target.value })}
                    className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900"
                    placeholder="Imagen URL"
                  />
                  <div>
                    <label className="text-xs uppercase tracking-[0.2em] text-slate-500">
                      Direccion para buscar coordenadas
                    </label>
                    <div className="mt-2 flex flex-col gap-2 sm:flex-row">
                      <input
                        value={address}
                        onChange={(event) => setAddress(event.target.value)}
                        className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900"
                        placeholder="Ej: Av. Libertad 123, Viña del Mar, Chile"
                      />
                      <button
                        type="button"
                        onClick={handleGeocode}
                        className="rounded-xl bg-slate-900 px-3 py-2 text-xs font-semibold text-white hover:bg-slate-800"
                      >
                        Buscar coordenadas
                      </button>
                    </div>
                  </div>
                  <div className="grid gap-2 sm:grid-cols-2">
                    <input
                      type="number"
                      step="0.000001"
                      value={draft.lat ?? ""}
                      onChange={(event) =>
                        setDraft({
                          ...draft,
                          lat: event.target.value === "" ? null : Number(event.target.value),
                        })
                      }
                      className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900"
                      placeholder="Latitud"
                    />
                    <input
                      type="number"
                      step="0.000001"
                      value={draft.lng ?? ""}
                      onChange={(event) =>
                        setDraft({
                          ...draft,
                          lng: event.target.value === "" ? null : Number(event.target.value),
                        })
                      }
                      className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900"
                      placeholder="Longitud"
                    />
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => handleUpdate(plot.id)}
                      className="rounded-full bg-emerald-500 px-4 py-2 text-xs font-semibold text-white hover:bg-emerald-600"
                    >
                      Guardar cambios
                    </button>
                    <button
                      type="button"
                      onClick={cancelEdit}
                      className="rounded-full border border-slate-300 px-4 py-2 text-xs font-semibold text-slate-600"
                    >
                      Cancelar
                    </button>
                  </div>
                </div>
              ) : null}
            </article>
          ))}
        </div>
      )}
    </section>
  );
}
