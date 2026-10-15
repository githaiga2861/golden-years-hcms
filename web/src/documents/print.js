import logoUrl from '../assets/logo.png'
import { wrapDocument } from './shell.js'

let logoCache = null
export async function logoDataUrl() {
  if (logoCache) return logoCache
  try {
    const blob = await (await fetch(logoUrl)).blob()
    logoCache = await new Promise((res) => { const r = new FileReader(); r.onload = () => res(r.result); r.readAsDataURL(blob) })
  } catch { logoCache = '' }
  return logoCache
}

/** Opens a print-ready copy of a document in a new tab (Print / Save as PDF). */
export async function openPrintable({ title, short, body }) {
  const win = window.open('', '_blank')
  if (!win) { alert('Please allow pop-ups for this site to print documents.'); return }
  win.document.write('<p style="font:14px sans-serif;padding:20px">Preparing document…</p>')
  const logo = await logoDataUrl()
  const html = wrapDocument({ title, logo, docTitle: short, body: typeof body === 'function' ? await body(logo) : body, autoPrint: true })
  win.document.open()
  win.document.write(html)
  win.document.close()
}
