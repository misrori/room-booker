import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const ROOMS: Record<string, { name: string; floor: string; capacity: number; calendarId: string }> = {
  diamond: {
    name: "Diamond",
    floor: "1st Floor",
    capacity: 10,
    calendarId: "c_1883su02ru9r2h0vgjk2stdh8ol0i@resource.calendar.google.com",
  },
  gold: {
    name: "Gold",
    floor: "1st Floor",
    capacity: 10,
    calendarId: "c_188d9rsbnccpug21jgafr2prpofsa@resource.calendar.google.com",
  },
  silver: {
    name: "Silver",
    floor: "1st Floor",
    capacity: 10,
    calendarId: "c_188e5b5lgcsfaj62khtf4ruo5q06q@resource.calendar.google.com",
  },
};

async function createGoogleJWT(serviceAccount: any): Promise<string> {
  const now = Math.floor(Date.now() / 1000);
  const header = { alg: "RS256", typ: "JWT" };
  const payload = {
    iss: serviceAccount.client_email,
    scope: "https://www.googleapis.com/auth/calendar",
    aud: "https://oauth2.googleapis.com/token",
    iat: now,
    exp: now + 3600,
    sub: "goldhand@goldhand.space",
  };

  const encode = (obj: any) =>
    btoa(JSON.stringify(obj))
      .replace(/\+/g, "-")
      .replace(/\//g, "_")
      .replace(/=+$/, "");

  const headerB64 = encode(header);
  const payloadB64 = encode(payload);
  const signingInput = `${headerB64}.${payloadB64}`;

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
  attendees?: number;
  checkedIn?: boolean;
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
      title: e.summary || "Untitled Event",
      organizer: e.organizer?.displayName || e.organizer?.email || "Unknown",
      startTime: e.start.dateTime,
      endTime: e.end.dateTime,
      attendees: e.attendees?.length || undefined,
      checkedIn: e.extendedProperties?.private?.checkedIn === "true",
    }));
}

async function createEvent(
  accessToken: string,
  calendarId: string,
  summary: string,
  startTime: string,
  endTime: string,
  organizer: string,
  checkedIn = false
) {
  const res = await fetch(
    `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calendarId)}/events`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        summary,
        description: `Booked by: ${organizer}`,
        start: { dateTime: startTime },
        end: { dateTime: endTime },
        extendedProperties: {
          private: { bookedBy: organizer, checkedIn: checkedIn ? "true" : "false" },
        },
      }),
    }
  );

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Create event failed: ${res.status} ${err}`);
  }
  return await res.json();
}

async function deleteEvent(accessToken: string, calendarId: string, eventId: string) {
  const res = await fetch(
    `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calendarId)}/events/${encodeURIComponent(eventId)}`,
    {
      method: "DELETE",
      headers: { Authorization: `Bearer ${accessToken}` },
    }
  );

  if (!res.ok && res.status !== 404) {
    const err = await res.text();
    throw new Error(`Delete event failed: ${res.status} ${err}`);
  }
}

async function checkInEvent(accessToken: string, calendarId: string, eventId: string) {
  const res = await fetch(
    `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calendarId)}/events/${encodeURIComponent(eventId)}`,
    {
      method: "PATCH",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        extendedProperties: {
          private: { checkedIn: "true" },
        },
      }),
    }
  );

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Check-in failed: ${res.status} ${err}`);
  }
  return await res.json();
}

