// ── App configuration constants ──

// External booking link for the human consult (Cal.com, Google Form, …).
// Empty string = online booking is not open yet; the app shows a notice instead.
// Never put health data in this URL (query strings end up in logs and history):
// the consult summary is copied to the clipboard and pasted by the user.
export const BOOKING_URL = "";

// Who provides the human consult, shown on the booking card, e.g.
// "IIN 整合營養健康教練（受訓中）". Empty = not shown. Never write "營養師"
// (a licensed title in Taiwan) unless the consultant holds that licence.
export const CONSULTANT_CREDENTIAL = "";
