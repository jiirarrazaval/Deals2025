import { NextResponse } from "next/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { createSupabaseServerAuthClient } from "@/lib/supabase/server-auth";

function getAdminEmails() {
  return (process.env.ADMIN_EMAILS ?? "")
    .split(",")
    .map((email) => email.trim().toLowerCase())
    .filter(Boolean);
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
    .from("user_listings")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const listings = await Promise.all(
    (data ?? []).map(async (listing) => {
      if (Array.isArray(listing.image_urls) && listing.image_urls.length > 0) {
        return listing;
      }

      const { data: files } = await adminClient.storage
        .from("listing-photos")
        .list(listing.id, { limit: 50 });

      const urls =
        files?.map((file) => {
          const path = `${listing.id}/${file.name}`;
          return adminClient.storage.from("listing-photos").getPublicUrl(path).data.publicUrl;
        }) ?? [];

      return { ...listing, image_urls: urls };
    })
  );

  return NextResponse.json({ listings });
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

  let payload: { id?: string; action?: "approve" | "reject" };
  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  if (!payload.id || !payload.action) {
    return NextResponse.json({ error: "Missing action or id." }, { status: 400 });
  }

  const adminClient = createSupabaseAdminClient();
  const { data: listing, error: fetchError } = await adminClient
    .from("user_listings")
    .select("*")
    .eq("id", payload.id)
    .single();

  if (fetchError || !listing) {
    return NextResponse.json({ error: "Listing not found." }, { status: 404 });
  }

  let imageUrls = Array.isArray(listing.image_urls) ? listing.image_urls : [];

  if (payload.action === "approve") {

    if (imageUrls.length === 0) {
      const { data: files } = await adminClient.storage
        .from("listing-photos")
        .list(listing.id, { limit: 50 });

      imageUrls =
        files?.map((file) => {
          const path = `${listing.id}/${file.name}`;
          return adminClient.storage.from("listing-photos").getPublicUrl(path).data.publicUrl;
        }) ?? [];
    }

    const firstImage = imageUrls[0] ?? null;
    const description = listing.description
      ? `[${listing.deal_type === "rent" ? "Arriendo" : "Venta"}] ${listing.description}`
      : `[${listing.deal_type === "rent" ? "Arriendo" : "Venta"}]`;

    const { error: insertError } = await adminClient.from("plots").insert([
      {
        title: listing.title,
        location: listing.location,
        price_usd: listing.price_usd,
        area_m2: listing.area_m2,
        status: "available",
        type: listing.type,
        description,
        image_url: firstImage,
        image_urls: imageUrls,
        lat: listing.lat ?? null,
        lng: listing.lng ?? null,
      },
    ]);

    if (insertError) {
      return NextResponse.json({ error: insertError.message }, { status: 500 });
    }
  }

  const updatePayload =
    payload.action === "approve"
      ? { status: "approved", image_urls: imageUrls }
      : { status: "rejected" };

  const { error: updateError } = await adminClient
    .from("user_listings")
    .update(updatePayload)
    .eq("id", payload.id);

  if (updateError) {
    return NextResponse.json({ error: updateError.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
