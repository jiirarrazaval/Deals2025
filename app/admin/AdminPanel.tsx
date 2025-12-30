"use client";

import { useMemo, useState } from "react";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";
import * as XLSX from "xlsx";

type AdminPanelProps = {
  email: string;
};

type PlotPayload = {
  title: string;
  location: string;
  price_usd: number;
  area_m2: number;
  status?: string;
  type?: string;
  description?: string;
  image_url?: string;
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

function normalizeHeader(value: string) {
  return value
    .toLowerCase()
    .trim()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
}

const headerAliases: Record<string, string[]> = {
  title: ["title", "titulo", "nombre", "terreno"],
  location: ["location", "ubicacion", "ciudad", "lugar"],
  price_usd: ["price_usd", "precio", "precio_usd", "price", "valor"],
  area_m2: ["area_m2", "area", "m2", "metros2", "metros_cuadrados"],
  status: ["status", "estado"],
  type: ["type", "tipo"],
  description: ["description", "descripcion", "detalle"],
  image_url: ["image_url", "imagen", "image", "url", "foto"],
};

function pickValue(normalizedRow: Record<string, string>, key: keyof typeof headerAliases) {
  const aliases = headerAliases[key];
  for (const alias of aliases) {
    if (normalizedRow[alias] !== undefined && normalizedRow[alias] !== "") {
      return normalizedRow[alias];
    }
  }
  return "";
}

function mapRowToPlot(row: Record<string, unknown>): PlotPayload | null {
  const normalizedRow: Record<string, string> = {};
  for (const [key, value] of Object.entries(row)) {
    normalizedRow[normalizeHeader(key)] = String(value ?? "").trim();
  }

  const title = pickValue(normalizedRow, "title");
  const location = pickValue(normalizedRow, "location");
  const price = pickValue(normalizedRow, "price_usd");
  const area = pickValue(normalizedRow, "area_m2");
  const status = pickValue(normalizedRow, "status") || "available";
  const type = pickValue(normalizedRow, "type") || "residential";
  const description = pickValue(normalizedRow, "description");
  const imageUrl = pickValue(normalizedRow, "image_url");

  const priceValue = Number(String(price).replace(/[^0-9.]/g, ""));
  const areaValue = Number(String(area).replace(/[^0-9.]/g, ""));

  if (!title || !location || !Number.isFinite(priceValue) || !Number.isFinite(areaValue)) {
    return null;
  }

  return {
    title,
    location,
    price_usd: priceValue,
    area_m2: areaValue,
    status: status.toLowerCase(),
    type: type.toLowerCase(),
    description: description || undefined,
    image_url: imageUrl || undefined,
  };
}

export default function AdminPanel({ email }: AdminPanelProps) {
  const supabase = createSupabaseBrowserClient();
  const [form, setForm] = useState<PlotPayload>({
    title: "",
    location: "",
    price_usd: 0,
    area_m2: 0,
    status: "available",
    type: "residential",
    description: "",
    image_url: "",
  });
  const [status, setStatus] = useState("");
  const [importStatus, setImportStatus] = useState("");
  const [importedRows, setImportedRows] = useState(0);
  const [loading, setLoading] = useState(false);

  const isFormValid = useMemo(() => {
    return (
      form.title.trim().length > 0 &&
      form.location.trim().length > 0 &&
      Number.isFinite(form.price_usd) &&
      form.price_usd > 0 &&
      Number.isFinite(form.area_m2) &&
      form.area_m2 > 0
    );
  }, [form]);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus("");
    setLoading(true);

    const payload = {
      plot: {
        ...form,
        price_usd: Number(form.price_usd),
        area_m2: Number(form.area_m2),
      },
    };

    const response = await fetch("/api/admin/plots", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const result = await response.json();
    setLoading(false);

    if (!response.ok) {
      setStatus(result?.error ?? "No se pudo guardar el terreno.");
      return;
    }

    setStatus("Terreno guardado.");
    setForm({
      title: "",
      location: "",
      price_usd: 0,
      area_m2: 0,
      status: "available",
      type: "residential",
      description: "",
      image_url: "",
    });
  }

  async function handleFileChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    setImportStatus("");
    setImportedRows(0);

    const buffer = await file.arrayBuffer();
    const workbook = XLSX.read(buffer, { type: "array" });
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];
    const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, {
      defval: "",
    });

    const plots = rows.map(mapRowToPlot).filter(Boolean) as PlotPayload[];

    if (plots.length === 0) {
      setImportStatus("No se encontraron filas validas en el archivo.");
      return;
    }

    const response = await fetch("/api/admin/plots", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ plots }),
    });

    const result = await response.json();

    if (!response.ok) {
      setImportStatus(result?.error ?? "No se pudo importar el archivo.");
      return;
    }

    setImportedRows(result?.count ?? plots.length);
    setImportStatus("Importacion completada.");
    event.target.value = "";
  }

  async function handleSignOut() {
    await supabase.auth.signOut();
  }

  return (
    <main className="min-h-screen bg-slate-950 text-slate-50">
      <div className="mx-auto flex max-w-6xl flex-col gap-8 px-6 py-16">
        <header className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-sm uppercase tracking-[0.3em] text-slate-400">Admin</p>
            <h1 className="text-3xl font-semibold text-white">Panel de terrenos</h1>
            <p className="mt-1 text-sm text-slate-400">Sesion: {email}</p>
          </div>
          <button
            type="button"
            onClick={handleSignOut}
            className="rounded-full border border-slate-700 px-4 py-2 text-xs font-semibold text-slate-200 hover:border-slate-500"
          >
            Cerrar sesion
          </button>
        </header>

        <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
          <section className="rounded-3xl border border-slate-800 bg-slate-900/70 p-6 shadow-2xl shadow-black/30">
            <h2 className="text-xl font-semibold">Nuevo terreno</h2>
            <p className="mt-2 text-sm text-slate-400">Completa los campos para agregar manualmente.</p>

            <form onSubmit={handleSubmit} className="mt-6 grid gap-4 md:grid-cols-2">
              <div className="md:col-span-2">
                <label className="text-xs uppercase tracking-[0.2em] text-slate-400">Titulo</label>
                <input
                  value={form.title}
                  onChange={(event) => setForm({ ...form, title: event.target.value })}
                  className="mt-2 w-full rounded-xl border border-slate-800 bg-slate-950 px-4 py-2 text-sm text-slate-100"
                  placeholder="Nombre del terreno"
                  required
                />
              </div>
              <div>
                <label className="text-xs uppercase tracking-[0.2em] text-slate-400">Ubicacion</label>
                <input
                  value={form.location}
                  onChange={(event) => setForm({ ...form, location: event.target.value })}
                  className="mt-2 w-full rounded-xl border border-slate-800 bg-slate-950 px-4 py-2 text-sm text-slate-100"
                  placeholder="Ciudad, pais"
                  required
                />
              </div>
              <div>
                <label className="text-xs uppercase tracking-[0.2em] text-slate-400">Precio (USD)</label>
                <input
                  type="number"
                  min="0"
                  value={form.price_usd}
                  onChange={(event) =>
                    setForm({ ...form, price_usd: Number(event.target.value) })
                  }
                  className="mt-2 w-full rounded-xl border border-slate-800 bg-slate-950 px-4 py-2 text-sm text-slate-100"
                  required
                />
              </div>
              <div>
                <label className="text-xs uppercase tracking-[0.2em] text-slate-400">Area (m2)</label>
                <input
                  type="number"
                  min="0"
                  value={form.area_m2}
                  onChange={(event) => setForm({ ...form, area_m2: Number(event.target.value) })}
                  className="mt-2 w-full rounded-xl border border-slate-800 bg-slate-950 px-4 py-2 text-sm text-slate-100"
                  required
                />
              </div>
              <div>
                <label className="text-xs uppercase tracking-[0.2em] text-slate-400">Estado</label>
                <select
                  value={form.status}
                  onChange={(event) => setForm({ ...form, status: event.target.value })}
                  className="mt-2 w-full rounded-xl border border-slate-800 bg-slate-950 px-4 py-2 text-sm text-slate-100"
                >
                  {statusOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-xs uppercase tracking-[0.2em] text-slate-400">Tipo</label>
                <select
                  value={form.type}
                  onChange={(event) => setForm({ ...form, type: event.target.value })}
                  className="mt-2 w-full rounded-xl border border-slate-800 bg-slate-950 px-4 py-2 text-sm text-slate-100"
                >
                  {typeOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
              <div className="md:col-span-2">
                <label className="text-xs uppercase tracking-[0.2em] text-slate-400">Descripcion</label>
                <textarea
                  value={form.description}
                  onChange={(event) => setForm({ ...form, description: event.target.value })}
                  className="mt-2 min-h-[110px] w-full rounded-xl border border-slate-800 bg-slate-950 px-4 py-2 text-sm text-slate-100"
                  placeholder="Detalle del terreno"
                />
              </div>
              <div className="md:col-span-2">
                <label className="text-xs uppercase tracking-[0.2em] text-slate-400">Imagen URL</label>
                <input
                  value={form.image_url}
                  onChange={(event) => setForm({ ...form, image_url: event.target.value })}
                  className="mt-2 w-full rounded-xl border border-slate-800 bg-slate-950 px-4 py-2 text-sm text-slate-100"
                  placeholder="https://..."
                />
              </div>
              <div className="md:col-span-2 flex flex-wrap items-center gap-3">
                <button
                  type="submit"
                  disabled={!isFormValid || loading}
                  className="rounded-xl bg-emerald-500/80 px-5 py-2 text-sm font-semibold text-slate-950 transition hover:bg-emerald-400 disabled:cursor-not-allowed disabled:opacity-70"
                >
                  {loading ? "Guardando..." : "Guardar terreno"}
                </button>
                {status ? <span className="text-sm text-emerald-200">{status}</span> : null}
              </div>
            </form>
          </section>

          <section className="rounded-3xl border border-slate-800 bg-slate-900/70 p-6">
            <h2 className="text-xl font-semibold">Importar desde Excel</h2>
            <p className="mt-2 text-sm text-slate-400">
              Sube un archivo .xlsx o .csv con las columnas: title, location, price_usd, area_m2,
              status, type, description, image_url.
            </p>
            <div className="mt-5 rounded-2xl border border-dashed border-slate-700 bg-slate-950/60 p-4">
              <input
                type="file"
                accept=".xlsx,.xls,.csv"
                onChange={handleFileChange}
                className="w-full text-sm text-slate-200 file:mr-4 file:rounded-full file:border-0 file:bg-slate-800 file:px-4 file:py-2 file:text-xs file:font-semibold file:text-slate-200 hover:file:bg-slate-700"
              />
            </div>
            {importStatus ? (
              <div className="mt-4 text-sm text-slate-200">
                {importStatus}
                {importedRows > 0 ? ` (${importedRows} filas)` : ""}
              </div>
            ) : null}
          </section>
        </div>
      </div>
    </main>
  );
}
