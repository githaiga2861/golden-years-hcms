// Agency details printed on every document (forms, manual, packets).
// Change them here and rebuild the PDFs (see documents-src/README.md).
export const AGENCY = {
  legal: 'Golden Years Home Health Supported Living LLC',
  kind: 'Home Health Agency',
  street: '614 Harrison St, Suite C',
  city: 'Sumner, WA 98390',
  phone: '(253) 487-7217',
  email: 'contact@goldenyearshomehealthllc.com',
  web: 'goldenyearshomecarewa.com',
  state: 'Washington',
}

export const ADDRESS_LINE = `${AGENCY.street}, ${AGENCY.city}`
export const CONTACT_LINE = `${ADDRESS_LINE} · ${AGENCY.phone} · ${AGENCY.email}`

export const esc = (v) => String(v ?? '')
  .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
