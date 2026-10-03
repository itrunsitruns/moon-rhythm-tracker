/**
 * Google Calendar integration via OAuth 2.0 + Calendar API v3.
 * Also provides .ics file generation as a fallback.
 */

const SCOPES = "https://www.googleapis.com/auth/calendar.events";
const DISCOVERY_DOC = "https://www.googleapis.com/discovery/v1/apis/calendar/v3/rest";

/** YYYY-MM-DD in local time (toISOString() is UTC and shifts dates a day early east of UTC). */
function localISO(d) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

/** Start of the cycle that contains today (or periodStart itself if it is in the future). */
function currentCycleStart(periodStart, cycleLen) {
  const start = new Date(periodStart + "T00:00:00");
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const diff = Math.round((today - start) / 86400000);
  if (diff > 0) start.setDate(start.getDate() + Math.floor(diff / cycleLen) * cycleLen);
  return start;
}

/**
 * The reminder dates for one cycle. The long-fast window (cycle day 6) is
 * skipped when it falls inside the fertile window, which happens on short cycles.
 */
function cycleEvents(cycleStart, cycleLen, t) {
  const ovDay = cycleLen - 14;
  const at = (offset) => { const d = new Date(cycleStart); d.setDate(d.getDate() + offset); return d; };
  const items = [
    // 1) Fertile window warning: 1 day before it starts (ovDay - 5)
    { date: at(ovDay - 6), summary: t("event.fertile"), desc: t("tip.ovulation"), colorId: "11" }, // tomato
  ];
  // 2) Long-fast window: cycle day 6, only if it is before the fertile window
  if (6 < ovDay - 5) {
    items.push({ date: at(5), summary: t("event.fasting"), desc: t("tip.follicular_gold"), colorId: "5" }); // banana
  }
  // 3) Period coming: 2 days before the next cycle starts
  items.push({ date: at(cycleLen - 2), summary: t("event.period"), desc: t("tip.menstrual"), colorId: "6" }); // tangerine
  return items;
}

let tokenClient = null;
let gapiInited = false;
let gisInited = false;

/** Load the Google API + GIS scripts dynamically */
function loadScript(src) {
  return new Promise((resolve, reject) => {
    if (document.querySelector(`script[src="${src}"]`)) {
      resolve();
      return;
    }
    const s = document.createElement("script");
    s.src = src;
    s.async = true;
    s.defer = true;
    s.onload = resolve;
    s.onerror = reject;
    document.head.appendChild(s);
  });
}

async function initGapi() {
  if (gapiInited) return;
  await loadScript("https://apis.google.com/js/api.js");
  await new Promise((resolve) => window.gapi.load("client", resolve));
  await window.gapi.client.init({
    discoveryDocs: [DISCOVERY_DOC],
  });
  gapiInited = true;
}

async function initGis(clientId) {
  if (gisInited) return;
  await loadScript("https://accounts.google.com/gsi/client");
  return new Promise((resolve) => {
    tokenClient = window.google.accounts.oauth2.initTokenClient({
      client_id: clientId,
      scope: SCOPES,
      callback: () => {}, // will be overridden per-request
    });
    gisInited = true;
    resolve();
  });
}

/** Request an access token (prompts user consent popup) */
function requestAccessToken() {
  return new Promise((resolve, reject) => {
    if (!tokenClient) {
      reject(new Error("GIS not initialized"));
      return;
    }
    tokenClient.callback = (resp) => {
      if (resp.error) reject(resp);
      else resolve(resp);
    };
    tokenClient.error_callback = reject;
    if (window.gapi.client.getToken() === null) {
      tokenClient.requestAccessToken({ prompt: "consent" });
    } else {
      tokenClient.requestAccessToken({ prompt: "" });
    }
  });
}

/**
 * Create a single Google Calendar event.
 * @param {{ summary, description, date, colorId }} evt
 *   date is an ISO string like "2026-04-15"
 */
function nextDay(iso) {
  const d = new Date(iso + "T00:00:00");
  d.setDate(d.getDate() + 1);
  return localISO(d);
}

