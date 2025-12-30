import Image from "next/image";
import { unstable_noStore as noStore } from "next/cache";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

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
  created_at: string;
};

const currency = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 0,
});

const statusMap: Record<string, { label: string; className: string }> = {
  available: { label: "Disponible", className: "bg-emerald-500/20 text-emerald-200 ring-emerald-400/30" },
  reserved: { label: "Reservado", className: "bg-amber-500/20 text-amber-200 ring-amber-400/30" },
  sold: { label: "Vendido", className: "bg-rose-500/20 text-rose-200 ring-rose-400/30" },
};

const typeMap: Record<string, string> = {
  residential: "Residencial",
  agrarian: "Agricola",
  commercial: "Comercial",
};

export default async function Home() {
  noStore();
  const supabase = createSupabaseServerClient();
  const { data, error } = await supabase
    .from("plots")
    .select("*")
    .order("created_at", { ascending: false });

  const plots = (data ?? []) as Plot[];
  const availableCount = plots.filter((plot) => plot.status === "available").length;
  const avgPrice =
    plots.length > 0
      ? currency.format(
          plots.reduce((total, plot) => total + Number(plot.price_usd), 0) / plots.length
        )
      : "--";
  const totalArea =
    plots.length > 0
      ? `${Math.round(plots.reduce((total, plot) => total + Number(plot.area_m2), 0))} m2`
      : "--";

  return (
    <main className="min-h-screen bg-slate-950 text-slate-50">
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_#0f172a,_#020617_60%)]" />
        <div className="absolute -top-24 right-10 h-64 w-64 rounded-full bg-amber-500/20 blur-3xl" />
        <div className="absolute bottom-0 left-0 h-64 w-64 rounded-full bg-emerald-500/10 blur-3xl" />

        <div className="relative mx-auto flex max-w-6xl flex-col gap-10 px-6 py-16 md:py-24">
          <header className="flex flex-wrap items-center justify-between gap-6">
            <div className="flex items-center gap-3">
              <div className="relative h-11 w-11 overflow-hidden rounded-2xl bg-slate-900 ring-1 ring-slate-800">
                <Image src="/next.svg" alt="Deals2025" fill priority className="object-contain p-2" />
              </div>
              <div>
                <p className="text-sm uppercase tracking-[0.2em] text-slate-400">Deals2025</p>
                <h1 className="text-3xl font-semibold text-white md:text-4xl">
                  Compra y venta de terrenos con datos en tiempo real
                </h1>
              </div>
            </div>
            <div className="flex flex-wrap gap-3 text-sm text-slate-200">
              <div className="rounded-full bg-slate-900/80 px-4 py-2 ring-1 ring-slate-800">
                {availableCount} disponibles
              </div>
              <div className="rounded-full bg-slate-900/80 px-4 py-2 ring-1 ring-slate-800">
                Ticket medio {avgPrice}
              </div>
              <div className="rounded-full bg-slate-900/80 px-4 py-2 ring-1 ring-slate-800">
                {totalArea} en catalogo
              </div>
            </div>
          </header>

          <section className="grid gap-6 md:grid-cols-[1.1fr_0.9fr]">
            <div className="rounded-3xl border border-slate-800 bg-slate-900/50 p-6 shadow-2xl shadow-black/30">
              <p className="text-sm uppercase tracking-[0.3em] text-slate-400">Catalogo</p>
              <h2 className="mt-3 text-2xl font-semibold text-white md:text-3xl">
                Terrenos listos para inversionar y construir
              </h2>
              <p className="mt-4 text-slate-300">
                Conecta tu inventario desde Supabase y ofrece una experiencia clara, visual y confiable
                para compradores y agentes.
              </p>
              <div className="mt-6 grid gap-4 sm:grid-cols-2">
                <div className="rounded-2xl bg-slate-950/60 p-4 ring-1 ring-slate-800">
                  <p className="text-xs uppercase tracking-[0.3em] text-slate-400">Filtros rapidos</p>
                  <p className="mt-2 text-base text-white">Residencial, comercial y agricola</p>
                </div>
                <div className="rounded-2xl bg-slate-950/60 p-4 ring-1 ring-slate-800">
                  <p className="text-xs uppercase tracking-[0.3em] text-slate-400">Datos vivos</p>
                  <p className="mt-2 text-base text-white">Precios y estados sincronizados</p>
                </div>
              </div>
            </div>

            <div className="rounded-3xl border border-slate-800 bg-gradient-to-b from-slate-900/90 to-slate-950/70 p-6">
              <p className="text-sm uppercase tracking-[0.3em] text-slate-400">Metricas</p>
              <div className="mt-6 space-y-5">
                <div className="rounded-2xl bg-slate-900/80 p-4 ring-1 ring-slate-800">
                  <p className="text-sm text-slate-400">Total de terrenos</p>
                  <p className="mt-2 text-2xl font-semibold text-white">{plots.length}</p>
                </div>
                <div className="rounded-2xl bg-slate-900/80 p-4 ring-1 ring-slate-800">
                  <p className="text-sm text-slate-400">Disponibles hoy</p>
                  <p className="mt-2 text-2xl font-semibold text-white">{availableCount}</p>
                </div>
                <div className="rounded-2xl bg-slate-900/80 p-4 ring-1 ring-slate-800">
                  <p className="text-sm text-slate-400">Area total listada</p>
                  <p className="mt-2 text-2xl font-semibold text-white">{totalArea}</p>
                </div>
              </div>
            </div>
          </section>

          <section className="space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h3 className="text-2xl font-semibold text-white">Terrenos destacados</h3>
              {error ? (
                <span className="text-sm text-rose-300">No se pudo cargar el catalogo.</span>
              ) : (
                <span className="text-sm text-slate-400">Datos desde Supabase</span>
              )}
            </div>

            <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
              {plots.map((plot) => {
                const status = statusMap[plot.status] ?? statusMap.available;
                return (
                  <article
                    key={plot.id}
                    className="group rounded-3xl border border-slate-800 bg-slate-900/50 p-4 transition hover:-translate-y-1 hover:border-slate-700"
                  >
                    <div className="relative h-44 overflow-hidden rounded-2xl ring-1 ring-slate-800">
                      {plot.image_url ? (
                        <img src={plot.image_url} alt={plot.title} className="h-full w-full object-cover" />
                      ) : (
                        <div className="h-full w-full bg-gradient-to-br from-slate-800 via-slate-900 to-slate-950" />
                      )}
                      <span
                        className={`absolute left-3 top-3 rounded-full px-3 py-1 text-xs font-medium ring-1 ${status.className}`}
                      >
                        {status.label}
                      </span>
                    </div>
                    <div className="mt-4 flex items-center justify-between">
                      <h4 className="text-lg font-semibold text-white">{plot.title}</h4>
                      <span className="text-sm text-slate-400">{typeMap[plot.type] ?? "Mixto"}</span>
                    </div>
                    <p className="mt-2 text-sm text-slate-400">{plot.location}</p>
                    <p className="mt-3 text-2xl font-semibold text-white">
                      {currency.format(Number(plot.price_usd))}
                    </p>
                    <p className="text-sm text-slate-400">{plot.area_m2} m2</p>
                    {plot.description ? (
                      <p className="mt-3 text-sm text-slate-300">{plot.description}</p>
                    ) : null}
                  </article>
                );
              })}
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}
