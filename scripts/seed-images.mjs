// Images de test pour la base LOCALE : dessine une illustration par produit et une scène par catégorie, la dépose dans
// le Storage et l'ajoute au produit. À relancer après `npm run db:reset` (le seed SQL ne
// peut pas contenir de fichiers).
//
//   npm run db:seed-images
//
// Refuse de tourner contre autre chose qu'un Supabase local : ces images sont des maquettes,
// jamais de vraies photos à mettre en ligne.

import { createClient } from "@supabase/supabase-js";
import { createHash } from "node:crypto";
import sharp from "sharp";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const secretKey = process.env.SUPABASE_SECRET_KEY;
if (!url || !secretKey) {
  console.error("NEXT_PUBLIC_SUPABASE_URL et SUPABASE_SECRET_KEY manquent : voir .env.local");
  process.exit(1);
}
if (!/^https?:\/\/(127\.0\.0\.1|localhost)[:/]/.test(url)) {
  console.error(`Refusé : ${url} n'est pas un Supabase local. Ce script ne sert qu'aux données de test.`);
  process.exit(1);
}

const supabase = createClient(url, secretKey, { auth: { persistSession: false } });

// Empreinte du contenu dans le nom : un dessin modifié change d'URL, donc le cache d'images
// de Next (qui garde plusieurs heures une URL déjà vue) ne ressert jamais l'ancienne version.
const fingerprint = (buffer) => createHash("sha1").update(buffer).digest("hex").slice(0, 8);

// --- Dessins ---------------------------------------------------------------------------
// Chaque dessin tient dans un carré de 1000 × 1000, posé sur y = 880.

const INK = "#111111";
const GOLD = "#E2B13C";

/** Étiquette blanche avec 1 à 3 lignes de texte. */
function label(x, y, w, h, lines, { fill = "#FFFFFF", color = INK, size = 34 } = {}) {
  const step = size * 1.35;
  const top = y + h / 2 - ((lines.length - 1) * step) / 2 + size * 0.34;
  return (
    `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="14" fill="${fill}" opacity="0.96"/>` +
    lines
      .map(
        (line, i) =>
          `<text x="${x + w / 2}" y="${top + i * step}" text-anchor="middle" font-family="Helvetica, Arial, sans-serif" font-weight="${i === 0 ? 700 : 400}" font-size="${i === 0 ? size : size * 0.78}" fill="${color}">${line}</text>`,
      )
      .join("")
  );
}

const shadow = (rx = 210) => `<ellipse cx="500" cy="885" rx="${rx}" ry="26" fill="#000" opacity="0.16"/>`;

