"use client";

import { useEffect, useMemo, useState } from "react";
import { MapContainer, Marker, Popup, TileLayer } from "react-leaflet";
import L from "leaflet";
import markerIcon2x from "leaflet/dist/images/marker-icon-2x.png";
import markerIcon from "leaflet/dist/images/marker-icon.png";
import markerShadow from "leaflet/dist/images/marker-shadow.png";

type PlotPoint = {
  id: string;
  title: string;
  location: string;
  lat: number | null;
  lng: number | null;
};

const fallbackCenter: [number, number] = [-33.45, -70.66];

export default function MapPanel() {
  const [plots, setPlots] = useState<PlotPoint[]>([]);
  const [status, setStatus] = useState("Cargando mapa...");

  useEffect(() => {
    L.Icon.Default.mergeOptions({
      iconRetinaUrl: markerIcon2x.src,
      iconUrl: markerIcon.src,
      shadowUrl: markerShadow.src,
    });
  }, []);

  useEffect(() => {
    let active = true;

    async function load() {
      setStatus("Cargando mapa...");
      const response = await fetch("/api/admin/plots");
      const result = await response.json();

      if (!active) {
        return;
      }

      if (!response.ok) {
        setStatus(result?.error ?? "No se pudo cargar el mapa.");
        return;
      }

      setPlots(result?.plots ?? []);
      setStatus("");
    }

    load();

    return () => {
      active = false;
    };
  }, []);

  const points = useMemo(() => {
    return plots.filter((plot) => Number.isFinite(plot.lat) && Number.isFinite(plot.lng));
  }, [plots]);

  const center = useMemo<[number, number]>(() => {
    if (points.length === 0) {
      return fallbackCenter;
    }
    const lat = points.reduce((sum, plot) => sum + Number(plot.lat), 0) / points.length;
    const lng = points.reduce((sum, plot) => sum + Number(plot.lng), 0) / points.length;
    return [lat, lng];
  }, [points]);

  return (
    <section className="rounded-3xl border border-slate-200 bg-white/90 p-6 shadow-xl shadow-slate-200/60">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-semibold">Mapa de terrenos</h2>
          <p className="mt-1 text-sm text-slate-500">
            {points.length} ubicaciones activas con coordenadas.
          </p>
        </div>
        {status ? <span className="text-sm text-amber-700">{status}</span> : null}
      </div>

      <div className="mt-6 h-[520px] overflow-hidden rounded-3xl border border-slate-200">
        <MapContainer center={center} zoom={5} className="h-full w-full">
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          {points.map((plot) => (
            <Marker key={plot.id} position={[Number(plot.lat), Number(plot.lng)]}>
              <Popup>
                <div className="text-sm font-semibold">{plot.title}</div>
                <div className="text-xs text-slate-600">{plot.location}</div>
              </Popup>
            </Marker>
          ))}
        </MapContainer>
      </div>

      {plots.length > points.length ? (
        <p className="mt-4 text-sm text-slate-500">
          Hay {plots.length - points.length} terrenos sin coordenadas. Agrega lat/lng para
          mostrarlos en el mapa.
        </p>
      ) : null}
    </section>
  );
}
