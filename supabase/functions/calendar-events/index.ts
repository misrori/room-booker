import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// Room definitions
const ROOMS: Record<string, { name: string; floor: string; capacity: number; calendarId: string }> = {
  diamond: {
    name: "Diamond",
    floor: "1. emelet",
    capacity: 10,
    calendarId: "c_1883su02ru9r2h0vgjk2stdh8ol0i@resource.calendar.google.com",
  },
  gold: {
    name: "Gold",
    floor: "1. emelet",
    capacity: 10,
    calendarId: "c_188d9rsbnccpug21jgafr2prpofsa@resource.calendar.google.com",
  },
  silver: {
    name: "Silver",
    floor: "1. emelet",
    capacity: 10,
    calendarId: "c_188e5b5lgcsfaj62khtf4ruo5q06q@resource.calendar.google.com",
  },
};

// Create JWT for Google API auth
async function createGoogleJWT(serviceAccount: any): Promise<string> {
  const now = Math.floor(Date.now() / 1000);
  const header = { alg: "RS256", typ: "JWT" };
  const payload = {
    iss: serviceAccount.client_email,
    scope: "https://www.googleapis.com/auth/calendar",
    aud: "https://oauth2.googleapis.com/token",
    iat: now,
    exp: now + 3600,
    sub: serviceAccount.client_email,
  };

  const encode = (obj: any) =>
    btoa(JSON.stringify(obj))
      .replace(/\+/g, "-")
      .replace(/\//g, "_")
      .replace(/=+$/, "");

  const headerB64 = encode(header);
  const payloadB64 = encode(payload);
  const signingInput = `${headerB64}.${payloadB64}`;

  // Import the private key
  const pemContent = serviceAccount.private_key
    .replace("-----BEGIN PRIVATE KEY-----", "")
    .replace("-----END PRIVATE KEY-----", "")
    .replace(/\n/g, "");
  const binaryKey = Uint8Array.from(atob(pemContent), (c) => c.charCodeAt(0));

  const cryptoKey = await crypto.subtle.importKey(
    "pkcs8",
    binaryKey,
    { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" },
    false,
    ["sign"]
  );

  const signature = await crypto.subtle.sign(
    "RSASSA-PKCS1-v1_5",
    cryptoKey,
    new TextEncoder().encode(signingInput)
  );

  const signatureB64 = btoa(String.fromCharCode(...new Uint8Array(signature)))
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");

  return `${signingInput}.${signatureB64}`;
}

async function getAccessToken(serviceAccount: any): Promise<string> {
  const jwt = await createGoogleJWT(serviceAccount);
  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: `grant_type=urn%3Aietf%3Aparams%3Aoauth%3Agrant-type%3Ajwt-bearer&assertion=${jwt}`,
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Token exchange failed: ${err}`);
  }

  const data = await res.json();
  return data.access_token;
}

interface CalendarEvent {
  id: string;
  title: string;
  organizer: string;
  startTime: string;
  endTime: string;
}

async function fetchCalendarEvents(
  accessToken: string,
  calendarId: string
): Promise<CalendarEvent[]> {
  const now = new Date();
  const startOfDay = new Date(now);
  startOfDay.setHours(0, 0, 0, 0);
  const endOfDay = new Date(now);
  endOfDay.setHours(23, 59, 59, 999);

  const params = new URLSearchParams({
    timeMin: startOfDay.toISOString(),
    timeMax: endOfDay.toISOString(),
    singleEvents: "true",
    orderBy: "startTime",
  });

  const res = await fetch(
    `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calendarId)}/events?${params}`,
    { headers: { Authorization: `Bearer ${accessToken}` } }
  );

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Calendar API error: ${res.status} ${err}`);
  }

  const data = await res.json();
  return (data.items || [])
    .filter((e: any) => e.status !== "cancelled" && e.start?.dateTime)
    .map((e: any) => ({
      id: e.id,
      title: e.summary || "Névtelen esemény",
      organizer: e.organizer?.displayName || e.organizer?.email || "Ismeretlen",
      startTime: e.start.dateTime,
      endTime: e.end.dateTime,
    }));
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const roomId = url.searchParams.get("room");

    // If no room specified, return all rooms metadata
    if (!roomId) {
      const rooms = Object.entries(ROOMS).map(([id, r]) => ({
        id,
        name: r.name,
        floor: r.floor,
        capacity: r.capacity,
      }));
      return new Response(JSON.stringify({ rooms }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const room = ROOMS[roomId];
    if (!room) {
      return new Response(JSON.stringify({ error: "Room not found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const saJson = Deno.env.get("GOOGLE_SERVICE_ACCOUNT_JSON");
    if (!saJson) {
      throw new Error("GOOGLE_SERVICE_ACCOUNT_JSON secret not configured");
    }

    const serviceAccount = JSON.parse(saJson);
    const accessToken = await getAccessToken(serviceAccount);
    const events = await fetchCalendarEvents(accessToken, room.calendarId);

    return new Response(
      JSON.stringify({
        room: { id: roomId, name: room.name, floor: room.floor, capacity: room.capacity },
        events,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