async function createEvent({ summary, description, date, colorId }) {
  const resp = await window.gapi.client.calendar.events.insert({
    calendarId: "primary",
    resource: {
      summary,
      description,
      start: { date },
      end: { date: nextDay(date) },
      colorId,
      reminders: {
        useDefault: false,
        overrides: [
          { method: "popup", minutes: 480 }, // 8h before (morning of)
        ],
      },
    },
  });
  return resp.result;
}

/**
 * Sync cycle reminder events to Google Calendar.
 * @param {Object} opts
 * @param {string} opts.periodStart ISO date
 * @param {number} opts.cycleLen
 * @param {number} opts.numCycles how many future cycles to create
 * @param {function} opts.t i18n translate function
 * @returns {Promise<number>} number of events created
 */
export async function syncToGoogleCalendar({ periodStart, cycleLen, numCycles = 3, t }) {
  const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;
  if (!clientId) throw new Error("GOOGLE_CLIENT_ID_NOT_SET");

  await initGapi();
  await initGis(clientId);
  await requestAccessToken();

  let count = 0;
  const start = currentCycleStart(periodStart, cycleLen);

  for (let c = 0; c < numCycles; c++) {
    const cycleStart = new Date(start);
    cycleStart.setDate(cycleStart.getDate() + c * cycleLen);
    for (const item of cycleEvents(cycleStart, cycleLen, t)) {
      await createEvent({
        summary: item.summary,
        description: item.desc,
        date: localISO(item.date),
        colorId: item.colorId,
      });
      count++;
    }
  }

  return count;
}

// ── .ics file generation (fallback) ──

function icsDate(d) {
  // YYYYMMDD for all-day events
  const dt = typeof d === "string" ? new Date(d + "T00:00:00") : d;
  const y = dt.getFullYear();
  const m = String(dt.getMonth() + 1).padStart(2, "0");
  const day = String(dt.getDate()).padStart(2, "0");
  return `${y}${m}${day}`;
}

function icsNextDay(d) {
  const dt = typeof d === "string" ? new Date(d + "T00:00:00") : new Date(d);
  dt.setDate(dt.getDate() + 1);
  return icsDate(dt);
}

/**
 * Generate an .ics file content and trigger download.
 */
export function downloadICS({ periodStart, cycleLen, numCycles = 6, t }) {
  const events = [];
  const start = currentCycleStart(periodStart, cycleLen);
  const now = new Date().toISOString().replace(/[-:]/g, "").split(".")[0] + "Z";

  for (let c = 0; c < numCycles; c++) {
    const cycleStart = new Date(start);
    cycleStart.setDate(cycleStart.getDate() + c * cycleLen);
    const items = cycleEvents(cycleStart, cycleLen, t);

    items.forEach((item, i) => {
      const uid = `moon-rhythm-${c}-${i}-${Date.now()}@moonrhythm`;
      events.push(
        `BEGIN:VEVENT\r\nUID:${uid}\r\nDTSTAMP:${now}\r\nDTSTART;VALUE=DATE:${icsDate(item.date)}\r\nDTEND;VALUE=DATE:${icsNextDay(item.date)}\r\nSUMMARY:${item.summary}\r\nDESCRIPTION:${item.desc}\r\nBEGIN:VALARM\r\nTRIGGER:-PT8H\r\nACTION:DISPLAY\r\nDESCRIPTION:${item.summary}\r\nEND:VALARM\r\nEND:VEVENT`
      );
    });
  }

  const ics = `BEGIN:VCALENDAR\r\nVERSION:2.0\r\nPRODID:-//Moon Rhythm Tracker//EN\r\nCALSCALE:GREGORIAN\r\nMETHOD:PUBLISH\r\n${events.join("\r\n")}\r\nEND:VCALENDAR`;

  const blob = new Blob([ics], { type: "text/calendar;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "moon-rhythm-events.ics";
  a.click();
  URL.revokeObjectURL(url);
}
