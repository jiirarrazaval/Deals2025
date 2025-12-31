import { NextResponse } from "next/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { createSupabaseServerAuthClient } from "@/lib/supabase/server-auth";

type PlotPayload = {
  title: string;
  location: string;
  price_usd: number;
  area_m2: number;
  status?: string;
  type?: string;
  description?: string;
  image_url?: string;
  lat?: number | null;
  lng?: number | null;
};

function getAdminEmails() {
  return (process.env.ADMIN_EMAILS ?? "")
    .split(",")
    .map((email) => email.trim().toLowerCase())
    .filter(Boolean);
}

function sanitizePlot(input: PlotPayload) {
  const title = String(input.title ?? "").trim();
  const location = String(input.location ?? "").trim();
  const price = Number(input.price_usd);
  const area = Number(input.area_m2);
  const status = String(input.status ?? "available").trim().toLowerCase();
  const type = String(input.type ?? "residential").trim().toLowerCase();
  const description = input.description ? String(input.description).trim() : null;
  const imageUrl = input.image_url ? String(input.image_url).trim() : null;
  const lat = input.lat === undefined ? null : Number(input.lat);
  const lng = input.lng === undefined ? null : Number(input.lng);

  if (!title || !location || !Number.isFinite(price) || !Number.isFinite(area)) {
    return null;
  }

  return {
    title,
    location,
    price_usd: price,
    area_m2: area,
    status,
    type,
    description,
    image_url: imageUrl,
    lat: Number.isFinite(lat) ? lat : null,
    lng: Number.isFinite(lng) ? lng : null,
  };
}

export async function GET() {
  const supabase = createSupabaseServerAuthClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user?.email) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const adminEmails = getAdminEmails();
  if (!adminEmails.includes(user.email.toLowerCase())) {
    return NextResponse.json({ error: "Forbidden." }, { status: 403 });
  }

  const adminClient = createSupabaseAdminClient();
  const { data, error } = await adminClient
    .from("plots")
    .select(
      "id, title, location, price_usd, area_m2, status, type, description, image_url, lat, lng"
    )
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ plots: data ?? [] });
}

export async function POST(request: Request) {
  const supabase = createSupabaseServerAuthClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user?.email) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const adminEmails = getAdminEmails();
  if (!adminEmails.includes(user.email.toLowerCase())) {
    return NextResponse.json({ error: "Forbidden." }, { status: 403 });
  }

  let payload: { plot?: PlotPayload; plots?: PlotPayload[] };
  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const incoming = payload.plots ?? (payload.plot ? [payload.plot] : []);
  if (!incoming.length) {
    return NextResponse.json({ error: "No plots provided." }, { status: 400 });
  }

  const cleaned = incoming.map(sanitizePlot).filter(Boolean) as PlotPayload[];

  if (cleaned.length === 0) {
    return NextResponse.json({ error: "No valid rows found." }, { status: 400 });
  }

  const adminClient = createSupabaseAdminClient();
  const { data, error } = await adminClient.from("plots").insert(cleaned).select("id");

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ count: data?.length ?? cleaned.length });
}

export async function PATCH(request: Request) {
  const supabase = createSupabaseServerAuthClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user?.email) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const adminEmails = getAdminEmails();
  if (!adminEmails.includes(user.email.toLowerCase())) {
    return NextResponse.json({ error: "Forbidden." }, { status: 403 });
  }

  let payload: { id?: string; updates?: Partial<PlotPayload> };
  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  if (!payload.id) {
    return NextResponse.json({ error: "Missing plot id." }, { status: 400 });
  }

  const updates = payload.updates ?? {};
  const sanitized = sanitizePlot({
    title: String(updates.title ?? ""),
    location: String(updates.location ?? ""),
    price_usd: Number(updates.price_usd ?? 0),
    area_m2: Number(updates.area_m2 ?? 0),
    status: updates.status ?? "available",
    type: updates.type ?? "residential",
    description: updates.description ?? null,
    image_url: updates.image_url ?? null,
    lat: updates.lat ?? null,
    lng: updates.lng ?? null,
  });

  if (!sanitized) {
    return NextResponse.json({ error: "Invalid updates." }, { status: 400 });
  }

  const adminClient = createSupabaseAdminClient();
  const { error } = await adminClient.from("plots").update(sanitized).eq("id", payload.id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}

export async function DELETE(request: Request) {
  const supabase = createSupabaseServerAuthClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user?.email) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const adminEmails = getAdminEmails();
  if (!adminEmails.includes(user.email.toLowerCase())) {
    return NextResponse.json({ error: "Forbidden." }, { status: 403 });
  }

  let payload: { id?: string };
  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  if (!payload.id) {
    return NextResponse.json({ error: "Missing plot id." }, { status: 400 });
  }

  const adminClient = createSupabaseAdminClient();
  const { error } = await adminClient.from("plots").delete().eq("id", payload.id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
