# 📦 上架 Google Play 指南 — Moonyou

把 Moonyou(網頁 PWA)包裝成 Android app 並上架 Google Play 的完整步驟。
這份文件分成兩半:**我(Claude)已經幫你做好的**,和**你需要自己動手的**(帳號、金流、按送審)。

---

## ✅ 我已經幫你準備好的(都在這個 repo 裡)

- **PNG app 圖示**(Google 的打包工具不吃 SVG):
  `public/icon-192.png`、`public/icon-512.png`、`public/icon-maskable-192.png`、`public/icon-maskable-512.png`
- **更新後的 manifest**(`vite.config.js`):改用 PNG 圖示,補上 `id` / `scope` / `categories` / `lang` 等 Play 需要的欄位
- **隱私政策頁**(Play 強制要求):`public/privacy.html` → 上線後網址是 `https://你的網域/privacy.html`
- **網域驗證檔**:`public/.well-known/assetlinks.json`(裡面的指紋待你打包後填,見下方第 3 步)
- **可直接貼上的商店文案**(本文件最後)

> ⚠️ 這些變更目前在工作分支上。要讓 PWABuilder 抓得到新圖示,**必須先把它們部署到線上**(見第 0 步)。

---

## 你需要先準備

1. **Google Play 開發者帳號** — 一次性 US$25,用你的 Google 帳號註冊:<https://play.google.com/console/signup>(需要身分驗證,約需 1–2 天)
2. **線上的 Moonyou 網址**(目前是 `https://moonyou.vercel.app`)
3. 一台電腦(打包與上傳用)

---

## 步驟

### 0. 先把這個 repo 的變更部署上線
把工作分支合併進會自動部署的分支(Vercel 通常是 `main`),確認以下網址都打得開:
- `https://你的網域/manifest.webmanifest`(icons 應該是 `.png`)
- `https://你的網域/icon-512.png`
- `https://你的網域/privacy.html`
- `https://你的網域/.well-known/assetlinks.json`(此時還是佔位內容,正常)

### 1. 用 PWABuilder 產生 Android 套件(最省力,免裝開發工具)
1. 打開 <https://www.pwabuilder.com>
2. 貼上你的網址 → **Start**。它會檢查 PWA 分數(圖示換成 PNG 後應該會過)
3. 選 **Android** → **Generate Package**
4. **Package ID**:填一個你之後不會改的名字,例如 `app.moonyou.twa`(上架後**不能改**)
   - ⚠️ 這個值要和 `assetlinks.json` 裡的 `package_name` 一致
5. 下載 zip,裡面有:
   - `app-release-bundle.aab`(上傳到 Play 的檔案)
   - `signing.keystore` + 一個記著密碼的檔(**請務必妥善保存、備份**,弄丟就無法再更新 app)
   - `assetlinks.json`(裡面有正確的 SHA-256 指紋)

> 替代方案:若你想自己用指令包,可用 Google 的 **Bubblewrap** CLI(需要 Node + JDK 17 + Android SDK)。PWABuilder 是同一件事的免安裝版。

### 2. 在 Play Console 建立 app 並上傳
1. Play Console → **建立應用程式** → 填名稱、語言、免費/付費(**見下方「定價」,付費要一開始就選**)
2. 左側 **正式版 → 建立新版本** → 上傳 `.aab`
3. Play 會幫你做 **App Signing**(應用程式簽署)。進入 **應用程式完整性 / App signing**,複製 **App signing key 的 SHA-256 指紋**

### 3. 填好 assetlinks.json 並重新部署(關鍵步驟)
網域驗證需要**兩個**指紋:
- 你的 **上傳金鑰** 指紋(在 PWABuilder 下載的 `assetlinks.json` 裡)
- Play 的 **App signing 金鑰** 指紋(第 2 步複製的)

編輯本 repo 的 `public/.well-known/assetlinks.json`:
```json
[{
  "relation": ["delegate_permission/common.handle_all_urls"],
  "target": {
    "namespace": "android_app",
    "package_name": "app.moonyou.twa",
    "sha256_cert_fingerprints": [
      "上傳金鑰的 SHA256",
      "Play App Signing 的 SHA256"
    ]
  }
}]
```
重新部署。確認 `https://你的網域/.well-known/assetlinks.json` 顯示正確內容。
（沒填對的話,安裝後 app 上方會出現網址列——那就是驗證失敗的徵兆。）

### 4. 填 Play Console 的必填項目
- **商店資訊**:名稱、簡短說明、完整說明(用本文件最後的文案)
- **圖示**:512×512 PNG → 用 `public/icon-512.png`
- **主要圖片(Feature graphic)**:1024×500 PNG(需另外做一張橫幅,可跟我說我幫你產)
- **手機螢幕截圖**:至少 2 張(建議 4–8 張,從手機開 app 截圖即可)
- **隱私權政策**:`https://你的網域/privacy.html`
- **Data safety(資料安全)**:見下方
- **內容分級**:填問卷(誠實作答;含生育/性健康主題,分級可能落在青少年)
- **目標對象**:選成人(非兒童導向)

### 5. 送出審核
填完所有紅點項目後送審。Google 審核通常 **幾小時到幾天**。通過後就會上架。

---

## 💰 定價(已決定)

> **已決定:付費 app,US$1.99,沒有免費版。** 延伸服務(真人營養師諮詢、塔羅等)之後用 Google Play 內購當加購。

> **Google Play 規則:免費 app 上架後不能改成付費。** 付費必須在建立 app 時就選「付費」,所以建立應用程式那一步要選「付費」並填 US$1.99。

