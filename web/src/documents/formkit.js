// A tiny schema language for printable, fillable forms.
//
// Each form is a list of items. The same schema renders:
//   • the printable HTML (renderItems) — blank, or filled with values, and
//   • the fill-in modal in the office app (DocumentFillModal reads `fieldsOf`).
//
// Values live in one flat object keyed by field key, so a key used on several
// forms (patient_name, dob, mr …) is typed once and fills everywhere.
//
// Item types
//   {t:'title', text, sub}                 form title
//   {t:'sh', text} / {t:'sh2', text}       section bar / sub-heading
//   {t:'p', html}                          paragraph; inline blanks as {{key|Label|width}}
//   {t:'list', items, ordered, start, cls} static list (html strings, may contain {{…}})
//   {t:'row', f:[[key,label,cls,type]]}    labelled lines on one row (cls: w1|w2|w3, type: date)
//   {t:'lines', k, label, n}               ruled lines (multi-line text)
//   {t:'box', k, label, h}                 bordered text box
//   {t:'checks', k, label, opts, cols, single}   checkboxes (single = pick one)
//   {t:'yn', k, label, opts}               one-of choice inline (default Yes / No)
//   {t:'table', k, head, rows, cls, widths} grid; cell: 'text' static · null editable · '[]' checkbox · {s:'text',span:n} · {h:'text'} header cell
//   {t:'sig', f:[[key,label,'date'|'']]}   signature lines
//   {t:'note', html} · {t:'html', html} · {t:'br'} page break · {t:'gap', h}
//   {t:'cols', cols:[[items],[items]], widths}
//   {t:'group', title, copies, items}      a form within a packet (copies: ['Agency copy','Patient copy'])
import { esc } from './brand.js'

const TOKEN = /\{\{([\w.]+)\|([^|}]*)(?:\|([^}]*))?\}\}/g

export const isChecked = (data, k, opt) => {
  const v = data?.[k]
  return Array.isArray(v) ? v.includes(opt) : v === opt
}
const val = (data, k) => (data && data[k] != null ? data[k] : '')

function inline(html, data) {
  return String(html).replace(TOKEN, (_, k, label, w) => {
    const v = val(data, k)
    if (w === 'bare') return v ? esc(v) : ''
    const width = w || '1.4in'
    return `<span class="ivl" style="display:inline-block;min-width:${width};border-bottom:0.7pt solid #5b6d82;padding:0 3pt;font-family:'Segoe Print','Bradley Hand',Inter,Arial,sans-serif;color:#0a2540">${v ? esc(v) : '&nbsp;'}</span>`
  })
}

// Fill {{key|Label|width}} blanks in any HTML (used by the policy manual body).
export const fillTokens = (html, data = {}) => inline(html, data)

const box = (on) => `<span class="sq">${on ? '✓' : ''}</span>`

function cell(c, r, ci, item, data) {
  const key = `${item.k}.${r}.${ci}`
  if (c === null) return `<td class="v">${esc(val(data, key))}</td>`
  if (c === '[]') return `<td class="c">${box(!!data?.[key])}</td>`
  if (typeof c === 'object' && c) {
    const span = c.span ? ` colspan="${c.span}"` : ''
    const rs = c.rows ? ` rowspan="${c.rows}"` : ''
    if (c.h != null) return `<th${span}${rs}${c.style ? ` style="${c.style}"` : ''}>${inline(c.h, data)}</th>`
    if (c.edit) return `<td class="v"${span}${rs}>${esc(val(data, key))}</td>`
    return `<td${span}${rs}${c.style ? ` style="${c.style}"` : ''}>${inline(c.s ?? '', data)}</td>`
  }
  return `<td>${inline(c, data)}</td>`
}

export function renderItems(items, data = {}) {
  return items.map((it) => renderItem(it, data)).join('\n')
}

