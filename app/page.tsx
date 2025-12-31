import Image from "next/image";
import { unstable_noStore as noStore } from "next/cache";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import PlotGallery from "@/app/components/PlotGallery";
import PublicAuthBar from "@/app/components/PublicAuthBar";
import ListingForm from "@/app/components/ListingForm";

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
  image_urls?: string[] | null;
  created_at: string;
  lat?: number | null;
  lng?: number | null;
};

const currency = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 0,
});

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
      ? Math.round(plots.reduce((total, plot) => total + Number(plot.area_m2), 0))
      : null;

  return (
    <main className="min-h-screen bg-slate-50 text-slate-900">
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_#f8fafc,_#e2e8f0_55%)]" />
        <div className="absolute -top-24 right-10 h-64 w-64 rounded-full bg-amber-300/40 blur-3xl" />
        <div className="absolute bottom-0 left-0 h-64 w-64 rounded-full bg-emerald-300/30 blur-3xl" />

        <div className="relative mx-auto flex max-w-6xl flex-col gap-10 px-6 py-16 md:py-24">
          <header className="flex flex-wrap items-start justify-between gap-6">
            <div className="flex flex-1 items-start gap-4">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-500 via-emerald-400 to-amber-300 text-lg font-semibold text-white shadow-lg shadow-emerald-200/60">
                D25
              </div>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <span className="text-sm uppercase tracking-[0.3em] text-slate-500">Deals2025</span>
                  <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600 ring-1 ring-slate-200">
                    Terrenos
                  </span>
                </div>
                <h1 className="text-3xl font-semibold text-slate-900 md:text-4xl">
                  Compra y venta de terrenos con datos en tiempo real
                </h1>
                <p className="max-w-2xl text-sm text-slate-600">
                  Publica, gestiona y descubre terrenos en venta o arriendo con ubicaciones verificadas.
                </p>
              </div>
            </div>
            <div className="flex w-full flex-col items-start gap-3 text-sm text-slate-600 md:w-auto md:items-end">
              <PublicAuthBar />
              <div className="rounded-full bg-white/80 px-4 py-2 ring-1 ring-slate-200">
                {availableCount} disponibles
              </div>
              <div className="rounded-full bg-white/80 px-4 py-2 ring-1 ring-slate-200">
                Ticket medio {avgPrice}
              </div>
              <div className="rounded-full bg-white/80 px-4 py-2 ring-1 ring-slate-200">
                {totalArea !== null ? (
                  <>
                    {totalArea} m<sup>2</sup> en catalogo
                  </>
                ) : (
                  "--"
                )}
              </div>
            </div>
          </header>

          <section className="grid gap-6 md:grid-cols-[1.1fr_0.9fr]">
            <div className="rounded-3xl border border-slate-200 bg-white/80 p-6 shadow-xl shadow-slate-200/60">
              <p className="text-sm uppercase tracking-[0.3em] text-slate-500">Catalogo</p>
              <h2 className="mt-3 text-2xl font-semibold text-slate-900 md:text-3xl">
                Terrenos listos para inversionar y construir
              </h2>
              <p className="mt-4 text-slate-600">
                Conecta tu inventario desde Supabase y ofrece una experiencia clara, visual y confiable
                para compradores y agentes.
              </p>
              <div className="mt-6 grid gap-4 sm:grid-cols-2">
                <div className="rounded-2xl bg-slate-100/70 p-4 ring-1 ring-slate-200">
                  <p className="text-xs uppercase tracking-[0.3em] text-slate-500">Filtros rapidos</p>
                  <p className="mt-2 text-base text-slate-900">Residencial, comercial y agricola</p>
                </div>
                <div className="rounded-2xl bg-slate-100/70 p-4 ring-1 ring-slate-200">
                  <p className="text-xs uppercase tracking-[0.3em] text-slate-500">Datos vivos</p>
                  <p className="mt-2 text-base text-slate-900">Precios y estados sincronizados</p>
                </div>
              </div>
            </div>

            <div className="rounded-3xl border border-slate-200 bg-gradient-to-b from-white/90 to-slate-100/80 p-6">
              <p className="text-sm uppercase tracking-[0.3em] text-slate-500">Metricas</p>
              <div className="mt-6 space-y-5">
                <div className="rounded-2xl bg-white/80 p-4 ring-1 ring-slate-200">
                  <p className="text-sm text-slate-500">Total de terrenos</p>
                  <p className="mt-2 text-2xl font-semibold text-slate-900">{plots.length}</p>
                </div>
                <div className="rounded-2xl bg-white/80 p-4 ring-1 ring-slate-200">
                  <p className="text-sm text-slate-500">Disponibles hoy</p>
                  <p className="mt-2 text-2xl font-semibold text-slate-900">{availableCount}</p>
                </div>
                <div className="rounded-2xl bg-white/80 p-4 ring-1 ring-slate-200">
                  <p className="text-sm text-slate-500">Area total listada</p>
                  <p className="mt-2 text-2xl font-semibold text-slate-900">
                    {totalArea !== null ? (
                      <>
                        {totalArea} m<sup>2</sup>
                      </>
                    ) : (
                      "--"
                    )}
                  </p>
                </div>
              </div>
            </div>
          </section>

          <section className="space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h3 className="text-2xl font-semibold text-slate-900">Terrenos destacados</h3>
              {error ? (
                <span className="text-sm text-rose-600">No se pudo cargar el catalogo.</span>
              ) : (
                <span className="text-sm text-slate-500">Datos desde Supabase</span>
              )}
            </div>

            <PlotGallery plots={plots} />
          </section>

          <ListingForm />
        </div>
      </div>
    </main>
  );
}
