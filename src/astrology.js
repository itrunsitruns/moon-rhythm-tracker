// ══════════════════════════════════
// Vedic / sidereal astrology — Sun, Moon, Mercury
// ══════════════════════════════════
// Uses the sidereal zodiac (aligned with the actual star constellations),
// as in Vedic astrology, by subtracting the Lahiri ayanamsa from the
// tropical of-date ecliptic longitude. Fully offline (astronomy-engine),
// no backend, no network.
import * as Astronomy from "astronomy-engine";

export const SIGN_KEYS = [
  "aries", "taurus", "gemini", "cancer", "leo", "virgo",
  "libra", "scorpio", "sagittarius", "capricorn", "aquarius", "pisces",
];
export const SIGN_GLYPHS = ["♈", "♉", "♊", "♋", "♌", "♍", "♎", "♏", "♐", "♑", "♒", "♓"];

// Lahiri ayanamsa — linear approximation (≈24.2° in 2026), accurate to a
// few arcminutes across decades, which is plenty for sign placement.
function lahiriAyanamsa(date) {
  const y = date.getUTCFullYear() + date.getUTCMonth() / 12;
  return 23.85 + (y - 2000) * 50.29 / 3600;
}

// Geocentric ecliptic longitude of date (true ecliptic), for planets.
function eclLonOfDate(body, date) {
  const vec = Astronomy.GeoVector(body, date, true);
  const rot = Astronomy.Rotation_EQJ_ECT(date);
  const ev = Astronomy.RotateVector(rot, vec);
  const sph = Astronomy.SphereFromVector(ev);
  return ((sph.lon % 360) + 360) % 360;
}

function siderealSign(tropLon, date) {
  const sid = (((tropLon - lahiriAyanamsa(date)) % 360) + 360) % 360;
  const idx = Math.floor(sid / 30);
  return { idx, key: SIGN_KEYS[idx], glyph: SIGN_GLYPHS[idx], deg: sid % 30 };
}

// Returns sidereal sign placements for Sun, Moon and Mercury (with motion).
export function getVedicPositions(date = new Date()) {
  const sunLon = Astronomy.SunPosition(date).elon;
  const moonLon = Astronomy.EclipticGeoMoon(date).lon;
  const mercLon = eclLonOfDate(Astronomy.Body.Mercury, date);

  // Mercury motion: use a centered (yesterday→tomorrow) velocity so we don't
  // lag the station by a couple of days. Near zero velocity = stationary (留),
  // the turning point; we also note which way it's about to turn.
  const DAY = 86400000;
  const STATION = 0.10; // °/2-day band that counts as stationary
  const wrap = (x) => { let v = x; if (v > 180) v -= 360; if (v < -180) v += 360; return v; };
  const before = eclLonOfDate(Astronomy.Body.Mercury, new Date(date.getTime() - DAY));
  const after = eclLonOfDate(Astronomy.Body.Mercury, new Date(date.getTime() + DAY));
  const vel = wrap(after - before);

  let motion = "direct", turning = null;
  if (vel < -STATION) motion = "retro";
  else if (vel <= STATION) {
    motion = "station";
    const ahead = eclLonOfDate(Astronomy.Body.Mercury, new Date(date.getTime() + 2 * DAY));
    turning = wrap(ahead - mercLon) < 0 ? "retro" : "direct";
  }

  return {
    sun: siderealSign(sunLon, date),
    moon: siderealSign(moonLon, date),
    mercury: { ...siderealSign(mercLon, date), motion, turning, retrograde: motion === "retro" },
  };
}
