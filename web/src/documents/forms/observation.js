// Vital Signs Observation Chart — readings table (page 1) and a trend graph
// (page 2) that plots the entered readings, or prints blank grids for plotting
// by hand. BP · heart rate · respirations · oxygen saturation · temperature.
import { esc } from '../brand.js'
import { renderItems } from '../formkit.js'

export const title = 'Vital Signs Observation Chart'

const N = 20
// Table columns (index 0 is the static reading number).
const COL = { date: 1, time: 2, bp: 3, hr: 4, rr: 5, spo2: 6, temp: 7, init: 8, note: 9 }

export const defaults = {
  obs_p_bp: 'above 170/90 or below 90/60',
  obs_p_hr: 'above 120 or below 60',
  obs_p_rr: 'above 22 or below 10',
  obs_p_spo2: 'below 90%',
  obs_p_temp: 'above 101 °F',
}

export const schema = [
  { t: 'title', text: 'Vital Signs Observation Chart', sub: 'Blood pressure · heart rate · respirations · oxygen saturation · temperature' },
  { t: 'row', f: [['patient_name', 'Client name:'], ['dob', 'Date of birth:', 'w2', 'date'], ['mr', 'Record #:', 'w2']] },
  { t: 'row', f: [['obs_physician', 'Physician:'], ['obs_frequency', 'Frequency ordered (e.g. daily, each visit):'], ['obs_o2', 'Oxygen order:', 'w3']] },
  { t: 'sh2', text: 'Report to the nurse / physician if' },
  { t: 'html', html: `<table class="form compact obs-params"><tr><th>Blood pressure</th><th>Heart rate</th><th>Respirations</th><th>Oxygen saturation</th><th>Temperature</th></tr>
<tr><td>{{obs_p_bp|Report BP if|100%}}</td><td>{{obs_p_hr|Report heart rate if|100%}}</td><td>{{obs_p_rr|Report respirations if|100%}}</td><td>{{obs_p_spo2|Report oxygen saturation if|100%}}</td><td>{{obs_p_temp|Report temperature if|100%}}</td></tr></table>` },
  { t: 'p', cls: 'note', html: 'Use the physician’s parameters when ordered; otherwise the agency defaults above apply. Call 911 for chest pain, severe shortness of breath, sudden confusion, or oxygen saturation that stays below 88%.' },
  { t: 'table', k: 'obs', label: 'Readings', cls: 'compact obs',
    head: ['#', 'Date', 'Time', 'BP (mmHg)', 'Heart rate (bpm)', 'Resp (/min)', 'SpO₂ (%)', 'Temp (°F)', 'Initials', 'Comments / action taken'],
    widths: ['4%', '12%', '7%', '10%', '8%', '7%', '7%', '7%', '7%'],
    rows: Array.from({ length: N }, (_, i) => [{ s: String(i + 1) }, ...Array(9).fill(null)]), rowH: 16 },
  { t: 'p', cls: 'note', html: 'Record BP as systolic/diastolic (e.g. 128/76). Note O₂ in litres if on oxygen (e.g. 94 on 2 L). Write the action taken and who was notified for any reading outside the parameters.' },
  { t: 'sig', f: [['obs_rev_sig', 'Reviewed by (RN) — signature'], ['obs_rev_date', 'Date', 'date']] },
]

const num = (s) => { const m = String(s ?? '').match(/-?\d+(\.\d+)?/); return m ? parseFloat(m[0]) : null }
const bp = (s) => { const m = String(s ?? '').match(/(\d{2,3})\s*\/\s*(\d{2,3})/); return m ? [parseFloat(m[1]), parseFloat(m[2])] : [null, null] }

const PANELS = [
  { label: 'Blood pressure', unit: 'mmHg', min: 40, max: 200, step: 20, band: [90, 140], series: [(d, r) => bp(d[`obs.${r}.${COL.bp}`])[0], (d, r) => bp(d[`obs.${r}.${COL.bp}`])[1]], legend: ['Systolic', 'Diastolic'] },
  { label: 'Heart rate', unit: 'bpm', min: 40, max: 140, step: 20, band: [60, 100], series: [(d, r) => num(d[`obs.${r}.${COL.hr}`])] },
  { label: 'Respirations', unit: '/min', min: 6, max: 30, step: 4, band: [12, 20], series: [(d, r) => num(d[`obs.${r}.${COL.rr}`])] },
  { label: 'Oxygen saturation', unit: '%', min: 80, max: 100, step: 5, band: [95, 100], series: [(d, r) => num(d[`obs.${r}.${COL.spo2}`])] },
  { label: 'Temperature', unit: '°F', min: 95, max: 104, step: 1, band: [97, 99.5], series: [(d, r) => num(d[`obs.${r}.${COL.temp}`])] },
]