async function checkOutEvent(accessToken: string, calendarId: string, eventId: string) {
  const now = new Date();
  const res = await fetch(
    `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calendarId)}/events/${encodeURIComponent(eventId)}`,
    {
      method: "PATCH",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        end: { dateTime: now.toISOString() },
      }),
    }
  );

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Check-out failed: ${res.status} ${err}`);
  }
  return await res.json();
}


async function generateTestData(accessToken: string) {
  const now = new Date();
  const roomIds = Object.keys(ROOMS);
  let created = 0;

  for (const roomId of roomIds) {
    const room = ROOMS[roomId];
    // Generate 4-6 events per room with random gaps
    const numEvents = 4 + Math.floor(Math.random() * 3);
    let currentHour = 8 + Math.floor(Math.random() * 2); // Start between 8-9
    let currentMinute = Math.random() > 0.5 ? 0 : 30;

    for (let i = 0; i < numEvents && currentHour < 18; i++) {
      const durationMinutes = [30, 45, 60, 90][Math.floor(Math.random() * 4)];
      const start = new Date(now);
      start.setHours(currentHour, currentMinute, 0, 0);
      const end = new Date(start.getTime() + durationMinutes * 60000);

      if (end.getHours() >= 18) break;

      const names = ["Team Standup", "Design Review", "Sprint Planning", "1:1 Meeting", "Client Call", "Workshop", "Brainstorm", "All Hands", "Tech Talk", "Retrospective"];
      const organizers = ["Alice Smith", "Bob Johnson", "Carol Williams", "David Brown", "Eve Davis"];

      try {
        await createEvent(
          accessToken,
          room.calendarId,
          names[Math.floor(Math.random() * names.length)],
          start.toISOString(),
          end.toISOString(),
          organizers[Math.floor(Math.random() * organizers.length)]
        );
        created++;
      } catch (e) {
        console.error(`Failed to create test event for ${roomId}:`, e);
      }

      // Add gap of 15-60 min
      const gapMinutes = 15 + Math.floor(Math.random() * 46);
      const nextStart = new Date(end.getTime() + gapMinutes * 60000);
      currentHour = nextStart.getHours();
      currentMinute = nextStart.getMinutes();
    }
  }

  return created;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // POST requests: actions (create, delete, check-in, generate test data)
    if (req.method === "POST") {
      const body = await req.json();
      const { action } = body;

      const saJson = Deno.env.get("GOOGLE_SERVICE_ACCOUNT_JSON");
      if (!saJson) throw new Error("GOOGLE_SERVICE_ACCOUNT_JSON secret not configured");
      const serviceAccount = JSON.parse(saJson);
      const accessToken = await getAccessToken(serviceAccount);

      if (action === "generate-test-data") {
        const created = await generateTestData(accessToken);
        return new Response(
          JSON.stringify({ success: true, created }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const room = ROOMS[body.room];
      if (!room) {
        return new Response(JSON.stringify({ error: "Room not found" }), {
          status: 404,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      if (action === "create-adhoc") {
        const { minutes, bookedBy } = body;
        if (!minutes || minutes < 1 || minutes > 120) {
          return new Response(JSON.stringify({ error: "Invalid duration" }), {
            status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }
        const start = new Date();
        const end = new Date(start.getTime() + minutes * 60000);
        const event = await createEvent(
          accessToken,
          room.calendarId,
          "Ad-hoc Meeting",
          start.toISOString(),
          end.toISOString(),
          bookedBy || "Anonymous",
          true // auto check-in for ad-hoc
        );
        return new Response(
          JSON.stringify({ success: true, eventId: event.id }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      if (action === "check-in") {
        const { eventId } = body;
        await checkInEvent(accessToken, room.calendarId, eventId);
        return new Response(
          JSON.stringify({ success: true }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      if (action === "check-out") {
        const { eventId } = body;
        await checkOutEvent(accessToken, room.calendarId, eventId);
        return new Response(
          JSON.stringify({ success: true }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }


      if (action === "delete-event") {
        const { eventId } = body;
        await deleteEvent(accessToken, room.calendarId, eventId);
        return new Response(
          JSON.stringify({ success: true }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      return new Response(JSON.stringify({ error: "Unknown action" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // GET requests: fetch events
    const url = new URL(req.url);
    const roomId = url.searchParams.get("room");

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
    if (!saJson) throw new Error("GOOGLE_SERVICE_ACCOUNT_JSON secret not configured");
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