const DRAWINGS = {
  serum: () =>
    shadow() +
    `<rect x="380" y="430" width="240" height="450" rx="46" fill="url(#amber)"/>` +
    `<rect x="396" y="450" width="26" height="400" rx="13" fill="#fff" opacity="0.25"/>` +
    label(410, 560, 180, 220, ["SÉRUM", "Vitamine C", "30 ml"]) +
    `<rect x="445" y="345" width="110" height="100" rx="16" fill="${INK}"/>` +
    `<rect x="468" y="190" width="64" height="170" rx="32" fill="${INK}"/>`,

  cream: () =>
    shadow(260) +
    `<rect x="290" y="560" width="420" height="320" rx="56" fill="#FBF8F3"/>` +
    `<rect x="290" y="430" width="420" height="150" rx="40" fill="${GOLD}"/>` +
    `<rect x="310" y="445" width="30" height="120" rx="15" fill="#fff" opacity="0.35"/>` +
    label(340, 650, 320, 160, ["CRÈME", "Hydratante", "50 ml"], { fill: "#F1E7D8" }),

  perfume: () =>
    shadow(230) +
    `<rect x="330" y="470" width="340" height="410" rx="34" fill="url(#rose)"/>` +
    `<rect x="348" y="490" width="26" height="370" rx="13" fill="#fff" opacity="0.3"/>` +
    label(390, 600, 220, 170, ["EAU DE", "PARFUM", "100 ml"], { size: 32 }) +
    `<rect x="440" y="400" width="120" height="80" rx="10" fill="#B58A2A"/>` +
    `<rect x="400" y="250" width="200" height="160" rx="26" fill="${GOLD}"/>`,

  hairoil: () =>
    shadow(170) +
    `<rect x="380" y="400" width="240" height="480" rx="60" fill="url(#amber)"/>` +
    label(410, 560, 180, 240, ["HUILE", "Capillaire", "100 ml"], { size: 30 }) +
    `<rect x="470" y="300" width="60" height="110" rx="12" fill="${INK}"/>` +
    `<path d="M470 305 H650 Q690 305 690 345 V365" stroke="${INK}" stroke-width="40" fill="none" stroke-linecap="round"/>`,

  palette: () =>
    shadow(300) +
    `<rect x="220" y="420" width="560" height="440" rx="40" fill="${INK}"/>` +
    `<rect x="250" y="450" width="500" height="380" rx="22" fill="#222"/>` +
    ["#C9755B", "#E2B13C", "#8E5A3C", "#D9A7A0", "#6B4A3A", "#F0D9B5", "#A04B5E", "#2F2F2F", "#C98E4A", "#E8B4A8", "#7A5C45", "#B5836B"]
      .map((c, i) => `<circle cx="${320 + (i % 4) * 120}" cy="${535 + Math.floor(i / 4) * 105}" r="42" fill="${c}"/>`)
      .join("") +
    `<rect x="220" y="330" width="560" height="110" rx="30" fill="#1b1b1b" transform="rotate(-8 500 385)"/>`,

  tube: () =>
    shadow(180) +
    `<path d="M360 330 H640 L620 800 Q500 850 380 800 Z" fill="#FFFFFF"/>` +
    `<path d="M360 330 H640 L630 420 H370 Z" fill="${GOLD}"/>` +
    label(400, 500, 200, 200, ["ÉCRAN", "SOLAIRE", "SPF 50"], { fill: "#FFF3D6", size: 32 }) +
    `<rect x="380" y="800" width="240" height="70" rx="14" fill="${INK}"/>`,

  shower: () =>
    shadow(200) +
    `<rect x="350" y="400" width="300" height="480" rx="60" fill="url(#green)"/>` +
    label(385, 540, 230, 250, ["GEL DOUCHE", "Énergisant", "250 ml"], { size: 30 }) +
    `<rect x="430" y="300" width="140" height="110" rx="18" fill="${INK}"/>` +
    `<rect x="470" y="230" width="60" height="90" rx="14" fill="${INK}"/>`,

  tub: () =>
    shadow(300) +
    `<rect x="260" y="360" width="480" height="520" rx="54" fill="${INK}"/>` +
    `<rect x="240" y="300" width="520" height="110" rx="40" fill="${GOLD}"/>` +
    `<rect x="280" y="380" width="30" height="480" rx="15" fill="#fff" opacity="0.12"/>` +
    label(310, 520, 380, 270, ["WHEY", "PROTÉINE", "2 kg"], { fill: GOLD, color: INK, size: 56 }),

  bands: () =>
    shadow(320) +
    ["#E2B13C", "#C0392B", "#1A7F4B", "#2F6FDE", "#111111"]
      .map(
        (c, i) =>
          `<ellipse cx="500" cy="${720 - i * 28}" rx="${300 - i * 34}" ry="${110 - i * 10}" fill="none" stroke="${c}" stroke-width="34"/>`,
      )
      .join("") +
    label(380, 760, 240, 90, ["5 niveaux"], { size: 36 }),

  earbuds: () =>
    shadow(260) +
    `<rect x="260" y="560" width="480" height="320" rx="130" fill="${INK}"/>` +
    `<path d="M260 700 H740" stroke="#333" stroke-width="6"/>` +
    `<circle cx="500" cy="620" r="14" fill="${GOLD}"/>` +
    `<g><rect x="330" y="300" width="120" height="250" rx="60" fill="#F4F4F4" transform="rotate(-12 390 425)"/><rect x="345" y="520" width="90" height="130" rx="45" fill="#E4E4E4" transform="rotate(-12 390 585)"/></g>` +
    `<g><rect x="550" y="300" width="120" height="250" rx="60" fill="#F4F4F4" transform="rotate(12 610 425)"/><rect x="565" y="520" width="90" height="130" rx="45" fill="#E4E4E4" transform="rotate(12 610 585)"/></g>`,

  watch: () =>
    shadow(200) +
    `<rect x="400" y="160" width="200" height="760" rx="60" fill="${INK}"/>` +
    [260, 360, 640, 740, 820].map((y) => `<circle cx="500" cy="${y}" r="9" fill="#333"/>`).join("") +
    `<rect x="310" y="340" width="380" height="400" rx="96" fill="#1c1c1c" stroke="#555" stroke-width="10"/>` +
    `<rect x="338" y="368" width="324" height="344" rx="74" fill="#0b0b0b"/>` +
    `<text x="500" y="500" text-anchor="middle" font-family="Helvetica, Arial, sans-serif" font-weight="300" font-size="110" fill="#fff">10:42</text>` +
    `<path d="M395 600 H605" stroke="${GOLD}" stroke-width="14" stroke-linecap="round"/>` +
    `<rect x="690" y="470" width="22" height="70" rx="10" fill="#555"/>`,

  coffee: () =>
    shadow(260) +
    `<path d="M300 300 H700 L730 860 Q500 900 270 860 Z" fill="#8C5A32"/>` +
    `<path d="M300 300 H700 L706 360 H294 Z" fill="#6F4526"/>` +
    `<path d="M310 300 q190 -60 380 0" stroke="#5A371D" stroke-width="10" fill="none"/>` +
    label(350, 470, 300, 260, ["CAFÉ", "Arabica", "1 kg"], { fill: "#F6EBDD", size: 54 }),

  capsules: () =>
    shadow(300) +
    [
      [340, 700, "#111111"],
      [500, 740, "#E2B13C"],
      [660, 700, "#111111"],
      [420, 560, "#E2B13C"],
      [580, 560, "#111111"],
      [500, 420, "#E2B13C"],
    ]
      .map(
        ([x, y, c]) =>
          `<g><path d="M${x - 70} ${y - 60} H${x + 70} L${x + 55} ${y + 80} H${x - 55} Z" fill="${c}"/><ellipse cx="${x}" cy="${y - 60}" rx="70" ry="18" fill="${c === INK ? "#333" : "#F0CB6B"}"/></g>`,
      )
      .join("") +
    label(380, 790, 240, 80, ["x50 intenso"], { size: 34 }),

  dumbbell: () =>
    shadow(330) +
    `<g transform="translate(0 170)">` +
    `<rect x="200" y="515" width="600" height="60" rx="22" fill="#8A8F96"/>` +
    `<rect x="380" y="500" width="240" height="90" rx="20" fill="#3a3a3a"/>` +
    [380, 420, 460, 500, 540, 580].map((x) => `<rect x="${x}" y="505" width="6" height="80" fill="#555"/>`).join("") +
    `<rect x="230" y="390" width="70" height="310" rx="22" fill="${INK}"/><rect x="300" y="430" width="55" height="230" rx="18" fill="#2a2a2a"/>` +
    `<rect x="700" y="390" width="70" height="310" rx="22" fill="${INK}"/><rect x="645" y="430" width="55" height="230" rx="18" fill="#2a2a2a"/>` +
    `<rect x="248" y="410" width="12" height="270" rx="6" fill="#fff" opacity="0.18"/><rect x="718" y="410" width="12" height="270" rx="6" fill="#fff" opacity="0.18"/>` +
    `</g>`,

  cup: () =>
    shadow(260) +
    `<ellipse cx="500" cy="850" rx="260" ry="42" fill="#FBF8F3"/>` +
    `<path d="M330 560 H670 Q670 800 500 835 Q330 800 330 560 Z" fill="#FBF8F3"/>` +
    `<path d="M668 600 q120 10 85 100 q-32 70 -118 58" stroke="#FBF8F3" stroke-width="34" fill="none" stroke-linecap="round"/>` +
    `<ellipse cx="500" cy="560" rx="170" ry="34" fill="#4A2C17"/>` +
    `<ellipse cx="480" cy="552" rx="70" ry="10" fill="#7A4A26" opacity="0.7"/>` +
    [420, 500, 580].map((x) => `<path d="M${x} 500 q-34 -50 0 -100 q34 -50 0 -100" stroke="#fff" stroke-width="16" fill="none" stroke-linecap="round" opacity="0.55"/>`).join(""),

  box: () =>
    shadow(260) +
    `<rect x="300" y="420" width="400" height="440" rx="24" fill="#FBF8F3"/>` +
    `<rect x="300" y="420" width="400" height="90" rx="24" fill="${GOLD}"/>`,
};