function chart(d) {
  const W = 540, L = 46, R = 8, PH = 88, GAP = 30, TOP = 14
  const cw = (W - L - R) / N
  const x = (i) => L + cw * i + cw / 2
  let y0 = TOP
  const parts = PANELS.map((p) => {
    const y = (v) => y0 + PH - ((Math.min(Math.max(v, p.min), p.max) - p.min) / (p.max - p.min)) * PH
    const g = [`<text x="0" y="${y0 - 8}" class="pt">${p.label} <tspan class="pu">(${p.unit})</tspan></text>`]
    g.push(`<rect x="${L}" y="${y(p.band[1])}" width="${W - L - R}" height="${y(p.band[0]) - y(p.band[1])}" class="band"/>`)
    for (let v = p.min; v <= p.max + 1e-9; v += p.step) {
      g.push(`<line x1="${L}" x2="${W - R}" y1="${y(v)}" y2="${y(v)}" class="gl"/><text x="${L - 4}" y="${y(v) + 2.4}" class="ax">${+v.toFixed(1)}</text>`)
    }
    for (let i = 0; i <= N; i++) g.push(`<line x1="${L + cw * i}" x2="${L + cw * i}" y1="${y0}" y2="${y0 + PH}" class="${i % 5 ? 'gv' : 'gl'}"/>`)
    p.series.forEach((fn, si) => {
      const pts = Array.from({ length: N }, (_, r) => { const v = fn(d, r); return v == null || Number.isNaN(v) ? null : [x(r), y(v)] })
      let path = ''
      pts.forEach((pt, i) => { if (pt) path += `${path && pts[i - 1] ? 'L' : 'M'}${pt[0].toFixed(1)},${pt[1].toFixed(1)}` })
      if (path) g.push(`<path d="${path}" class="ln s${si}"/>`)
      pts.forEach((pt) => { if (pt) g.push(`<circle cx="${pt[0].toFixed(1)}" cy="${pt[1].toFixed(1)}" r="2.3" class="pt${si}"/>`) })
    })
    if (p.legend) g.push(`<g class="lg"><circle cx="${W - 120}" cy="${y0 - 10.5}" r="2.3" class="pt0"/><text x="${W - 114}" y="${y0 - 8}">${p.legend[0]}</text><circle cx="${W - 64}" cy="${y0 - 10.5}" r="2.3" class="pt1"/><text x="${W - 58}" y="${y0 - 8}">${p.legend[1]}</text></g>`)
    y0 += PH + GAP
    return g.join('')
  })
  const xl = Array.from({ length: N }, (_, i) => {
    const date = esc(d[`obs.${i}.${COL.date}`] || ''), time = esc(d[`obs.${i}.${COL.time}`] || '')
    return `<text x="${x(i)}" y="${y0 - GAP + 9}" class="xn">${i + 1}</text>${date ? `<text x="${x(i)}" y="${y0 - GAP + 17}" class="xd">${date.slice(5) || date}</text>` : ''}${time ? `<text x="${x(i)}" y="${y0 - GAP + 24}" class="xd">${time}</text>` : ''}`
  }).join('')
  const H = y0 - GAP + 28
  return `<svg class="obs-chart" viewBox="0 0 ${W} ${H}" width="100%" xmlns="http://www.w3.org/2000/svg">${parts.join('')}${xl}</svg>`
}

const CSS = `<style>
table.obs td { text-align: center; white-space: nowrap; } table.obs th { font-size: 7.4pt; } table.obs td:last-child { text-align: left; }
table.obs-params td { height: 16pt; font-size: 8pt; }
.obs-chart text { font-family: Inter, Arial, sans-serif; }
.obs-chart .pt { font-size: 7.6pt; font-weight: 700; fill: #0b5394; } .obs-chart .pu { font-weight: 400; fill: #5b6d82; }
.obs-chart .ax { font-size: 5.6pt; fill: #5b6d82; text-anchor: end; }
.obs-chart .xn { font-size: 5.8pt; fill: #0b5394; text-anchor: middle; font-weight: 600; } .obs-chart .xd { font-size: 4.6pt; fill: #5b6d82; text-anchor: middle; }
.obs-chart .gl { stroke: #b9c6d4; stroke-width: .5; } .obs-chart .gv { stroke: #e3e9f0; stroke-width: .4; }
.obs-chart .band { fill: #e7f3ec; }
.obs-chart .ln { fill: none; stroke-width: 1.1; } .obs-chart .ln.s0 { stroke: #0b5394; } .obs-chart .ln.s1 { stroke: #c9a227; stroke-dasharray: 3 2; }
.obs-chart .pt0 { fill: #0b5394; } .obs-chart .pt1 { fill: #c9a227; }
.obs-chart .lg text { font-size: 6pt; fill: #17334f; }
</style>`

export function render(data = {}) {
  const d = { ...defaults, ...data }
  return `${CSS}<div class="dense">${renderItems(schema, d)}</div>
<section class="page-break grp"><div class="doc-title"><h1>Vital Signs Trend Chart</h1><div class="sub">${d.patient_name ? `${esc(d.patient_name)} · ` : ''}Readings 1–${N} from the observation chart · shaded band = usual adult range</div></div>${chart(d)}
<p class="note">Plot each reading by its number in the observation chart. The shaded band shows the usual adult range for reference only; always follow the client’s own parameters above.</p></section>`
}
