# Documentation sources

The Documentation page in the office system (`/app/documents`) lists 12 documents:
the Policy & Procedure Manual (main document), patient forms, the management and
supervision plan, and six worksheets that also appear inside the manual.

| Document | Source |
|---|---|
| Policy and Procedure Manual | `web/src/documents/policy/manualBody.html` (text) + `policyManual.js` (fill-in form) |
| Manual worksheets (review log, emergency info, risk, plan evaluation, HVA, business recovery) | `web/src/documents/forms/policyWorksheets.js` |
| Patient Admission Packet | `web/src/documents/admission.js` + `admission/` |
| Home Care Assessment / Home Safety / Skilled Nurse's Note / Management plan | `web/src/documents/forms/` |

In the manual text, `{{key|Label|width}}` marks a fill-in blank and `<!--FORM:x-->`
places a worksheet. Agency name, address, phone and email come from
`web/src/documents/brand.js`; the logo is `web/src/assets/logo.png`.

After changing any of them, rebuild the PDFs in `web/public/documents/` (this also
updates the page counts and the manual's table-of-contents page numbers):

```bash
npm i --no-save playwright-core     # once
node documents-src/build.mjs        # all, or one key: node documents-src/build.mjs policy
```

Requires Chrome/Chromium (set `CHROME_PATH` if it isn't found) and `pdftotext`
(poppler-utils).