// slug → dessin ; à défaut, le dessin de la catégorie.
const BY_SLUG = {
  "serum-vitamine-c-30ml": "serum",
  "creme-hydratante-visage-50ml": "cream",
  "eau-de-parfum-100ml": "perfume",
  "huile-capillaire-100ml": "hairoil",
  "palette-fards-12-teintes": "palette",
  "ecran-solaire-spf50-50ml": "tube",
  "gel-douche-energisant-250-ml": "shower",
  "whey-isolat-2kg": "tub",
  "whey-proteine-2kg": "tub",
  "kit-bandes-resistance": "bands",
  "ecouteurs-reduction-bruit": "earbuds",
  "montre-connectee-sport": "watch",
  "cafe-grains-arabica-1kg": "coffee",
  "capsules-espresso-x50": "capsules",
};
const BY_CATEGORY = { beaute: "cream", musculation: "tub", "high-tech": "earbuds", cafe: "coffee" };

const BACKGROUNDS = {
  beaute: ["#F6EDE1", "#E6D2BA"],
  musculation: ["#ECEEF1", "#C9D1D9"],
  "high-tech": ["#E7E9ED", "#B8C0CA"],
  cafe: ["#F1E6D6", "#D3B88F"],
};

// Une scène par catégorie : plusieurs dessins posés l'un à côté de l'autre, [dessin, x, sol, échelle].
// Le sujet reste dans la moitié haute : sur le site, le bas est recouvert par le titre.
const SCENES = {
  beaute: [["perfume", 250, 770, 0.72], ["tube", 760, 770, 0.72], ["cream", 640, 880, 0.55], ["serum", 470, 860, 0.86]],
  musculation: [["bands", 240, 820, 0.55], ["dumbbell", 740, 860, 0.6], ["tub", 500, 880, 0.88]],
  "high-tech": [["earbuds", 320, 860, 0.9], ["watch", 710, 880, 0.82]],
  cafe: [["coffee", 280, 880, 0.95], ["capsules", 760, 800, 0.7], ["cup", 560, 900, 0.5]],
};

