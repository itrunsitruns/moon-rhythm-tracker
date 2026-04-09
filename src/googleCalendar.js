/**
 * Google Calendar integration via OAuth 2.0 + Calendar API v3.
 * Also provides .ics file generation as a fallback.
 */

const SCOPES = "https://www.googleapis.com/auth/calendar.events";
const DISCOVERY_DOC = "https://www.googleapis.com/discovery/v1/apis/calendar/v3/rest";

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
async function createEvent({ summary, description, date, colorId }) {
  const resp = await window.gapi.client.calendar.events.insert({
    calendarId: "primary",
    resource: {
      summary,
      description,
      start: { date },
      end: { date },
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
  const start = new Date(periodStart + "T00:00:00");

  for (let c = 0; c < numCycles; c++) {
    const cycleStart = new Date(start);
    cycleStart.setDate(cycleStart.getDate() + c * cycleLen);
    const ovDay = cycleLen - 14;

    // 1) Fertile window warning: 1 day before danger starts (ovDay - 6)
    const fertileWarnDate = new Date(cycleStart);
    fertileWarnDate.setDate(fertileWarnDate.getDate() + ovDay - 6);
    await createEvent({
      summary: t("event.fertile"),
      description: t("tip.ovulation"),
      date: fertileWarnDate.toISOString().split("T")[0],
      colorId: "11", // tomato
    });
    count++;

    // 2) Golden fasting window: cycle day 6
    const fastingDate = new Date(cycleStart);
    fastingDate.setDate(fastingDate.getDate() + 5); // day 6
    await createEvent({
      summary: t("event.fasting"),
      description: t("tip.follicular_gold"),
      date: fastingDate.toISOString().split("T")[0],
      colorId: "5", // banana
    });
    count++;

    // 3) Period coming: 2 days before next cycle starts
    const periodWarnDate = new Date(cycleStart);
    periodWarnDate.setDate(periodWarnDate.getDate() + cycleLen - 2);
    await createEvent({
      summary: t("event.period"),
      description: t("tip.menstrual"),
      date: periodWarnDate.toISOString().split("T")[0],
      colorId: "6", // tangerine
    });
    count++;
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
  const start = new Date(periodStart + "T00:00:00");
  const now = new Date().toISOString().replace(/[-:]/g, "").split(".")[0] + "Z";

  for (let c = 0; c < numCycles; c++) {
    const cycleStart = new Date(start);
    cycleStart.setDate(cycleStart.getDate() + c * cycleLen);
    const ovDay = cycleLen - 14;

    const fertileWarnDate = new Date(cycleStart);
    fertileWarnDate.setDate(fertileWarnDate.getDate() + ovDay - 6);

    const fastingDate = new Date(cycleStart);
    fastingDate.setDate(fastingDate.getDate() + 5);

    const periodWarnDate = new Date(cycleStart);
    periodWarnDate.setDate(periodWarnDate.getDate() + cycleLen - 2);

    const items = [
      { date: fertileWarnDate, summary: t("event.fertile"), desc: t("tip.ovulation") },
      { date: fastingDate, summary: t("event.fasting"), desc: t("tip.follicular_gold") },
      { date: periodWarnDate, summary: t("event.period"), desc: t("tip.menstrual") },
    ];

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
