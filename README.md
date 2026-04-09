# 🌙 Moon Rhythm Tracker / 月亮節奏

Menstrual cycle + intermittent fasting + fertility tracking app with real lunar phases.

## Features

- Real moon phase display (astronomical calculation)
- Cycle-aware fasting recommendations (12h–72h by phase)
- Fertility risk tracking with ovulation estimates
- Google Calendar sync (OAuth 2.0) + .ics download
- Bilingual: 中文 / English
- All data stored in localStorage (no server needed)

## Local Development

```bash
npm install
npm run dev
```

Opens at http://localhost:5173

## Google Calendar Setup (Optional)

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a project (or use existing)
3. Enable **Google Calendar API**
4. Go to **Credentials** → Create **OAuth 2.0 Client ID**
   - Application type: **Web application**
   - Authorized JavaScript origins: `http://localhost:5173` (dev) + your production URL
5. Copy the Client ID
6. Create `.env` file:

```
VITE_GOOGLE_CLIENT_ID=your-client-id.apps.googleusercontent.com
```

Without this, the .ics download still works as a fallback.

## Build

```bash
npm run build
```

Outputs static files to `dist/`.

## Deploy to Vercel

1. Push to GitHub
2. Import repo at [vercel.com/new](https://vercel.com/new)
3. Framework preset: **Vite**
4. Add environment variable: `VITE_GOOGLE_CLIENT_ID`
5. Deploy

## Deploy to Netlify

1. Push to GitHub
2. Import at [app.netlify.com](https://app.netlify.com/)
3. Build command: `npm run build`
4. Publish directory: `dist`
5. Add environment variable: `VITE_GOOGLE_CLIENT_ID`
6. Deploy

## Project Structure

```
src/
  main.jsx            # React entry point
  MoonRhythm.jsx      # Main app component
  useLocalStorage.js   # Persistent state hook
  i18n.jsx            # Bilingual translations + context
  googleCalendar.js   # GCal OAuth + .ics generation
```
