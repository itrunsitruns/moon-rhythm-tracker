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

// Returns sidereal sign placements for Sun, Moon and Mercury (with retrograde).
export function getVedicPositions(date = new Date()) {
  const sunLon = Astronomy.SunPosition(date).elon;
  const moonLon = Astronomy.EclipticGeoMoon(date).lon;
  const mercLon = eclLonOfDate(Astronomy.Body.Mercury, date);

  // Retrograde: is Mercury's longitude decreasing over the last 2 days?
  const past = new Date(date.getTime() - 2 * 86400000);
  const mercPast = eclLonOfDate(Astronomy.Body.Mercury, past);
  let delta = mercLon - mercPast;
  if (delta > 180) delta -= 360;
  if (delta < -180) delta += 360;
  const retrograde = delta < 0;

  return {
    sun: siderealSign(sunLon, date),
    moon: siderealSign(moonLon, date),
    mercury: { ...siderealSign(mercLon, date), retrograde },
  };
}
