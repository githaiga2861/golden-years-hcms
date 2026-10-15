import * as admission from './admission.js'
import * as assessment from './forms/assessment.js'
import * as safety from './forms/homeSafety.js'
import * as nurse from './forms/nurseNote.js'
import * as management from './forms/management.js'
import * as policy from './forms/policyWorksheets.js'

// doc key → { schema, render(data, opts), defaults? }
// `policy` is the manual's fill-in worksheets (the manual itself is the PDF).
export const MODULES = { admission, assessment, safety, nurse, management, policy }
