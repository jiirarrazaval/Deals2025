"use client";

import { useEffect, useState } from "react";

type UserListing = {
  id: string;
  title: string;
  location: string;
  price_usd: number;
  area_m2: number;
  type: string;
  deal_type: string;
  description: string | null;
  image_urls: string[] | null;
  status: string;
  lat: number | null;
  lng: number | null;
  created_at: string;
  user_id: string;
};

export default function UserSubmissionsPanel() {
  const [listings, setListings] = useState<UserListing[]>([]);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState("");

  useEffect(() => {
    let active = true;
    async function load() {
      setLoading(true);
      setStatus("");
      const response = await fetch("/api/admin/listings");
      const result = await response.json();

      if (!active) {
        return;
      }

      if (!response.ok) {
        setStatus(result?.error ?? "No se pudo cargar las solicitudes.");
        setLoading(false);
        return;
      }

      setListings(result?.listings ?? []);
      setLoading(false);
    }

    load();

    return () => {
      active = false;
    };
  }, []);

  async function handleAction(id: string, action: "approve" | "reject") {
    setStatus("");
    const response = await fetch("/api/admin/listings", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, action }),
    });
    const result = await response.json();

    if (!response.ok) {
      setStatus(result?.error ?? "No se pudo actualizar la solicitud.");
      return;
    }

    setListings((prev) =>
      prev.map((listing) =>
        listing.id === id ? { ...listing, status: action === "approve" ? "approved" : "rejected" } : listing
      )
    );
  }

  return (
    <section className="rounded-3xl border border-slate-200 bg-white/90 p-6 shadow-xl shadow-slate-200/60">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-semibold">Solicitudes de usuarios</h2>
          <p className="mt-1 text-sm text-slate-500">{listings.length} solicitudes.</p>
        </div>
        {status ? <span className="text-sm text-amber-700">{status}</span> : null}
      </div>

      {loading ? (
        <p className="mt-6 text-sm text-slate-500">Cargando solicitudes...</p>
      ) : (
        <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {listings.map((listing) => (
            <article
              key={listing.id}
              className="rounded-3xl border border-slate-200 bg-white p-4 shadow-md shadow-slate-200/60"
            >
              <div className="h-36 overflow-hidden rounded-2xl border border-slate-200">
                {listing.image_urls?.length ? (
                  <img
                    src={listing.image_urls[0]}
                    alt={listing.title}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="h-full w-full bg-slate-100" />
                )}
              </div>
              {listing.image_urls && listing.image_urls.length > 1 ? (
                <div className="mt-3 flex gap-2 overflow-x-auto">
                  {listing.image_urls.slice(1).map((url, index) => (
                    <img
                      key={`${listing.id}-${index}`}
                      src={url}
                      alt={`${listing.title} ${index + 2}`}
                      className="h-14 w-16 rounded-xl border border-slate-200 object-cover"
                    />
                  ))}
                </div>
              ) : null}
              <div className="mt-3 space-y-1">
                <h3 className="text-base font-semibold text-slate-900">{listing.title}</h3>
                <p className="text-sm text-slate-500">{listing.location}</p>
                <p className="text-sm text-slate-500">
                  {listing.area_m2} m<sup>2</sup> • ${listing.price_usd}
                </p>
                <p className="text-xs uppercase tracking-[0.2em] text-slate-400">
                  {listing.deal_type === "rent" ? "Arriendo" : "Venta"} • {listing.type}
                </p>
              </div>
              {listing.description ? (
                <p className="mt-3 text-sm text-slate-600">{listing.description}</p>
              ) : null}

              <div className="mt-4 flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => handleAction(listing.id, "approve")}
                  className="rounded-full bg-emerald-500 px-4 py-2 text-xs font-semibold text-white hover:bg-emerald-600"
                >
                  Aprobar
                </button>
                <button
                  type="button"
                  onClick={() => handleAction(listing.id, "reject")}
                  className="rounded-full border border-slate-300 px-4 py-2 text-xs font-semibold text-slate-600"
                >
                  Rechazar
                </button>
                <span className="rounded-full bg-slate-100 px-3 py-2 text-xs font-semibold text-slate-500">
                  {listing.status}
                </span>
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}
