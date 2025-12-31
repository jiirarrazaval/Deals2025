"use client";

import { useEffect, useMemo, useState } from "react";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";

type ListingPayload = {
  title: string;
  location: string;
  price_usd: number;
  area_m2: number;
  type: string;
  deal_type: string;
  description: string;
  image_urls: string[];
  lat: number | null;
  lng: number | null;
};

const typeOptions = [
  { value: "residential", label: "Residencial" },
  { value: "agrarian", label: "Agricola" },
  { value: "commercial", label: "Comercial" },
];

const dealOptions = [
  { value: "sale", label: "Venta" },
  { value: "rent", label: "Arriendo" },
];

export default function ListingForm() {
  const supabase = createSupabaseBrowserClient();
  const [userId, setUserId] = useState<string | null>(null);
  const [form, setForm] = useState<ListingPayload>({
    title: "",
    location: "",
    price_usd: 0,
    area_m2: 0,
    type: "residential",
    deal_type: "sale",
    description: "",
    image_urls: [],
    lat: null,
    lng: null,
  });
  const [address, setAddress] = useState("");
  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [files, setFiles] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);

  useEffect(() => {
    let active = true;
    async function loadUser() {
      const { data } = await supabase.auth.getUser();
      if (!active) {
        return;
      }
      setUserId(data.user?.id ?? null);
    }

    loadUser();

    const { data: subscription } = supabase.auth.onAuthStateChange((_event, session) => {
      setUserId(session?.user?.id ?? null);
    });

    return () => {
      active = false;
      subscription?.subscription.unsubscribe();
    };
  }, [supabase]);

  useEffect(() => {
    const nextPreviews = files.map((file) => URL.createObjectURL(file));
    setPreviews(nextPreviews);
    return () => {
      nextPreviews.forEach((url) => URL.revokeObjectURL(url));
    };
  }, [files]);

  const isValid = useMemo(() => {
    return (
      form.title.trim().length > 0 &&
      form.location.trim().length > 0 &&
      Number.isFinite(form.price_usd) &&
      form.price_usd > 0 &&
      Number.isFinite(form.area_m2) &&
      form.area_m2 > 0
    );
  }, [form]);

  function handleFileSelect(event: React.ChangeEvent<HTMLInputElement>) {
    const selected = event.target.files ? Array.from(event.target.files) : [];
    if (!selected.length) {
      return;
    }
    setFiles(selected);
  }

  async function handleGeocode() {
    setStatus("");

    if (!address.trim()) {
      setStatus("Escribe una direccion primero.");
      return;
    }

    const response = await fetch("/api/geocode", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ address }),
    });

    const result = await response.json();

    if (!response.ok) {
      setStatus(result?.error ?? "No se pudo geocodificar la direccion.");
      return;
    }

    setForm((prev) => ({
      ...prev,
      lat: result.lat,
      lng: result.lng,
    }));
    setStatus("Coordenadas actualizadas.");
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus("");

    if (!userId) {
      setStatus("Debes iniciar sesion para publicar.");
      return;
    }

    setLoading(true);
    const payload = {
      ...form,
      user_id: userId,
      status: "pending",
      image_urls: [],
    };

    const { data: created, error } = await supabase
      .from("user_listings")
      .insert([payload])
      .select("id")
      .single();

    if (error || !created) {
      setLoading(false);
      setStatus(error?.message ?? "No se pudo crear la publicacion.");
      return;
    }

    if (files.length > 0) {
      setUploading(true);
      const uploadedUrls: string[] = [];

      for (const file of files) {
        const safeName = file.name.replace(/\s+/g, "-");
        const path = `${created.id}/${Date.now()}-${safeName}`;
        const { error: uploadError } = await supabase.storage
          .from("listing-photos")
          .upload(path, file, {
            cacheControl: "3600",
            upsert: false,
          });

        if (uploadError) {
          setUploading(false);
          setLoading(false);
          setStatus(uploadError.message);
          return;
        }

        const { data } = supabase.storage.from("listing-photos").getPublicUrl(path);
        uploadedUrls.push(data.publicUrl);
      }

      const { error: updateError } = await supabase
        .from("user_listings")
        .update({ image_urls: uploadedUrls })
        .eq("id", created.id);

      if (updateError) {
        setUploading(false);
        setLoading(false);
        setStatus(updateError.message);
        return;
      }
      setUploading(false);
    }

    setLoading(false);
    setStatus("Publicacion enviada. Quedara en revision.");
    setForm({
      title: "",
      location: "",
      price_usd: 0,
      area_m2: 0,
      type: "residential",
      deal_type: "sale",
      description: "",
      image_urls: [],
      lat: null,
      lng: null,
    });
    setAddress("");
    setFiles([]);
  }

  return (
    <section className="rounded-3xl border border-slate-200 bg-white/90 p-6 shadow-xl shadow-slate-200/60">
      <h2 className="text-2xl font-semibold text-slate-900">Publica tu propiedad</h2>
      <p className="mt-2 text-sm text-slate-500">
        Inicia sesion y sube la informacion de tu propiedad. Quedara en revision antes de publicarse.
      </p>

      {!userId ? (
        <div className="mt-6 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-700">
          Debes iniciar sesion para publicar una propiedad.
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="mt-6 grid gap-4 md:grid-cols-2">
          <div className="md:col-span-2">
            <label className="text-xs uppercase tracking-[0.2em] text-slate-500">Titulo</label>
            <input
              value={form.title}
              onChange={(event) => setForm({ ...form, title: event.target.value })}
              className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm text-slate-900"
              placeholder="Casa en venta en..."
              required
            />
          </div>
          <div>
            <label className="text-xs uppercase tracking-[0.2em] text-slate-500">Ubicacion</label>
            <input
              value={form.location}
              onChange={(event) => setForm({ ...form, location: event.target.value })}
              className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm text-slate-900"
              placeholder="Ciudad, pais"
              required
            />
          </div>
          <div>
            <label className="text-xs uppercase tracking-[0.2em] text-slate-500">Operacion</label>
            <select
              value={form.deal_type}
              onChange={(event) => setForm({ ...form, deal_type: event.target.value })}
              className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm text-slate-900"
            >
              {dealOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-xs uppercase tracking-[0.2em] text-slate-500">Precio (USD)</label>
            <input
              type="number"
              min="0"
              value={form.price_usd}
              onChange={(event) => setForm({ ...form, price_usd: Number(event.target.value) })}
              className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm text-slate-900"
              required
            />
          </div>
          <div>
            <label className="text-xs uppercase tracking-[0.2em] text-slate-500">Area (m2)</label>
            <input
              type="number"
              min="0"
              value={form.area_m2}
              onChange={(event) => setForm({ ...form, area_m2: Number(event.target.value) })}
              className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm text-slate-900"
              required
            />
          </div>
          <div>
            <label className="text-xs uppercase tracking-[0.2em] text-slate-500">Tipo</label>
            <select
              value={form.type}
              onChange={(event) => setForm({ ...form, type: event.target.value })}
              className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm text-slate-900"
            >
              {typeOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
          <div className="md:col-span-2">
            <label className="text-xs uppercase tracking-[0.2em] text-slate-500">Descripcion</label>
            <textarea
              value={form.description}
              onChange={(event) => setForm({ ...form, description: event.target.value })}
              className="mt-2 min-h-[110px] w-full rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm text-slate-900"
              placeholder="Describe la propiedad"
            />
          </div>
          <div className="md:col-span-2">
            <label className="text-xs uppercase tracking-[0.2em] text-slate-500">
              Direccion para buscar coordenadas
            </label>
            <div className="mt-2 flex flex-col gap-3 md:flex-row">
              <input
                value={address}
                onChange={(event) => setAddress(event.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm text-slate-900"
                placeholder="Ej: Av. Libertad 123, Viña del Mar, Chile"
              />
              <button
                type="button"
                onClick={handleGeocode}
                className="rounded-xl bg-slate-900 px-4 py-2 text-xs font-semibold text-white hover:bg-slate-800"
              >
                Buscar coordenadas
              </button>
            </div>
          </div>
          <div>
            <label className="text-xs uppercase tracking-[0.2em] text-slate-500">Latitud</label>
            <input
              type="number"
              step="0.000001"
              value={form.lat ?? ""}
              onChange={(event) =>
                setForm({
                  ...form,
                  lat: event.target.value === "" ? null : Number(event.target.value),
                })
              }
              className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm text-slate-900"
              placeholder="-33.45"
            />
          </div>
          <div>
            <label className="text-xs uppercase tracking-[0.2em] text-slate-500">Longitud</label>
            <input
              type="number"
              step="0.000001"
              value={form.lng ?? ""}
              onChange={(event) =>
                setForm({
                  ...form,
                  lng: event.target.value === "" ? null : Number(event.target.value),
                })
              }
              className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm text-slate-900"
              placeholder="-70.66"
            />
          </div>
          <div className="md:col-span-2">
            <label className="text-xs uppercase tracking-[0.2em] text-slate-500">
              Fotos de la propiedad
            </label>
            <input
              type="file"
              accept="image/*"
              multiple
              onChange={handleFileSelect}
              className="mt-2 w-full text-sm text-slate-700 file:mr-4 file:rounded-full file:border-0 file:bg-slate-900 file:px-4 file:py-2 file:text-xs file:font-semibold file:text-white hover:file:bg-slate-800"
              disabled={uploading}
            />
            {previews.length ? (
              <div className="mt-3 flex flex-wrap gap-2">
                {previews.map((url, index) => (
                  <img
                    key={`${url}-${index}`}
                    src={url}
                    alt={`Preview ${index + 1}`}
                    className="h-16 w-20 rounded-xl border border-slate-200 object-cover"
                  />
                ))}
              </div>
            ) : null}
          </div>
          <div className="md:col-span-2 flex flex-wrap items-center gap-3">
            <button
              type="submit"
              disabled={!isValid || loading || uploading}
              className="rounded-xl bg-emerald-500 px-5 py-2 text-sm font-semibold text-white transition hover:bg-emerald-600 disabled:cursor-not-allowed disabled:opacity-70"
            >
              {loading ? "Enviando..." : uploading ? "Subiendo fotos..." : "Enviar propiedad"}
            </button>
            {status ? <span className="text-sm text-amber-700">{status}</span> : null}
          </div>
        </form>
      )}
    </section>
  );
}
