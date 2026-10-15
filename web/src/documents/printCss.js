import { AGENCY, CONTACT_LINE } from './brand.js'

// One stylesheet for every printable document. Page header (logo + agency
// name) and footer (address, phone, page x of y) are CSS page-margin boxes,
// so they repeat on every printed page in the browser and in generated PDFs.
export function printCss(logoDataUrl, { docTitle = '' } = {}) {
  const q = (s) => `"${String(s).replace(/"/g, '\\"')}"`
  return `
@page {
  size: letter;
  margin: 0.95in 0.75in 0.85in 0.75in;
  ${logoDataUrl ? `@top-left { content: image-set(url("${logoDataUrl}") 9x); vertical-align: bottom; padding-bottom: 5pt; border-bottom: 1.2pt solid #c9a227; }` : ''}
  @top-right { content: ${q(AGENCY.legal)}; font: 600 8pt Inter, Arial, sans-serif; color: #0b5394; vertical-align: bottom; padding-bottom: 9pt; border-bottom: 1.2pt solid #c9a227; }
  @top-center { content: ""; border-bottom: 1.2pt solid #c9a227; vertical-align: bottom; }
  @bottom-left { content: ${q(CONTACT_LINE)}; width: 78%; font: 7.3pt Inter, Arial, sans-serif; color: #5b6d82; vertical-align: top; padding-top: 8pt; border-top: 0.6pt solid #d9c57f; }
  @bottom-right { content: "Page " counter(page) " of " counter(pages); width: 22%; font: 600 7.3pt Inter, Arial, sans-serif; color: #0a2540; vertical-align: top; padding-top: 8pt; border-top: 0.6pt solid #d9c57f; }
}
@page cover { margin: 0.6in; @top-left { content: none } @top-right { content: none; border: none } @top-center { content: none; border: none } @bottom-left { content: none } @bottom-right { content: none } }
* { box-sizing: border-box; }
html { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
body { margin: 0; font-family: Inter, "Segoe UI", Arial, sans-serif; font-size: 9.6pt; line-height: 1.48; color: #1c2b3a; }
b, strong { font-weight: 650; }
a { color: #0b5394; text-decoration: none; word-break: break-all; }

/* ---------- cover ---------- */
.cover { page: cover; height: 9.7in; display: block; padding-top: 1.35in !important; text-align: center; border: 2pt solid #c9a227; border-radius: 4pt; padding: 0.6in; position: relative; }
.cover::before { content: ""; position: absolute; inset: 7pt; border: 0.6pt solid #e6d394; border-radius: 2pt; }
.cover img { width: 1.9in; margin: 0 auto 0.35in; display: block; }
.cover .kicker { font-size: 10pt; letter-spacing: .22em; text-transform: uppercase; color: #a8861c; font-weight: 600; }
.cover h1.ct { font-size: 27pt; line-height: 1.15; color: #0a2540; margin: .12in 0 .08in; font-weight: 750; border: none; padding: 0; }
.cover .sub { font-size: 13pt; color: #0b5394; font-weight: 600; }
.cover .rule { width: 1.4in; height: 2pt; background: #c9a227; margin: .32in auto; }
.cover .agency { font-size: 12.5pt; font-weight: 700; color: #0a2540; }
.cover .addr { font-size: 10pt; color: #3d4f63; line-height: 1.6; margin-top: .06in; }
.cover .meta { position: absolute; bottom: .45in; left: 0; right: 0; font-size: 8.5pt; color: #5b6d82; }

/* ---------- table of contents ---------- */
.toc h1 { break-before: auto; }
.toc .te { display: flex; align-items: baseline; gap: 4pt; padding: 1.2pt 0; }
.toc .te .tt { flex: 0 1 auto; }
.toc .te .dots { flex: 1; border-bottom: 0.7pt dotted #9aa8b8; transform: translateY(-3pt); min-width: 12pt; }
.toc .te .pg { flex: 0 0 auto; font-variant-numeric: tabular-nums; color: #0a2540; min-width: 18pt; text-align: right; }
.toc .l1 { font-weight: 700; color: #0a2540; margin-top: 7pt; font-size: 9.6pt; }
.toc .l2 { padding-left: 14pt; font-size: 9pt; }
.toc .l3 { padding-left: 28pt; font-size: 8.4pt; color: #3d4f63; }
.pm { font-size: 1px; color: #fff; line-height: 0; }

/* ---------- headings ---------- */
h1, h2, h3, h4 { break-after: avoid; page-break-after: avoid; color: #0a2540; }
h1 { font-size: 17pt; line-height: 1.2; margin: 0 0 14pt; padding-bottom: 7pt; border-bottom: 2pt solid #c9a227; font-weight: 750; }
h1.part { break-before: page; font-size: 18pt; color: #0b5394; }
h2 { font-size: 13pt; line-height: 1.25; margin: 18pt 0 8pt; font-weight: 700; color: #0b5394; }
h2.pol { padding-bottom: 4pt; border-bottom: 0.8pt solid #d9c57f; }
h2.brk { break-before: page; margin-top: 0; }
h3 { font-size: 11pt; margin: 13pt 0 5pt; font-weight: 700; color: #0a2540; }
h4 { font-size: 9.8pt; margin: 10pt 0 4pt; font-weight: 700; color: #17334f; }
p { margin: 0 0 7pt; orphans: 2; widows: 2; }
p.ind { margin-left: 22pt; }
p.wac { font-size: 8.6pt; font-weight: 650; color: #0b5394; letter-spacing: .02em; margin: -3pt 0 9pt; }

/* ---------- lists (original markers preserved) ---------- */
.list { margin: 3pt 0 8pt; }
.li { display: flex; gap: 6pt; margin: 0 0 3pt; break-inside: avoid; }
.li .mk { flex: 0 0 auto; min-width: 15pt; text-align: right; color: #0b5394; font-weight: 600; }
.li.b .mk { min-width: 9pt; text-align: center; }
.li .tx { flex: 1; min-width: 0; }
.li.l1 { margin-left: 20pt; } .li.l2 { margin-left: 40pt; } .li.l3 { margin-left: 60pt; }

/* ---------- tables ---------- */
table { width: 100%; border-collapse: collapse; margin: 6pt 0 11pt; font-size: 8.9pt; }
tr { break-inside: avoid; }
th, td { border: 0.7pt solid #b9c6d4; padding: 2.6pt 6pt; line-height: 1.38; vertical-align: top; text-align: left; }
th { background: #eaf1f8; color: #0a2540; font-weight: 700; }
table.grid td:empty::after { content: "\\00a0"; }
table.grid td { height: 15pt; }
table.compact td, table.compact th { padding: 2.5pt 5pt; font-size: 8.4pt; }
table.boxlist th { background: #0b5394; color: #fff; letter-spacing: .05em; font-size: 8.6pt; text-transform: uppercase; }
table.boxlist td.n { width: 24pt; text-align: right; color: #0b5394; font-weight: 600; }
table.dodont th:first-child { background: #e3f2ec; color: #1f7a5c; }
table.dodont th:last-child { background: #f9e8e4; color: #b3402a; }
table.yn th.c, table.yn td:nth-child(n+2) { width: 34pt; text-align: center; }
table.hva th, table.hva td { font-size: 7.6pt; padding: 2pt 3pt; } table.hva th.c { text-align: center; } table.hva td { height: 16pt; }
table.ynq td.c, table.ynq th.c { text-align: center; }
.cbs[class*="cols"] .cb { margin-right: 4pt; }
.dense { font-size: 8.2pt; line-height: 1.32; } .dense .cb { font-size: 7.7pt; margin-bottom: 0.5pt; } .dense .lines .ln { min-height: 14pt; } .dense table.form td { padding: 2pt 4pt; } .dense .sh2 { font-size: 8.9pt; margin: 6pt 0 3pt; }
.dense .fld .lb { font-size: 7.9pt; } .dense .row { margin-bottom: 4pt; } .dense .form-section > .sh { margin: 7pt 0 4pt; }
.cards4 { display: grid; grid-template-columns: 1fr 1fr; gap: 9pt; margin: 8pt 0 12pt; }
.fcard { border: 0.8pt solid #d9c57f; border-radius: 5pt; padding: 8pt 10pt; break-inside: avoid; background: #fffdf6; }
.fcard h4 { margin: 0 0 3pt; font-size: 11pt; color: #0b5394; }
.fcard .fnum { float: right; font-size: 18pt; font-weight: 800; color: #e6d394; line-height: 1; }
.fcard table { margin: 4pt 0 0; }

/* ---------- forms ---------- */
.doc-title { text-align: center; margin: 0 0 12pt; }
.doc-title h1 { border: none; padding: 0; margin: 0; font-size: 16pt; letter-spacing: .03em; text-transform: uppercase; }
.doc-title .sub { color: #5b6d82; font-size: 8.8pt; margin-top: 2pt; }
.doc-title::after { content: ""; display: block; width: 1.2in; height: 1.6pt; background: #c9a227; margin: 7pt auto 0; }
.form-section { break-inside: avoid; margin: 0 0 10pt; }
.form-section > .sh { background: #0b5394; color: #fff; font-weight: 700; font-size: 8.8pt; letter-spacing: .04em; padding: 3.5pt 7pt; margin: 10pt 0 6pt; break-after: avoid; }
.sh2 { font-weight: 700; color: #0b5394; font-size: 9.6pt; margin: 9pt 0 4pt; border-bottom: 0.7pt solid #d9c57f; padding-bottom: 2pt; break-after: avoid; }
.row { display: flex; gap: 12pt; margin: 0 0 6pt; align-items: flex-end; }
.fld { flex: 1; display: flex; align-items: flex-end; gap: 5pt; min-width: 0; }
.fld .lb { flex: 0 0 auto; font-weight: 600; color: #17334f; font-size: 8.6pt; white-space: nowrap; }
.fld .vl { flex: 1; border-bottom: 0.7pt solid #5b6d82; min-height: 14pt; padding: 0 3pt 1pt; font-family: "Segoe Print", "Bradley Hand", Inter, Arial, sans-serif; color: #0a2540; font-size: 9.4pt; overflow-wrap: anywhere; }
.fld.w1 { flex: 0 0 1in; } .fld.w2 { flex: 0 0 1.6in; } .fld.w3 { flex: 0 0 2.3in; }
.lines .ln { border-bottom: 0.7pt solid #8a99ab; min-height: 17pt; padding: 0 3pt 1pt; font-family: "Segoe Print", "Bradley Hand", Inter, Arial, sans-serif; color: #0a2540; font-size: 9.4pt; }
.box-text { border: 0.7pt solid #8a99ab; border-radius: 3pt; min-height: 52pt; padding: 4pt 6pt; white-space: pre-wrap; font-size: 9.2pt; color: #0a2540; }
.cb { display: inline-flex; align-items: flex-start; gap: 4pt; margin: 0 12pt 3pt 0; font-size: 8.9pt; }
.cb .sq { width: 9pt; height: 9pt; border: 0.8pt solid #3d4f63; border-radius: 1.5pt; flex: 0 0 auto; display: inline-grid; place-items: center; font-size: 8pt; line-height: 1; margin-top: 1.5pt; color: #0b5394; font-weight: 800; }
.cbs { display: flex; flex-wrap: wrap; }
.cbs.cols2 { display: grid; grid-template-columns: 1fr 1fr; } .cbs.cols3 { display: grid; grid-template-columns: 1fr 1fr 1fr; } .cbs.cols4 { display: grid; grid-template-columns: repeat(4, 1fr); }
.sig { display: flex; gap: 22pt; margin: 18pt 0 8pt; break-inside: avoid; }
.sig > div { flex: 1; }
.sig .line { border-bottom: 0.8pt solid #1c2b3a; min-height: 22pt; font-family: "Segoe Print", "Bradley Hand", Inter, Arial, sans-serif; font-size: 10pt; padding: 0 3pt 1pt; display: flex; align-items: flex-end; }
.sig .line img { max-height: 30pt; }
.sig .cap { font-size: 7.8pt; color: #5b6d82; margin-top: 2pt; }
.sig .d { flex: 0 0 1.4in; }
table.form td, table.form th { font-size: 8.5pt; padding: 3pt 5pt; }
table.form td.v { font-family: "Segoe Print", "Bradley Hand", Inter, Arial, sans-serif; color: #0a2540; }
.note { font-size: 8.2pt; color: #5b6d82; }
.copy-tag { display: inline-block; font-size: 7.6pt; font-weight: 700; letter-spacing: .08em; text-transform: uppercase; color: #a8861c; border: 0.7pt solid #d9c57f; border-radius: 99pt; padding: 1pt 7pt; }
.page-break { break-before: page; }
.keep { break-inside: avoid; }
.muted { color: #5b6d82; }
.center { text-align: center; }
.small { font-size: 8.2pt; }
`
}
