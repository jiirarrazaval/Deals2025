import { NextResponse } from "next/server";
import { createSupabaseServerAuthClient } from "@/lib/supabase/server-auth";

function getAdminEmails() {
  return (process.env.ADMIN_EMAILS ?? "")
    .split(",")
    .map((email) => email.trim().toLowerCase())
    .filter(Boolean);
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

  let payload: { address?: string };
  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const address = payload.address?.trim();
  if (!address) {
    return NextResponse.json({ error: "Missing address." }, { status: 400 });
  }

  const url = new URL("https://nominatim.openstreetmap.org/search");
  url.searchParams.set("format", "json");
  url.searchParams.set("limit", "1");
  url.searchParams.set("q", address);

  const response = await fetch(url.toString(), {
    headers: {
      "User-Agent": "Deals2025 Admin Panel",
      "Accept-Language": "es",
    },
  });

  if (!response.ok) {
    return NextResponse.json({ error: "Geocoding failed." }, { status: 502 });
  }

  const results = (await response.json()) as Array<{ lat: string; lon: string }>;

  if (!results.length) {
    return NextResponse.json({ error: "No results found." }, { status: 404 });
  }

  const lat = Number(results[0].lat);
  const lng = Number(results[0].lon);

  if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
    return NextResponse.json({ error: "Invalid coordinates." }, { status: 422 });
  }

  return NextResponse.json({ lat, lng });
}
