// Builds the downloadable PDFs in web/public/documents/ from the templates.
//
//   cd golden-years-hcms
//   npm i --no-save playwright-core        (once; uses an installed Chrome/Chromium)
//   node documents-src/build.mjs            (all documents)
//   node documents-src/build.mjs policy     (just one: policy | admission | assessment | safety | nurse | management)
//
// Needs `pdftotext` (poppler-utils) for the manual's table-of-contents page numbers.
// Set CHROME_PATH if Chrome isn't found automatically.
import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs'
import { execFileSync } from 'node:child_process'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { chromium } from 'playwright-core'
import { wrapDocument, coverPage } from '../web/src/documents/shell.js'
import { DOCUMENTS } from '../web/src/documents/registry.js'

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..')
const OUT = join(ROOT, 'web/public/documents')
mkdirSync(OUT, { recursive: true })
const logo = 'data:image/png;base64,' + readFileSync(join(ROOT, 'web/src/assets/logo.png')).toString('base64')

const CHROME = [process.env.CHROME_PATH, '/opt/pw-browsers/chromium-1194/chrome-linux/chrome', '/usr/bin/google-chrome',
  '/usr/bin/chromium', '/usr/bin/chromium-browser', '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome']
  .find((p) => p && existsSync(p))

const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')

async function toPdf(browser, html, file) {
  const page = await browser.newPage()
  await page.setContent(html, { waitUntil: 'load' })
  await page.evaluate(() => document.fonts.ready)
  await page.pdf({ path: file, preferCSSPageSize: true, printBackground: true })
  await page.close()
}

// ---------------- Policy & Procedure Manual ----------------
function policyHtml(body, pages = {}) {
  const heads = [...body.matchAll(/<h([123]) id="(h\d+)"[^>]*data-toc="(\d)"[^>]*>(.*?)<\/h\1>/g)]
  const toc = heads.map(([, , id, lvl, text]) => {
    const pg = pages[id] ? String(pages[id]) : '000'
    return `<div class="te l${lvl}"><span class="tt">${text}</span><span class="dots"></span><span class="pg">${pg}</span></div>`
  }).join('\n')
  // Invisible marker in each heading so the build can find its page number.
  const marked = body.replace(/(<h([123]) id="(h\d+)"[^>]*data-toc="\d"[^>]*>)/g, '$1<span class="pm">§$3§</span>')
  const cover = coverPage({
    logo, kicker: 'Home Health Agency', title: 'Policy and Procedure Manual',
    subtitle: 'Chapter 246-335 WAC — In-Home Services Agencies (Home Health)',
    meta: `Revised ${new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}`,
  })
  return wrapDocument({
    title: 'Policy and Procedure Manual', logo, docTitle: 'Policy & Procedure Manual',
    body: `${cover}\n<section class="toc"><h1>Table of Contents</h1>${toc}</section>\n${marked}`,
  })
}

async function buildPolicy(browser) {
  const body = readFileSync(join(ROOT, 'documents-src/policy-manual.html'), 'utf8')
  const file = join(OUT, 'policy-and-procedure-manual.pdf')
  await toPdf(browser, policyHtml(body), file)
  let pages = {}
  try {
    const text = execFileSync('pdftotext', ['-enc', 'UTF-8', file, '-'], { maxBuffer: 1 << 28 }).toString('utf8')
    text.split('\f').forEach((pg, i) => {
      for (const m of pg.matchAll(/§(h\d+)§/g)) if (!pages[m[1]]) pages[m[1]] = i + 1
    })
  } catch (e) {
    console.warn('pdftotext not available — table of contents will have no page numbers.')
  }
  await toPdf(browser, policyHtml(body, pages), file)
  console.log('✓ policy-and-procedure-manual.pdf', Object.keys(pages).length, 'TOC entries numbered')
}

// ---------------- Forms (blank) ----------------
function pagesOf(file) {
  const pages = {}
  try {
    const text = execFileSync('pdftotext', ['-enc', 'UTF-8', file, '-'], { maxBuffer: 1 << 28 }).toString('utf8')
    text.split('\f').forEach((pg, i) => {
      for (const m of pg.matchAll(/§(\w+)§/g)) if (!pages[m[1]]) pages[m[1]] = i + 1
    })
  } catch { console.warn('pdftotext not available — no page numbers in contents.') }
  return pages
}

async function buildForm(browser, doc) {
  const mod = await import(`../web/src/documents/${doc.module}.js`)
  const file = join(OUT, doc.file)
  const make = (pages) => wrapDocument({ title: doc.title, logo, docTitle: doc.short, body: mod.render({}, { logo, blank: true, pages }) })
  await toPdf(browser, make({}), file)
  const pages = pagesOf(file)
  if (Object.keys(pages).length) await toPdf(browser, make(pages), file)
  console.log('✓', doc.file, Object.keys(pages).length ? `(${Object.keys(pages).length} contents entries)` : '')
}

const only = process.argv[2]
const browser = await chromium.launch({ executablePath: CHROME })
try {
  if (!only || only === 'policy') await buildPolicy(browser)
  for (const d of DOCUMENTS.filter((d) => d.module)) {
    if (!only || only === d.key) await buildForm(browser, d)
  }
} finally {
  await browser.close()
}
void esc
