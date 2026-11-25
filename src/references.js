// ── References for the Moonyou＋ deep cycle guide ──
// Each entry: { title, authors, journal, year, detail?, url }
//   detail = volume(issue):pages, only where verified.
// These support the physiology, fertile-window and temperature statements.
// Food, movement and supplement suggestions are general lifestyle advice.

export const REFERENCES = {
  wilcox1995: {
    title: "Timing of sexual intercourse in relation to ovulation — effects on the probability of conception, survival of the pregnancy, and sex of the baby",
    authors: "Wilcox AJ, Weinberg CR, Baird DD",
    journal: "N Engl J Med",
    year: 1995,
    detail: "333(23):1517–1521",
    url: "https://doi.org/10.1056/NEJM199512073332301",
  },
  wilcox2000: {
    title: "The timing of the “fertile window” in the menstrual cycle: day specific estimates from a prospective study",
    authors: "Wilcox AJ, Dunson D, Baird DD",
    journal: "BMJ",
    year: 2000,
    detail: "321(7271):1259–1262",
    url: "https://doi.org/10.1136/bmj.321.7271.1259",
  },
  bull2019: {
    title: "Real-world menstrual cycle characteristics of more than 600,000 menstrual cycles",
    authors: "Bull JR, et al.",
    journal: "NPJ Digit Med",
    year: 2019,
    detail: "2:83",
    url: "https://doi.org/10.1038/s41746-019-0152-7",
  },
  yeung2010: {
    title: "Longitudinal study of insulin resistance and sex hormones over the menstrual cycle: the BioCycle Study",
    authors: "Yeung EH, et al.",
    journal: "J Clin Endocrinol Metab",
    year: 2010,
    detail: "95(12):5435–5442",
    url: "https://pubmed.ncbi.nlm.nih.gov/20843950/",
  },
  decabo2019: {
    title: "Effects of intermittent fasting on health, aging, and disease",
    authors: "de Cabo R, Mattson MP",
    journal: "N Engl J Med",
    year: 2019,
    detail: "381(26):2541–2551",
    url: "https://doi.org/10.1056/NEJMra1905136",
  },
  hofmeister2016: {
    title: "Premenstrual syndrome and premenstrual dysphoric disorder",
    authors: "Hofmeister S, Bodden S",
    journal: "Am Fam Physician",
    year: 2016,
    detail: "94(3):236–240",
    url: "https://www.aafp.org/pubs/afp/issues/2016/0801/p236.html",
  },
  acog760: {
    title: "Dysmenorrhea and endometriosis in the adolescent (Committee Opinion No. 760)",
    authors: "American College of Obstetricians and Gynecologists",
    journal: "Obstet Gynecol",
    year: 2018,
    url: "https://pubmed.ncbi.nlm.nih.gov/30461694/",
  },
  statpearlsBBT: {
    title: "Physiology, ovulation and basal body temperature",
    authors: "StatPearls Publishing",
    journal: "StatPearls (NCBI Bookshelf)",
    year: 2023,
    url: "https://www.ncbi.nlm.nih.gov/books/NBK546686/",
  },
  clevelandMucus: {
    title: "Cervical mucus",
    authors: "Cleveland Clinic",
    journal: "Cleveland Clinic Health Library",
    year: null,
    url: "https://my.clevelandclinic.org/health/body/21957-cervical-mucus",
  },
  odsIron: {
    title: "Iron: fact sheet for health professionals",
    authors: "NIH Office of Dietary Supplements",
    journal: "ods.od.nih.gov",
    year: null,
    url: "https://ods.od.nih.gov/factsheets/Iron-HealthProfessional/",
  },
  owhPMS: {
    title: "Premenstrual syndrome",
    authors: "US Office on Women's Health",
    journal: "womenshealth.gov",
    year: null,
    url: "https://www.womenshealth.gov/menstrual-cycle/premenstrual-syndrome",
  },
};

// Deep-guide phase key → reference ids, in display order.
export const PHASE_REFS = {
  menstrual: ["acog760", "odsIron", "bull2019"],
  follicular: ["bull2019", "yeung2010", "decabo2019", "clevelandMucus"],
  ovulation: ["wilcox1995", "wilcox2000", "clevelandMucus", "statpearlsBBT", "bull2019"],
  luteal: ["statpearlsBBT", "bull2019", "hofmeister2016", "owhPMS"],
};

// One-line citation: "Authors. Title. Journal. Year;detail."
export function formatReference(ref) {
  const tail = [ref.journal, ref.year ? `${ref.year}${ref.detail ? ";" + ref.detail : ""}` : ref.detail].filter(Boolean).join(". ");
  return `${ref.authors.replace(/\.$/, "")}. ${ref.title}. ${tail}.`;
}
