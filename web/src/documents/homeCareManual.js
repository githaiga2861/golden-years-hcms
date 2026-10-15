// Home Care (non-skilled) Policy & Procedure Manual — the agency's 2026
// manual for its Home Care licence category (WAC 246-335-405 to -455).
import { fillTokens } from './formkit.js'
import { coverPage } from './shell.js'
import TOC_PAGES from './policy/homeCarePages.js'

export const title = 'Home Care Policy and Procedure Manual'

export const schema = [
  { t: 'group', title: 'Manual dates', items: [
    { t: 'row', f: [['hc_initiated', 'Date initiated', '', 'date'], ['hc_revised', 'Date revised', '', 'date']] },
  ] },
]

export function renderWithBody(body, data = {}, opts = {}) {
  const { logo, pages = TOC_PAGES } = opts
  let html = fillTokens(body.replace(/^\s*<!--[\s\S]*?-->/, ''), data)
  const heads = [...html.matchAll(/<h([12]) id="(\w+)"[^>]*data-toc="(\d)"[^>]*>(.*?)<\/h\1>/g)]
  const numbered = Object.keys(pages).length > 0
  const toc = heads.map(([, , id, lvl, text]) =>
    `<div class="te l${lvl}"><span class="tt">${text}</span>${numbered ? `<span class="dots"></span><span class="pg">${pages[id] ?? ''}</span>` : ''}</div>`).join('\n')
  html = html.replace(/(<h([12]) id="(\w+)"[^>]*data-toc="\d"[^>]*>)/g, '$1<span class="pm">§$3§</span>')
  const cover = coverPage({
    logo, kicker: 'In-Home Services Agency · Home Care', title: 'Home Care Policy and Procedure Manual',
    subtitle: 'Non-skilled in-home care · Chapter 246-335 WAC (Home Care category)', meta: '2026 Administrative Policies and Procedures',
  })
  return `${cover}\n<section class="toc"><h1>Table of Contents</h1>${toc}</section>\n${html}`
}

export async function render(data = {}, opts = {}) {
  const body = (await import('./policy/homeCareBody.html?raw')).default
  return renderWithBody(body, data, opts)
}