> 一句提醒:US$1.99 經 Google 抽成(15–30%)後,你實拿約 US$1.4–1.7。利潤主要靠延伸加購。

備查——兩種收費方式:
- **付費 app(本案採用)**:使用者下載前先付一次 US$1.99(Google 抽 15–30%)。最簡單。
- **免費 + 應用程式內購買(IAP)**:先免費裝,內購解鎖。需用 **Google Play 帳款服務**(政策上,Android app 內賣數位內容**不能**改用 Stripe 等外部金流)。

⚠️ **和 Stripe 付費牆的關係**:Stripe 那條路是給**網頁版**用的。同一套網頁包進 Android app 後,若裡面出現 Stripe 付費牆會**違反 Play 政策**。建議的乾淨切法:
- **Android(Play)**:付費 app,用 Google 金流;app 內完全解鎖
- **網頁版**:Stripe 付費牆
- 讓 app 偵測「我是不是在 Play 版裡」來決定要不要顯示 Stripe 付費牆(這部分我可以幫你實作)

---

## 🔒 Data Safety 表單怎麼填(很簡單)

Moonyou 不收集、不上傳任何資料,所以:
- **Does your app collect or share any user data?** → **No**
- 資料儲存:on-device only(localStorage)
- 若被問到健康資料:說明資料僅儲存在裝置本機、不傳輸
- 唯一例外是你若用「行事曆匯出」,那是使用者主動觸發、由 Google 處理,Moonyou 不儲存

（內容分級問卷請誠實作答。Moonyou 是健康/參考類,沒有暴力或不當內容,但因涉及月經/生育主題,分級系統可能給到青少年級,這是正常的。）

---

## 📝 可直接貼上的商店文案

### App 名稱 / Title（≤ 30 字元）
```
Moonyou — Moon Rhythm
```

### 簡短說明 / Short description（≤ 80 字元）
中文:
```
整合月經週期、間歇斷食與受孕／安全期的個人追蹤,對齊真實月相。
```
English:
```
Cycle, fasting & fertility tracker that syncs with the real lunar phases.
```

### 完整說明 / Full description（≤ 4000 字元）
```
🌙 Moonyou — 你的身體,有自己的月亮。

Moonyou 是一款整合月經週期、間歇性斷食、與受孕／安全期追蹤的個人化健康工具。不只是記錄經期——它會根據你的週期階段,動態調整斷食建議、標示安全與危險期,並顯示真實月相,讓你一眼掌握身體的節奏。

核心功能：
• 週期追蹤 — 輸入月經第一天,自動計算排卵日、危險期、安全期
• 智慧斷食建議 — 經期輕斷食(12–14h)、濾泡期黃金窗口(可達 72h)、排卵期停長斷食、黃體期溫和斷食
• 真實月相 — 日曆上的月亮對應天空中真正的月相,觀察身體週期與自然的同步
• 目標自訂 — 斷食優化、避孕、備孕三種目標,可複選組合,介面自動調整
• 斷食記錄與統計 — 每日記錄斷食時數,查看週／月統計、完成率、趨勢圖
• BBT 與分泌物追蹤 — 輸入基礎體溫與分泌物狀態,動態修正排卵日預測
• 行事曆匯出 — 一鍵匯出 .ics,加入 Google 或 Apple 行事曆
• 中／英雙語 — 右上角一鍵切換
• 離線可用 — 所有資料存在你的裝置上,不需要帳號

🔒 隱私承諾:你的所有資料 100% 儲存在裝置本機,不需要註冊,不收集、不上傳任何個人資料。你的身體數據只屬於你。

本工具僅供個人健康參考,不構成醫療建議。如有健康疑慮,請諮詢專業醫療人員。

—

🌙 Moonyou — Your body has its own moon.

Moonyou is a personalized health tool that brings together menstrual cycle tracking, intermittent fasting guidance, and fertility/safe-period awareness in one beautiful interface. It's not just a period tracker: it dynamically adjusts fasting recommendations to your cycle phase, marks fertile and safe windows, and shows real lunar phases so you can see your body's rhythm alongside nature's.

Key features:
• Cycle tracking — enter your period start; ovulation, fertile window & safe days are calculated automatically
• Smart fasting advice — light fasting during menstruation (12–14h), golden window in the follicular phase (up to 72h), pause long fasts at ovulation, gentle fasting in the luteal phase
• Real moon phases — calendar emojis reflect the actual moon in the sky
• Flexible goals — Fasting, Contraception, or Conception, combinable; the interface adapts
• Fasting log & stats — daily hours, weekly/monthly stats, completion rate, trends
• BBT & cervical mucus tracking — refine ovulation predictions
• Calendar export — one-tap .ics to Google or Apple Calendar
• Bilingual (中/EN) — switch with one tap
• Works offline — all data stays on your device, no account needed

🔒 Privacy promise: 100% of your data is stored locally on your device. No registration, no collection, nothing uploaded. Your body data belongs to you and only you.

This app is for personal reference only and does not constitute medical advice. Consult a healthcare professional for any health concerns.
```

### 其他欄位
- **分類 / Category**:健康與健身 (Health & Fitness)
- **隱私權政策網址**:`https://你的網域/privacy.html`
- **聯絡 email**:dontcallmekelly@gmail.com

---

## 需要我幫忙時
- 產生 1024×500 的 Feature graphic 橫幅
- 幫網頁版接 Stripe 付費牆,並讓 Play 版自動跳過付費牆
- 產生更多尺寸的截圖外框 / 美化截圖
跟我說即可。