function renderItem(it, data) {
  switch (it.t) {
    case 'title':
      return `<div class="doc-title"><h1>${esc(it.text)}</h1>${it.sub ? `<div class="sub">${it.sub}</div>` : ''}</div>`
    case 'sh': return `<div class="form-section"><div class="sh">${esc(it.text)}</div></div>`
    case 'sh2': return `<div class="sh2">${it.text}</div>`
    case 'p': return `<p${it.cls ? ` class="${it.cls}"` : ''}>${inline(it.html, data)}</p>`
    case 'note': return `<p class="note">${inline(it.html, data)}</p>`
    case 'html': return inline(it.html, data)
    case 'gap': return `<div style="height:${it.h || 10}pt"></div>`
    case 'br': return '<div class="page-break"></div>'
    case 'list': {
      let n = it.start || 1
      const out = it.items.map((x) => {
        if (Array.isArray(x)) {
          return `<div class="list" style="margin:0 0 3pt 22pt">${x.map((y, j) => `<div class="li"><span class="mk">${String.fromCharCode(97 + j)}.</span><div class="tx">${inline(y, data)}</div></div>`).join('')}</div>`
        }
        const mk = it.ordered ? `${n++}.` : (it.marker || '•')
        return `<div class="li${it.ordered ? '' : ' b'}"><span class="mk">${mk}</span><div class="tx">${inline(x, data)}</div></div>`
      })
      return `<div class="list ${it.cls || ''}">${out.join('')}</div>`
    }
    case 'row':
      return `<div class="row">${it.f.map(([k, label, cls]) =>
        `<div class="fld ${cls || ''}">${label ? `<span class="lb">${esc(label)}</span>` : ''}<span class="vl">${esc(val(data, k))}</span></div>`).join('')}</div>`
    case 'lines': {
      const v = String(val(data, it.k))
      const parts = v ? v.split('\n') : []
      const n = Math.max(it.n || 2, parts.length)
      const rows = Array.from({ length: n }, (_, i) => `<div class="ln">${esc(parts[i] || '')}</div>`).join('')
      return `<div class="lines" style="margin-bottom:6pt">${it.label ? `<div class="lb" style="font-weight:600;font-size:8.6pt;color:#17334f">${inline(it.label, data)}</div>` : ''}${rows}</div>`
    }
    case 'box':
      return `<div style="margin-bottom:7pt">${it.label ? `<div style="font-weight:600;font-size:8.6pt;color:#17334f;margin-bottom:2pt">${inline(it.label, data)}</div>` : ''}<div class="box-text" style="min-height:${it.h || 52}pt">${esc(val(data, it.k))}</div></div>`
    case 'checks':
      return `<div style="margin-bottom:6pt">${it.label ? `<div style="font-weight:600;font-size:8.6pt;color:#17334f;margin-bottom:2pt">${inline(it.label, data)}</div>` : ''}<div class="cbs ${it.cols ? `cols${it.cols}` : ''}">${it.opts.map((o) =>
        `<span class="cb">${box(isChecked(data, it.k, optKey(o)))}<span>${inline(o, data)}</span></span>`).join('')}</div></div>`
    case 'yn': {
      const opts = it.opts || ['Yes', 'No']
      return `<div class="row" style="align-items:center;flex-wrap:wrap"><span style="font-size:8.9pt">${inline(it.label, data)}</span>${opts.map((o) => `<span class="cb" style="margin:0 0 0 10pt">${box(isChecked(data, it.k, o))}<span>${o}</span></span>`).join('')}</div>`
    }
    case 'table': {
      const head = it.head ? `<tr>${it.head.map((h, i) => {
        if (h && typeof h === 'object') return `<th${h.span ? ` colspan="${h.span}"` : ''}${h.rows ? ` rowspan="${h.rows}"` : ''}${h.style ? ` style="${h.style}"` : ''}>${h.h}</th>`
        return `<th${it.widths?.[i] ? ` style="width:${it.widths[i]}"` : ''}>${h}</th>`
      }).join('')}</tr>` : ''
      const head2 = it.head2 ? `<tr>${it.head2.map((h) => `<th${h && h.style ? ` style="${h.style}"` : ''}>${h && typeof h === 'object' ? h.h : h}</th>`).join('')}</tr>` : ''
      const body = it.rows.map((row, r) => `<tr${it.rowH ? ` style="height:${it.rowH}pt"` : ''}>${row.map((c, ci) => cell(c, r, ci, it, data)).join('')}</tr>`).join('')
      return `<table class="form ${it.cls || ''}">${head}${head2}${body}</table>`
    }
    case 'ynTable': {
      const opts = it.opts || ['Yes', 'No', 'NA']
      const rows = it.sections.map((sec, si) => {
        const head = sec.title ? `<tr><th colspan="${2 + opts.length}" style="text-align:center;background:#f3f6fa">${esc(sec.title)}</th></tr>` : ''
        return head + sec.items.map((q, qi) => {
          const v = val(data, `${it.k}.${si}.${qi}`)
          return `<tr><td class="c" style="width:26pt;color:#0b5394;font-weight:600">${it.numbered === false ? '' : qi + 1}</td><td>${inline(q, data)}</td>${opts.map((o) => `<td class="c" style="width:30pt">${box(v === o)}</td>`).join('')}</tr>`
        }).join('')
      }).join('')
      return `<table class="form ynq">${`<tr><th style="width:26pt">${it.numLabel ?? 'No.'}</th><th>${esc(it.descLabel || 'Description')}</th>${opts.map((o) => `<th class="c" style="width:30pt;text-align:center">${o}</th>`).join('')}</tr>`}${rows}</table>`
    }
    case 'sig':
      return `<div class="sig">${it.f.map(([k, label, kind]) => {
        const v = val(data, k)
        const content = typeof v === 'string' && v.startsWith('data:image') ? `<img src="${v}" alt="">` : esc(v)
        return `<div class="${kind === 'date' ? 'd' : ''}"><div class="line">${content}</div><div class="cap">${esc(label)}</div></div>`
      }).join('')}</div>`
    case 'cols':
      return `<div style="display:grid;grid-template-columns:${it.widths || it.cols.map(() => '1fr').join(' ')};gap:14pt">${it.cols.map((c) => `<div>${renderItems(c, data)}</div>`).join('')}</div>`
    case 'group': {
      const copies = it.copies || [null]
      return copies.map((cp, i) => `<section class="${i || it.newPage !== false ? 'page-break' : ''} grp">${cp ? `<div style="text-align:right;margin-bottom:-6pt"><span class="copy-tag">${esc(cp)}</span></div>` : ''}${renderItems(it.items, data)}</section>`).join('\n')
    }
    default: return ''
  }
}

