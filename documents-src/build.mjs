// Builds the downloadable PDFs in web/public/documents/ from the templates in
// web/src/documents/ (the same code that prints filled forms in the app).
//
//   cd golden-years-hcms
//   npm i --no-save playwright-core        (once; uses an installed Chrome/Chromium)
//   node documents-src/build.mjs            (all documents)
//   node documents-src/build.mjs policy     (just one — any key in web/src/documents/registry.js)
//
// Needs `pdftotext` (poppler-utils) for page numbers and counts.
// Set CHROME_PATH if Chrome isn't found automatically.
import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs'
import { execFileSync } from 'node:child_process'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { chromium } from 'playwright-core'
import { wrapDocument } from '../web/src/documents/shell.js'
import { DOCUMENTS } from '../web/src/documents/registry.js'
import { MODULES } from '../web/src/documents/modules.js'
import { renderWithBody } from '../web/src/documents/policyManual.js'
import COUNTS from '../web/src/documents/pageCounts.js'

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..')
const OUT = join(ROOT, 'web/public/documents')
const DOCS_SRC = join(ROOT, 'web/src/documents')
mkdirSync(OUT, { recursive: true })
const logo = 'data:image/png;base64,' + readFileSync(join(ROOT, 'web/src/assets/logo.png')).toString('base64')

const CHROME = [process.env.CHROME_PATH, '/opt/pw-browsers/chromium-1194/chrome-linux/chrome', '/usr/bin/google-chrome',
  '/usr/bin/chromium', '/usr/bin/chromium-browser', '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome']
  .find((p) => p && existsSync(p))

async function toPdf(browser, html, file) {
  const page = await browser.newPage()
  await page.setContent(html, { waitUntil: 'load' })
  await page.evaluate(() => document.fonts.ready)
  await page.pdf({ path: file, preferCSSPageSize: true, printBackground: true })
  await page.close()
}

// First page each "§id§" marker appears on, plus the total page count.
function scan(file) {
  const pages = {}
  let total = 0
  try {
    const text = execFileSync('pdftotext', ['-enc', 'UTF-8', file, '-'], { maxBuffer: 1 << 28 }).toString('utf8')
    const sheets = text.split('\f')
    total = sheets.length - (sheets[sheets.length - 1].trim() ? 0 : 1)
    sheets.forEach((pg, i) => { for (const m of pg.matchAll(/§(\w+)§/g)) if (!pages[m[1]]) pages[m[1]] = i + 1 })
  } catch { console.warn('pdftotext not available — no page numbers.') }
  return { pages, total }
}

async function build(browser, doc) {
  const file = join(OUT, doc.file)
  let make
  if (doc.key === 'policy') {
    const body = readFileSync(join(DOCS_SRC, 'policy/manualBody.html'), 'utf8')
    make = (pages) => wrapDocument({ title: doc.title, logo, docTitle: doc.short, body: renderWithBody(body, {}, { logo, pages }) })
  } else {
    const mod = MODULES[doc.key]
    make = (pages) => wrapDocument({ title: doc.title, logo, docTitle: doc.short, body: mod.render({}, { logo, blank: true, pages }) })
  }
  await toPdf(browser, make({}), file)
  let { pages, total } = scan(file)
  if (Object.keys(pages).length) {
    await toPdf(browser, make(pages), file)
    total = scan(file).total
    if (doc.key === 'policy') {
      writeFileSync(join(DOCS_SRC, 'policy/pages.js'), `// Table-of-contents page numbers, written by documents-src/build.mjs.\nexport default ${JSON.stringify(pages)}\n`)
    }
  }
  COUNTS[doc.key] = total
  console.log('✓', doc.file, `${total} pages`)
}

const only = process.argv[2]
const browser = await chromium.launch({ executablePath: CHROME })
try {
  for (const d of DOCUMENTS) if (!only || only === d.key) await build(browser, d)
} finally {
  await browser.close()
}
writeFileSync(join(DOCS_SRC, 'pageCounts.js'), `// Pages in each ready-made PDF — written by documents-src/build.mjs.\nexport default ${JSON.stringify(COUNTS, null, 1)}\n`)
