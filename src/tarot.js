// ══════════════════════════════════
// Daily Tarot — Major Arcana (22 cards)
// ══════════════════════════════════
// A deterministic daily draw: the same card appears all day for a given
// date, with an upright/reversed orientation. Fully offline, no assets
// required (typographic card faces). Bilingual meanings.

export const MAJOR_ARCANA = [
  { n: "0",    glyph: "🌱", zh: "愚者",     en: "The Fool",
    up_zh: "新的開始、純真、冒險、信任直覺", up_en: "New beginnings, innocence, a leap of faith",
    rv_zh: "魯莽、猶豫不前、害怕踏出第一步", rv_en: "Recklessness, hesitation, fear of starting" },
  { n: "I",    glyph: "✨", zh: "魔術師",   en: "The Magician",
    up_zh: "行動力、創造、資源到位、顯化", up_en: "Willpower, creation, manifestation",
    rv_zh: "猶疑、計畫未明、能量未聚焦", rv_en: "Untapped talent, scattered focus" },
  { n: "II",   glyph: "🌙", zh: "女祭司",   en: "The High Priestess",
    up_zh: "直覺、潛意識、神秘、傾聽內在", up_en: "Intuition, mystery, inner voice",
    rv_zh: "忽視直覺、藏著秘密、表裡不一", rv_en: "Ignored intuition, secrets, disconnection" },
  { n: "III",  glyph: "🌺", zh: "皇后",     en: "The Empress",
    up_zh: "豐盛、滋養、母性、創造力", up_en: "Abundance, nurturing, creativity",
    rv_zh: "創意阻塞、過度依賴、忽略自己", rv_en: "Creative block, dependence, self-neglect" },
  { n: "IV",   glyph: "🏛️", zh: "皇帝",     en: "The Emperor",
    up_zh: "穩定、結構、權威、領導", up_en: "Structure, stability, authority",
    rv_zh: "僵化、控制慾、失序", rv_en: "Rigidity, over-control, disorder" },
  { n: "V",    glyph: "📿", zh: "教皇",     en: "The Hierophant",
    up_zh: "傳統、信念、學習、指引", up_en: "Tradition, belief, guidance",
    rv_zh: "挑戰常規、自由思想、打破教條", rv_en: "Rebellion, new approaches, freedom" },
  { n: "VI",   glyph: "💞", zh: "戀人",     en: "The Lovers",
    up_zh: "愛、結合、和諧、重要選擇", up_en: "Love, union, harmony, a choice",
    rv_zh: "失衡、價值衝突、難以抉擇", rv_en: "Imbalance, conflict, misalignment" },
  { n: "VII",  glyph: "🐎", zh: "戰車",     en: "The Chariot",
    up_zh: "意志、前進、掌控、勝利", up_en: "Willpower, drive, victory",
    rv_zh: "失控、方向不明、遇到阻力", rv_en: "Loss of control, lack of direction" },
  { n: "VIII", glyph: "🦁", zh: "力量",     en: "Strength",
    up_zh: "勇氣、溫柔的力量、耐心、自信", up_en: "Courage, gentle strength, patience",
    rv_zh: "自我懷疑、急躁、內在不安", rv_en: "Self-doubt, impatience, low confidence" },
  { n: "IX",   glyph: "🕯️", zh: "隱士",     en: "The Hermit",
    up_zh: "內省、獨處、智慧、尋找答案", up_en: "Introspection, solitude, inner wisdom",
    rv_zh: "孤立、逃避、迷失方向", rv_en: "Isolation, withdrawal, feeling lost" },
  { n: "X",    glyph: "🎡", zh: "命運之輪", en: "Wheel of Fortune",
    up_zh: "轉變、機運、循環、命運轉動", up_en: "Change, cycles, a turning point",
    rv_zh: "抗拒改變、低潮、失控的循環", rv_en: "Resistance to change, bad timing" },
  { n: "XI",   glyph: "⚖️", zh: "正義",     en: "Justice",
    up_zh: "公正、真相、因果、平衡", up_en: "Fairness, truth, cause and effect",
    rv_zh: "不公、逃避責任、偏頗", rv_en: "Unfairness, avoidance, bias" },
  { n: "XII",  glyph: "🙃", zh: "倒吊人",   en: "The Hanged Man",
    up_zh: "暫停、換個角度、臣服、等待", up_en: "Pause, new perspective, surrender",
    rv_zh: "停滯、抗拒、無意義的犧牲", rv_en: "Stalling, resistance, needless sacrifice" },
  { n: "XIII", glyph: "🦋", zh: "死神",     en: "Death",
    up_zh: "結束與重生、轉化、放下", up_en: "Endings, transformation, letting go",
    rv_zh: "抗拒改變、停滯、害怕結束", rv_en: "Resisting change, stagnation, fear" },
  { n: "XIV",  glyph: "🍶", zh: "節制",     en: "Temperance",
    up_zh: "平衡、調和、耐心、中庸", up_en: "Balance, moderation, patience",
    rv_zh: "失衡、極端、缺乏耐心", rv_en: "Imbalance, excess, impatience" },
  { n: "XV",   glyph: "⛓️", zh: "惡魔",     en: "The Devil",
    up_zh: "束縛、慾望、執著、面對陰影", up_en: "Attachment, temptation, shadow",
    rv_zh: "解脫、覺醒、掙脫枷鎖", rv_en: "Release, awareness, breaking free" },
  { n: "XVI",  glyph: "⚡", zh: "高塔",     en: "The Tower",
    up_zh: "突變、崩解、覺醒、真相揭露", up_en: "Sudden change, upheaval, revelation",
    rv_zh: "逃避災難、害怕改變、延遲的崩塌", rv_en: "Averted disaster, fear of change" },
  { n: "XVII", glyph: "⭐", zh: "星星",     en: "The Star",
    up_zh: "希望、療癒、靈感、信心", up_en: "Hope, healing, inspiration, faith",
    rv_zh: "失去信心、絕望、迷失方向", rv_en: "Loss of faith, despair, disconnection" },
  { n: "XVIII",glyph: "🌕", zh: "月亮",     en: "The Moon",
    up_zh: "直覺、夢境、潛意識、迷霧", up_en: "Intuition, dreams, the subconscious",
    rv_zh: "釋放恐懼、真相浮現、走出迷霧", rv_en: "Releasing fear, clarity emerging" },
  { n: "XIX",  glyph: "☀️", zh: "太陽",     en: "The Sun",
    up_zh: "喜悅、成功、活力、光明", up_en: "Joy, success, vitality, clarity",
    rv_zh: "暫時的低潮、延遲的快樂", rv_en: "Temporary dip, delayed joy" },
  { n: "XX",   glyph: "📯", zh: "審判",     en: "Judgement",
    up_zh: "覺醒、召喚、寬恕、重生", up_en: "Awakening, calling, renewal",
    rv_zh: "自我批判、逃避召喚、懷疑", rv_en: "Self-doubt, ignoring the call" },
  { n: "XXI",  glyph: "🌍", zh: "世界",     en: "The World",
    up_zh: "完成、圓滿、整合、成就", up_en: "Completion, wholeness, accomplishment",
    rv_zh: "差臨門一腳、未完成、停滯", rv_en: "Near completion, loose ends, delay" },
];

function hashStr(s) {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function dayKey(date) {
  return `${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()}`;
}

// Deterministic daily draw — same card & orientation all day for a date.
export function getDailyDraw(date = new Date()) {
  const h = hashStr(dayKey(date) + "🌙moonyou");
  const idx = h % MAJOR_ARCANA.length;
  const reversed = (Math.floor(h / MAJOR_ARCANA.length) % 2) === 1;
  return { card: MAJOR_ARCANA[idx], reversed, idx, dayKey: dayKey(date) };
}
