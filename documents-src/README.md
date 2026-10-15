# Documentation sources

The Documentation page in the office system (`/app/documents`) offers six documents.
Their ready-to-download PDFs live in `web/public/documents/` and are generated from
the sources here and in `web/src/documents/`:

| Document | Source |
|---|---|
| Policy and Procedure Manual | `documents-src/policy-manual.html` (text) |
| Patient Admission Packet | `web/src/documents/admission.js` (also fillable in the app) |
| Home Care Assessment Form | `web/src/documents/forms/assessment.js` |
| Home Safety Assessment | `web/src/documents/forms/homeSafety.js` |
| Skilled Nurse's Note | `web/src/documents/forms/nurseNote.js` |
| Management & Supervision of Services | `web/src/documents/forms/management.js` |

Agency name, address, phone and email come from `web/src/documents/brand.js`; the
logo is `web/src/assets/logo.png`. After changing any of them, rebuild the PDFs:

```bash
npm i --no-save playwright-core     # once
node documents-src/build.mjs        # all, or: node documents-src/build.mjs policy
```

Requires Chrome/Chromium (set `CHROME_PATH` if it isn't found) and `pdftotext`
(poppler-utils) for the manual's table-of-contents page numbers.
