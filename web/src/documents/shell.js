import { AGENCY, esc } from './brand.js'
import { printCss } from './printCss.js'

// Every font size in the documents (stylesheet, form styles and inline styles)
// is scaled by this factor, so text size can be tuned in one place.
export const FONT_SCALE = 1.2
const scaleFonts = (html) => String(html).replace(/(font-size:\s*)([\d.]+)pt/g, (_, k, n) => `${k}${+(n * FONT_SCALE).toFixed(2)}pt`)

/** Full printable HTML page for a document body. */
export function wrapDocument({ title, body, logo, docTitle = '', autoPrint = false }) {
  return `<!doctype html>
<html lang="en"><head><meta charset="utf-8">
<title>${esc(title)} — ${esc(AGENCY.legal)}</title>
<meta name="viewport" content="width=device-width, initial-scale=1">
<style>${scaleFonts(printCss(logo, { docTitle }))}
@media screen { body { background: #e9eef4; } .sheet { background: #fff; max-width: 8.5in; margin: 18px auto; padding: 0.8in 0.75in; box-shadow: 0 4px 24px rgba(10,37,64,.15); }
  .screen-bar { position: sticky; top: 0; z-index: 5; background: #0a2540; color: #fff; padding: 10px 16px; display: flex; gap: 10px; align-items: center; font: 600 14px Inter, Arial, sans-serif; }
  .screen-bar button { background: #c9a227; color: #0a2540; border: 0; border-radius: 8px; padding: 8px 14px; font-weight: 700; cursor: pointer; }
  .cover { height: auto; min-height: 9in; } }
@media print { .screen-bar { display: none; } .sheet { padding: 0; } }
</style></head>
<body>
${autoPrint ? `<div class="screen-bar"><span style="flex:1">${esc(title)}</span><button onclick="window.print()">Print / Save as PDF</button></div>` : ''}
<div class="sheet">${scaleFonts(body)}</div>
${autoPrint ? '<script>window.addEventListener("load",()=>setTimeout(()=>window.print(),350))</script>' : ''}
</body></html>`
}

/** Branded cover page used by the manual and the admission packet. */
export function coverPage({ logo, kicker, title, subtitle, meta = '' }) {
  return `<section class="cover">
  ${logo ? `<img src="${logo}" alt="">` : ''}
  <div class="kicker">${esc(kicker)}</div>
  <h1 class="ct">${esc(title)}</h1>
  ${subtitle ? `<div class="sub">${esc(subtitle)}</div>` : ''}
  <div class="rule"></div>
  <div class="agency">${esc(AGENCY.legal)}</div>
  <div class="addr">${esc(AGENCY.street)}, ${esc(AGENCY.city)}<br>${esc(AGENCY.phone)} · ${esc(AGENCY.email)}<br>${esc(AGENCY.state)}</div>
  ${meta ? `<div class="meta">${esc(meta)}</div>` : ''}
</section>`
}
