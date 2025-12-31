"use client";

import { useEffect, useMemo, useState } from "react";
import { MapContainer, Marker, Popup, TileLayer } from "react-leaflet";
import L from "leaflet";
import markerIcon2x from "leaflet/dist/images/marker-icon-2x.png";
import markerIcon from "leaflet/dist/images/marker-icon.png";
import markerShadow from "leaflet/dist/images/marker-shadow.png";

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
  image_urls?: string[] | null;
  lat?: number | null;
  lng?: number | null;
};

type PlotGalleryProps = {
  plots: Plot[];
};

const statusMap: Record<string, { label: string; className: string }> = {
  available: { label: "Disponible", className: "bg-emerald-100 text-emerald-700 ring-emerald-200" },
  reserved: { label: "Reservado", className: "bg-amber-100 text-amber-700 ring-amber-200" },
  sold: { label: "Vendido", className: "bg-rose-100 text-rose-700 ring-rose-200" },
};

const typeMap: Record<string, string> = {
  residential: "Residencial",
  agrarian: "Agricola",
  commercial: "Comercial",
};

const currency = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 0,
});

const instagramHandle = "@terrenos2025";
const instagramUrl = "https://instagram.com/terrenos2025";

export default function PlotGallery({ plots }: PlotGalleryProps) {
  const [selected, setSelected] = useState<Plot | null>(null);
  const [activeImage, setActiveImage] = useState<string | null>(null);
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    L.Icon.Default.mergeOptions({
      iconRetinaUrl: markerIcon2x.src,
      iconUrl: markerIcon.src,
      shadowUrl: markerShadow.src,
    });
  }, []);

  useEffect(() => {
    if (!selected) {
      setActiveImage(null);
      setActiveIndex(0);
      return;
    }
    const list = Array.isArray(selected.image_urls) ? selected.image_urls : [];
    const primary = list[0] ?? selected.image_url ?? null;
    setActiveImage(primary);
    setActiveIndex(0);
  }, [selected]);

  useEffect(() => {
    if (selected) {
      document.body.style.overflow = "hidden";
      return () => {
        document.body.style.overflow = "";
      };
    }
    document.body.style.overflow = "";
  }, [selected]);

  const gallery = useMemo(() => {
    if (!selected) {
      return [];
    }
    const list = Array.isArray(selected.image_urls) ? selected.image_urls : [];
    if (list.length) {
      return list;
    }
    return selected.image_url ? [selected.image_url] : [];
  }, [selected]);

  function handlePrev() {
    if (gallery.length === 0) {
      return;
    }
    const nextIndex = (activeIndex - 1 + gallery.length) % gallery.length;
    setActiveIndex(nextIndex);
    setActiveImage(gallery[nextIndex]);
  }

  function handleNext() {
    if (gallery.length === 0) {
      return;
    }
    const nextIndex = (activeIndex + 1) % gallery.length;
    setActiveIndex(nextIndex);
    setActiveImage(gallery[nextIndex]);
  }

  const coords = useMemo(() => {
    if (!selected) {
      return null;
    }
    const lat = Number.isFinite(selected.lat ?? NaN) ? Number(selected.lat) : null;
    const lng = Number.isFinite(selected.lng ?? NaN) ? Number(selected.lng) : null;
    if (lat === null || lng === null) {
      return null;
    }
    return { lat, lng };
  }, [selected]);

  return (
    <>
      <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
        {plots.map((plot) => {
          const status = statusMap[plot.status] ?? statusMap.available;
          const gallery = Array.isArray(plot.image_urls) ? plot.image_urls : [];
          const coverImage = gallery[0] ?? plot.image_url ?? null;
          return (
            <button
              key={plot.id}
              type="button"
              onClick={() => setSelected(plot)}
              className="group text-left rounded-3xl border border-slate-200 bg-white/90 p-4 shadow-lg shadow-slate-200/60 transition hover:-translate-y-1 hover:border-slate-300"
            >
              <div className="relative h-44 overflow-hidden rounded-2xl ring-1 ring-slate-200">
                {coverImage ? (
                  <img src={coverImage} alt={plot.title} className="h-full w-full object-cover" />
                ) : (
                  <div className="h-full w-full bg-gradient-to-br from-slate-200 via-slate-100 to-white" />
                )}
                <span
                  className={`absolute left-3 top-3 rounded-full px-3 py-1 text-xs font-medium ring-1 ${status.className}`}
                >
                  {status.label}
                </span>
              </div>
              <div className="mt-4 flex items-center justify-between">
                <h4 className="text-lg font-semibold text-slate-900">{plot.title}</h4>
                <span className="text-sm text-slate-500">{typeMap[plot.type] ?? "Mixto"}</span>
              </div>
              <p className="mt-2 text-sm text-slate-500">{plot.location}</p>
              <p className="mt-3 text-2xl font-semibold text-slate-900">
                {currency.format(Number(plot.price_usd))}
              </p>
              <p className="text-sm text-slate-500">
                {plot.area_m2} m<sup>2</sup>
              </p>
              {plot.description ? (
                <p className="mt-3 text-sm text-slate-600">{plot.description}</p>
              ) : null}
            </button>
          );
        })}
      </div>

      {selected ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/30 px-4 py-8">
          <div className="relative w-full max-w-6xl overflow-hidden rounded-3xl bg-white shadow-2xl shadow-slate-400/40">
            <button
              type="button"
              onClick={() => setSelected(null)}
              className="absolute right-4 top-4 rounded-full border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-600 hover:border-slate-300"
            >
              Cerrar
            </button>
            <div className="grid max-h-[85vh] gap-6 overflow-y-auto lg:grid-cols-[1.15fr_0.85fr]">
              <div className="p-6">
                <div className="overflow-hidden rounded-3xl border border-slate-200">
                  {activeImage ? (
                    <img
                      src={activeImage}
                      alt={selected.title}
                      className="h-80 w-full object-cover md:h-[420px]"
                    />
                  ) : (
                    <div className="h-80 w-full bg-slate-100 md:h-[420px]" />
                  )}
                </div>
                {gallery.length > 1 ? (
                  <div className="mt-3 flex flex-wrap gap-2">
                    {gallery.map((url, index) => (
                      <button
                        key={`${selected.id}-${index}`}
                        type="button"
                        onClick={() => {
                          setActiveImage(url);
                          setActiveIndex(index);
                        }}
                        className={`overflow-hidden rounded-xl border ${
                          activeImage === url ? "border-slate-900" : "border-slate-200"
                        }`}
                      >
                        <img
                          src={url}
                          alt={`${selected.title} ${index + 1}`}
                          className="h-16 w-20 object-cover"
                        />
                      </button>
                    ))}
                  </div>
                ) : null}
                {gallery.length > 1 ? (
                  <div className="mt-4 flex items-center justify-between">
                    <button
                      type="button"
                      onClick={handlePrev}
                      className="rounded-full border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-600 hover:border-slate-300"
                    >
                      Anterior
                    </button>
                    <span className="text-xs text-slate-500">
                      {activeIndex + 1} / {gallery.length}
                    </span>
                    <button
                      type="button"
                      onClick={handleNext}
                      className="rounded-full border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-600 hover:border-slate-300"
                    >
                      Siguiente
                    </button>
                  </div>
                ) : null}
                <div className="mt-4 space-y-2">
                  <h3 className="text-2xl font-semibold text-slate-900">{selected.title}</h3>
                  <p className="text-sm text-slate-500">{selected.location}</p>
                  <p className="text-xl font-semibold text-slate-900">
                    {currency.format(Number(selected.price_usd))}
                  </p>
                  <p className="text-sm text-slate-500">
                    {selected.area_m2} m<sup>2</sup>
                  </p>
                  {selected.description ? (
                    <p className="text-sm text-slate-600">{selected.description}</p>
                  ) : null}
                </div>

                <div className="mt-6 rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Contacto</p>
                  <p className="mt-2 text-sm text-slate-700">
                    Instagram:{" "}
                    <a
                      href={instagramUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="font-semibold text-slate-900 hover:underline"
                    >
                      {instagramHandle}
                    </a>
                  </p>
                </div>
              </div>

              <div className="border-l border-slate-200 p-6">
                <h4 className="text-lg font-semibold text-slate-900">Ubicacion</h4>
                <p className="mt-2 text-sm text-slate-500">
                  {coords ? "Mapa con coordenadas reales." : "Este terreno no tiene coordenadas."}
                </p>
                <div className="mt-4 h-[360px] overflow-hidden rounded-3xl border border-slate-200">
                  {coords ? (
                    <MapContainer
                      center={[coords.lat, coords.lng]}
                      zoom={12}
                      className="h-full w-full"
                    >
                      <TileLayer
                        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                      />
                      <Marker position={[coords.lat, coords.lng]}>
                        <Popup>{selected.title}</Popup>
                      </Marker>
                    </MapContainer>
                  ) : (
                    <div className="flex h-full items-center justify-center bg-slate-50 text-sm text-slate-500">
                      Sin ubicacion registrada
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