function scene(category) {
  // Remontée de 130 : le bas de l'image est recouvert par le titre sur le site.
  return () =>
    `<g transform="translate(0 -130)">` +
    SCENES[category]
      .map(([name, x, ground, scale]) => `<g transform="translate(${x - 500 * scale} ${ground - 880 * scale}) scale(${scale})">${DRAWINGS[name]()}</g>`)
      .join("") +
    `</g>`;
}

function svg(drawing, category, variant) {
  const [from, to] = variant === 0 ? BACKGROUNDS[category] ?? BACKGROUNDS.beaute : ["#1a1a1a", "#050505"];
  // Variante 2 : fond sombre doré, produit plus grand — comme une seconde vue.
  const transform = variant === 0 ? "" : `translate(500 540) scale(1.28) translate(-500 -560)`;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="1200" viewBox="0 0 1000 1000">
<defs>
<linearGradient id="bg" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${from}"/><stop offset="1" stop-color="${to}"/></linearGradient>
<linearGradient id="amber" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#9A5B14"/><stop offset="0.5" stop-color="#D9902B"/><stop offset="1" stop-color="#8A4F10"/></linearGradient>
<linearGradient id="rose" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#E9B7A6"/><stop offset="1" stop-color="#B96F63"/></linearGradient>
<linearGradient id="green" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#1D7A4E"/><stop offset="0.55" stop-color="#2FA46A"/><stop offset="1" stop-color="#1A6B45"/></linearGradient>
</defs>
<rect width="1000" height="1000" fill="url(#bg)"/>
<g transform="${transform}">${drawing()}</g>
</svg>`;
}

// --- Envoi -----------------------------------------------------------------------------

const { data: products, error } = await supabase
  .from("products")
  .select("id, slug, categories (slug)")
  .order("slug");
if (error) throw new Error(`Lecture des produits impossible : ${error.message}`);

for (const product of products) {
  const category = product.categories?.slug ?? "beaute";
  const drawing = DRAWINGS[BY_SLUG[product.slug] ?? BY_CATEGORY[category] ?? "box"];
  const paths = [];

  for (const variant of [0, 1]) {
    const jpeg = await sharp(Buffer.from(svg(drawing, category, variant))).jpeg({ quality: 82 }).toBuffer();
    const path = `${product.id}/mock-${variant + 1}-${fingerprint(jpeg)}.jpg`;
    const { error: uploadError } = await supabase.storage
      .from("product-images")
      .upload(path, jpeg, { contentType: "image/jpeg", upsert: true });
    if (uploadError) throw new Error(`Envoi de ${path} impossible : ${uploadError.message}`);
    paths.push(path);
  }

  const { error: updateError } = await supabase.from("products").update({ images: paths }).eq("id", product.id);
  if (updateError) throw new Error(`Produit ${product.slug} non mis à jour : ${updateError.message}`);
  console.log(`✓ ${product.slug} : ${paths.length} images`);
}

// --- Catégories ------------------------------------------------------------------------

const { data: categories, error: categoriesError } = await supabase.from("categories").select("id, slug");
if (categoriesError) throw new Error(`Lecture des catégories impossible : ${categoriesError.message}`);

for (const category of categories) {
  if (!SCENES[category.slug]) continue;
  const jpeg = await sharp(Buffer.from(svg(scene(category.slug), category.slug, 0))).jpeg({ quality: 82 }).toBuffer();
  const path = `categories/${category.slug}-${fingerprint(jpeg)}.jpg`;
  const { error: uploadError } = await supabase.storage
    .from("product-images")
    .upload(path, jpeg, { contentType: "image/jpeg", upsert: true });
  if (uploadError) throw new Error(`Envoi de ${path} impossible : ${uploadError.message}`);
  const { error: updateError } = await supabase.from("categories").update({ image: path }).eq("id", category.id);
  if (updateError) throw new Error(`Catégorie ${category.slug} non mise à jour : ${updateError.message}`);
  console.log(`✓ catégorie ${category.slug}`);
}
