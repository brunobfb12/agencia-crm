/**
 * Substitui cores hardcoded por CSS variables nos arquivos de dashboard.
 * Roda uma vez: node scripts/apply-theme-vars.js
 */
const fs = require("fs");
const path = require("path");

const files = [
  "app/dashboard/leads/page.tsx",
  "app/dashboard/clientes/page.tsx",
  "app/dashboard/conversas/page.tsx",
  "app/dashboard/configuracoes/page.tsx",
  "app/dashboard/central/page.tsx",
  "app/dashboard/agendamentos/page.tsx",
  "app/dashboard/campanhas/page.tsx",
  "app/dashboard/nav.tsx",
  "app/dashboard/components/table-scroll-hint.tsx",
  "app/dashboard/layout.tsx",
];

// Ordem importa: mais específicos primeiro para evitar substituições parciais
const replacements = [
  // --- backgrounds ---
  [/#08080e/g,                 "var(--bg)"],

  // rgba(255,255,255,...) → superfícies / bordas
  // Padrão borda (dentro de "1px solid ...")
  [/1px solid rgba\(255,255,255,\.2\)/g,   "1px solid var(--border-2)"],
  [/1px solid rgba\(255,255,255,\.1\)/g,   "1px solid var(--border-2)"],
  [/1px solid rgba\(255,255,255,\.08\)/g,  "1px solid var(--border)"],
  [/1px solid rgba\(255,255,255,\.07\)/g,  "1px solid var(--border)"],
  [/1px solid rgba\(255,255,255,\.06\)/g,  "1px solid var(--border)"],
  [/1px solid rgba\(255,255,255,\.05\)/g,  "1px solid var(--border)"],

  // Padrão borderColor / borderBottom etc sem "1px solid"
  [/rgba\(255,255,255,\.1\)(?=[^)]*(?:border|Border))/g, "var(--border-2)"],

  // Backgrounds superfície
  [/rgba\(255,255,255,\.09\)/g,  "var(--card-3)"],
  [/rgba\(255,255,255,\.08\)/g,  "var(--card-3)"],
  [/rgba\(255,255,255,\.055\)/g, "var(--card)"],
  [/rgba\(255,255,255,\.06\)/g,  "var(--card-2)"],
  [/rgba\(255,255,255,\.05\)/g,  "var(--input)"],
  [/rgba\(255,255,255,\.04\)/g,  "var(--card)"],
  [/rgba\(255,255,255,\.03\)/g,  "var(--card)"],
  [/rgba\(255,255,255,\.02\)/g,  "var(--card)"],
  // bordas isoladas que sobraram
  [/rgba\(255,255,255,\.1\)/g,   "var(--border-2)"],
  [/rgba\(255,255,255,\.07\)/g,  "var(--border)"],

  // --- text ---
  [/#f1f5f9/g, "var(--text)"],
  [/#e2e8f0/g, "var(--text-2)"],

  // rgba(148,163,184,...) → muted text
  [/rgba\(148,163,184,\.8\)/g,   "var(--muted)"],
  [/rgba\(148,163,184,\.7\)/g,   "var(--muted)"],
  [/rgba\(148,163,184,\.65\)/g,  "var(--muted)"],
  [/rgba\(148,163,184,\.6\)/g,   "var(--muted)"],
  [/rgba\(148,163,184,\.55\)/g,  "var(--muted-2)"],
  [/rgba\(148,163,184,\.5\)/g,   "var(--muted-2)"],
  [/rgba\(148,163,184,\.45\)/g,  "var(--muted-2)"],
  [/rgba\(148,163,184,\.4\)/g,   "var(--muted-3)"],
  [/rgba\(148,163,184,\.35\)/g,  "var(--muted-3)"],
  [/rgba\(148,163,184,\.3\)/g,   "var(--muted-3)"],

  // --- overlay / fade ---
  [/rgba\(0,0,0,\.7\)/g,         "var(--overlay)"],
  [/rgba\(8,8,14,\.95\)/g,       "var(--fade-edge)"],

  // --- sidebar hex colors (apenas em nav.tsx) ---
  [/#0a0916/g, "var(--bg)"],
];

const root = path.join(__dirname, "..");

for (const relPath of files) {
  const full = path.join(root, relPath);
  if (!fs.existsSync(full)) {
    console.log(`SKIP (not found): ${relPath}`);
    continue;
  }
  let src = fs.readFileSync(full, "utf8");
  const original = src;
  for (const [pattern, replacement] of replacements) {
    src = src.replace(pattern, replacement);
  }
  if (src !== original) {
    fs.writeFileSync(full, src, "utf8");
    console.log(`UPDATED: ${relPath}`);
  } else {
    console.log(`no changes: ${relPath}`);
  }
}

console.log("\nDone!");
