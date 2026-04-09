# 🌙 月亮節奏 Moon Rhythm

## 你的身體，有自己的月亮。
## Your body has its own moon.

---

### 中文介紹

**月亮節奏**是一款整合月經週期、間歇性斷食、與安全期/受孕期追蹤的個人化健康工具。

不只是記錄經期——它根據你的週期階段，動態調整斷食建議、標示安全與危險期、顯示真實月相，讓你一眼掌握身體節奏。

**核心功能：**

- **週期追蹤**：輸入月經第一天，自動計算排卵日、危險期、安全期
- **斷食建議**：依週期階段智慧建議——經期輕斷食（12-14h）、濾泡期黃金窗口（可達 72h）、排卵期停長斷食、黃體期溫和斷食
- **真實月相顯示**：日曆上的月亮 emoji 對應天空中真正的月相（🌑🌒🌓🌔🌕🌖🌗🌘），觀察身體週期與自然月亮的同步
- **目標自訂**：支援斷食優化、避孕、備孕三種目標，可複選（如斷食＋避孕），介面自動調整顯示內容
- **斷食記錄**：每日記錄實際斷食時數，查看本週/本月統計、完成率、趨勢圖
- **BBT 與分泌物追蹤**：輸入基礎體溫和分泌物狀態，動態修正排卵日預測
- **行事曆匯出**：一鍵匯出 .ics 檔案，將危險期提醒、斷食窗口、經期預告加入 Google Calendar 或 Apple 行事曆
- **中/英文切換**：完整雙語介面，右上角一鍵切換
- **離線可用**：所有資料存在你的裝置上，不需要帳號，不上傳任何個人資訊
- **月亮圓盤視覺化**：儀表板上的圓盤一眼看完整個週期的階段分佈

**隱私承諾：** 所有資料 100% 儲存在你的裝置上（localStorage），不需要註冊，不收集任何個人數據。你的身體數據只屬於你。

---

### English Description

**Moon Rhythm** is a personalized health tool that integrates menstrual cycle tracking, intermittent fasting guidance, and fertility/safe period awareness — all in one beautiful interface.

It's not just a period tracker. It dynamically adjusts fasting recommendations based on your cycle phase, marks fertile and safe windows, and displays real lunar phases so you can see your body's rhythm alongside nature's.

**Key Features:**

- **Cycle Tracking**: Enter your period start date; ovulation, fertile window, and safe days are calculated automatically
- **Smart Fasting Advice**: Phase-based recommendations — light fasting during menstruation (12-14h), golden fasting window during follicular phase (up to 72h), pause long fasts during ovulation, gentle fasting during luteal phase
- **Real Moon Phases**: Calendar emojis reflect the actual moon in the sky (🌑🌒🌓🌔🌕🌖🌗🌘) — observe how your cycle syncs with the lunar cycle
- **Flexible Goals**: Choose from Fasting Optimization, Contraception, or Conception — or combine them (e.g., Fasting + Contraception). The interface adapts automatically
- **Fasting Log**: Record actual fasting hours daily, view weekly/monthly stats, completion rate, and trend charts
- **BBT & Cervical Mucus Tracking**: Input basal body temperature and mucus observations to dynamically refine ovulation predictions
- **Calendar Export**: One-tap .ics export — add fertile window alerts, fasting reminders, and period predictions to Google Calendar or Apple Calendar
- **Bilingual (中/EN)**: Full Chinese and English interface, switchable with one tap
- **Works Offline**: All data stays on your device. No account needed. No personal information uploaded. Ever.
- **Moon Disc Visualization**: The dashboard's circular disc shows your entire cycle at a glance

**Privacy Promise:** 100% of your data is stored locally on your device (localStorage). No registration, no data collection. Your body data belongs to you and only you.

---

### 📱 如何加到手機桌面 / How to Add to Your Home Screen

**iPhone (Safari)：**
1. 用 Safari 開啟 https://moon-rhythm-tracker.vercel.app
2. 點底部的「分享」按鈕（方框加向上箭頭 ⬆️）
3. 往下滑，點「加入主畫面」
4. 點「新增」——完成！圖示會出現在桌面上，打開就像 app 一樣

**Android (Chrome)：**
1. 用 Chrome 開啟 https://moon-rhythm-tracker.vercel.app
2. 點右上角三個點 ⋮
3. 點「加到主畫面」或「安裝應用程式」
4. 確認——完成！

**重要提醒：** iPhone 請務必用 Safari 開啟，其他瀏覽器（Chrome、LINE 內建瀏覽器）無法使用「加入主畫面」功能。

---

### 🔗 立即使用 / Try It Now

**https://moon-rhythm-tracker.vercel.app**

免費 · 免註冊 · 免下載 · 你的資料只在你的手機上
Free · No sign-up · No download · Your data stays on your device

---

Built with 🌙 by Ööna & Claude — from concept to launch in under 3 hours.
從構想到上線不到 3 小時，由 Ööna 與 Claude 共同打造。

---

## Development

```bash
npm install
npm run dev     # http://localhost:5173
npm run build   # outputs to dist/
```

### Google Calendar Setup (Optional)

1. [Google Cloud Console](https://console.cloud.google.com/) → Create project → Enable **Google Calendar API**
2. Credentials → OAuth 2.0 Client ID (Web application)
3. Add authorized origins: `http://localhost:5173` + production URL
4. Create `.env`:
```
VITE_GOOGLE_CLIENT_ID=your-client-id.apps.googleusercontent.com
```

Without this, the .ics download still works as a fallback.

### Deploy

**Vercel:** Import repo → Framework: Vite → Add `VITE_GOOGLE_CLIENT_ID` env var → Deploy

**Netlify:** Import repo → Build: `npm run build` → Publish: `dist` → Deploy

### Project Structure

```
src/
  main.jsx             # React entry + LangProvider + InstallPrompt
  MoonRhythm.jsx       # Main app (dashboard, calendar, settings)
  useLocalStorage.js   # Persistent state hook
  i18n.jsx             # Bilingual translations + context
  googleCalendar.js    # GCal OAuth + .ics generation
  InstallPrompt.jsx    # PWA install banner for mobile
```
