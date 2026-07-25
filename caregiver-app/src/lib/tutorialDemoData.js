// Fake data shown only while the interactive tutorial is running.
// None of this ever touches the real database — it's swapped in
// client-side so every feature can be demonstrated safely.

const now = new Date()
const todayAt = (h, m = 0) => { const d = new Date(now); d.setHours(h, m, 0, 0); return d.toISOString() }

export const DEMO_CLIENT = {
  id: 'demo-client-1',
  first_name: 'Eleanor',
  last_name: 'Whitfield',
  address: '482 Maple Grove Ave',
  city: 'Tacoma',
  latitude: 47.2529,
  longitude: -122.4443,
}

export const DEMO_SHIFTS = [
  {
    id: 'demo-shift-1',
    starts_at: todayAt(9, 0),
    ends_at: todayAt(11, 0),
    clients: DEMO_CLIENT,
    journey_start_at: null,
  },
]

export const DEMO_PLAN_TASKS = [
  { id: 'demo-task-1', label: 'Assist with morning bathing & dressing', category: 'ADL', instructions: 'Use shower chair, check water temp first', completed: false },
  { id: 'demo-task-2', label: 'Prepare and serve breakfast', category: 'IADL', instructions: 'Low-sodium diet, no added salt', completed: false },
  { id: 'demo-task-3', label: 'Medication reminder — morning pills', category: 'Medication Reminder', instructions: '9:00 AM with food', completed: false },
  { id: 'demo-task-4', label: 'Light housekeeping — kitchen & bathroom', category: 'IADL', instructions: '', completed: false },
  { id: 'demo-task-5', label: 'Companionship & conversation', category: 'Other', instructions: 'Enjoys talking about gardening', completed: false },
]

export const DEMO_THREADS = [
  { id: 'demo-thread-1', subject: 'Welcome to the team!', created_at: todayAt(8, 0) },
  { id: 'demo-thread-2', subject: 'Schedule question', created_at: todayAt(7, 30) },
]

export const DEMO_LAST_MSG = {
  'demo-thread-1': { thread_id: 'demo-thread-1', last_body: "Welcome aboard! Let us know if you need anything.", last_at: todayAt(8, 5) },
  'demo-thread-2': { thread_id: 'demo-thread-2', last_body: 'Sounds good, see you then!', last_at: todayAt(7, 45) },
}

export const DEMO_MESSAGES = {
  'demo-thread-1': [
    { id: 'demo-msg-1', thread_id: 'demo-thread-1', sender_id: 'office-demo', body: "Welcome to Golden Years! We're so glad to have you.", created_at: todayAt(8, 0), read_at: null, profiles: { full_name: 'Office' } },
    { id: 'demo-msg-2', thread_id: 'demo-thread-1', sender_id: 'office-demo', body: 'Let us know if you need anything before your first visit.', created_at: todayAt(8, 5), read_at: null, profiles: { full_name: 'Office' } },
  ],
  'demo-thread-2': [
    { id: 'demo-msg-3', thread_id: 'demo-thread-2', sender_id: 'demo-caregiver', body: 'Quick question about tomorrow — same time as usual?', created_at: todayAt(7, 20), read_at: todayAt(7, 25) },
    { id: 'demo-msg-4', thread_id: 'demo-thread-2', sender_id: 'office-demo', body: 'Sounds good, see you then!', created_at: todayAt(7, 45), read_at: null, profiles: { full_name: 'Office' } },
  ],
}

export const DEMO_CREDENTIALS = [
  { id: 'demo-cred-1', credential_type: 'CPR/First Aid', expiry_date: new Date(now.getFullYear(), now.getMonth() + 4, 1).toISOString().slice(0, 10) },
  { id: 'demo-cred-2', credential_type: 'Background Check', expiry_date: null },
]

export const DEMO_UPDATES = [
  { id: 'demo-update-1', kind: 'client', update_type: 'care_plan', subtitle: 'Eleanor Whitfield', message: "Care plan updated: prefers tea over coffee in the afternoon.", created_at: todayAt(6, 30), unread: true },
  { id: 'demo-update-2', kind: 'shift', update_type: 'shift_new', subtitle: 'Schedule', message: 'New shift added: Thursday 2:00 PM – 4:00 PM with Eleanor Whitfield.', created_at: todayAt(6, 0), unread: true },
]