// ---------- fields for the fill-in modal ----------
// Returns [{section, fields:[{k,label,type,opts,...}]}] in document order,
// with each key listed only the first time it appears.
export function fieldsOf(items) {
  const sections = []
  const seen = new Set()
  const grouped = items.some((it) => it.t === 'group')
  let cur = { title: 'General', fields: [] }
  const take = (f) => { if (!f.k || seen.has(f.k)) return null; seen.add(f.k); return f }
  const push = (f) => { const x = take(f); if (x) cur.fields.push(x) }
  const clean = (h) => String(h || '').replace(/<br\s*\/?>/g, ' ').replace(/<[^>]+>/g, '').replace(/\{\{[^}]+\}\}/g, '…').replace(/&amp;/g, '&').replace(/\s+/g, ' ').trim()
  const fromText = (html, ctx) => {
    for (const m of String(html).matchAll(TOKEN)) push({ k: m[1], label: m[2] || ctx || m[1], type: 'text' })
  }
  const pushRow = (list) => {
    const fs = list.map(take).filter(Boolean)
    if (fs.length > 1) cur.fields.push({ type: 'row', k: `row:${fs[0].k}`, fields: fs })
    else if (fs.length) cur.fields.push(fs[0])
  }
  const newSection = (title) => {
    if (cur.fields.some((f) => !f.heading)) sections.push(cur)
    cur = { title, fields: [] }
  }
  const walk = (list, top) => list.forEach((it) => {
    switch (it.t) {
      case 'group':
        newSection(it.title)
        walk(it.items, false)
        newSection('General')
        break
      case 'title': if (!grouped && top && !cur.fields.length) cur.title = it.text; break
      case 'cols': it.cols.forEach((c) => walk(c, false)); break
      case 'sh':
        if (!grouped && top) newSection(clean(it.text).replace(/^\d+\.\s*/, ''))
        else cur.fields.push({ heading: clean(it.text) })
        break
      case 'sh2': cur.fields.push({ heading: clean(it.text) }); break
      case 'p': case 'note': case 'html': fromText(it.html); break
      case 'list': it.items.flat().forEach((x) => fromText(x)); break
      case 'row': pushRow(it.f.map(([k, label, , type]) => ({ k, label: (label || k).replace(/:$/, ''), type: type || (/date/i.test(label || '') ? 'date' : 'text') }))); break
      case 'sig': pushRow(it.f.map(([k, label, kind]) => ({ k, label, type: kind === 'date' ? (/time|title/i.test(label) ? 'text' : 'date') : 'text', sig: kind !== 'date' }))); break
      case 'lines': case 'box': fromText(it.label || ''); push({ k: it.k, label: clean(it.label) || 'Notes', type: 'textarea', rows: Math.min(8, Math.max(2, it.n || Math.round((it.h || 52) / 26))) }); break
      case 'checks': fromText(it.label || ''); push({ k: it.k, label: clean(it.label), type: it.single ? 'radio' : 'checks', opts: it.opts.map(optKey), rawOpts: it.opts, cols: it.cols }); it.opts.forEach((o) => { for (const m of String(o).matchAll(TOKEN)) seen.add(m[1]) }); break
      case 'yn': fromText(it.label); push({ k: it.k, label: clean(it.label), type: 'radio', opts: it.opts || ['Yes', 'No'], inline: true }); break
      case 'table': push({ k: it.k, type: 'table', label: it.label || '', item: it }); break
      case 'ynTable': push({ k: it.k, type: 'ynTable', label: it.label || '', item: it }); break
      default: break
    }
  })
  walk(items, true)
  if (cur.fields.some((f) => !f.heading)) sections.push(cur)
  // Short stand-alone forms read better on one page: keep the parts as panels.
  const count = sections.reduce((n, sec) => n + sec.fields.filter((f) => !f.heading).length, 0)
  if (!grouped && sections.length > 1 && count < 24) {
    const one = { title: sections[0].title === 'General' ? 'Form' : sections[0].title, fields: [] }
    sections.forEach((sec, i) => { if (i) one.fields.push({ heading: sec.title }); one.fields.push(...sec.fields) })
    sections.splice(0, sections.length, one)
  }
  sections.forEach((sec) => {
    sec.fields = sec.fields.filter((f, i, arr) => !f.heading || (arr[i + 1] && !arr[i + 1].heading))
  })
  return sections.filter((s) => s.fields.some((f) => !f.heading))
}

// Option text with inline tokens stripped (what's stored when a box is ticked).
export const optKey = (o) => o.replace(/\{\{[^}]+\}\}/g, '').trim()
