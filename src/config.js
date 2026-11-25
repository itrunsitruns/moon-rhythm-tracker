// ── App configuration constants ──

// External booking link for the human consult (Cal.com, Google Form, …).
// Empty string = online booking is not open yet; the app shows a notice instead.
// Never put health data in this URL (query strings end up in logs and history):
// the consult summary is copied to the clipboard and pasted by the user.
export const BOOKING_URL = "";
