// The full interactive tutorial script. Each step names a page (route)
// and a target element (matched via data-tutorial="..."), or target: null
// to highlight the whole page (dimmed backdrop, no spotlight ring).
// Steps only ever advance when the user taps Next — there is no timer.

export const TUTORIAL_STEPS = [
  { page: '/', target: null, title: 'Welcome to Golden Years Care!', text: "This tour walks through every screen and feature — take your time, and use Next/Back whenever you're ready." },

  // ---------------- Today ----------------
  { page: '/', target: null, title: 'Your Today page', text: "This whole screen is your home base — every visit scheduled for today, in the order you'll do them." },
  { page: '/', target: 'nav-today', title: 'The Today tab', text: "You can always get back here by tapping Today in the bottom bar." },
  { page: '/', target: 'today-shift-card', title: 'Your first visit today', text: 'This card is for Eleanor Whitfield, 9:00–11:00 AM. Tap any card like this to open the full visit.' },
  { page: '/', target: 'today-shift-card-2', title: 'A second visit, same day', text: "Walter Nguyen at 2:00–4:00 PM — the list shows everything scheduled for today, in order." },

  // ---------------- Visit detail ----------------
  { page: '/visit/demo-shift-1', target: null, title: 'Opening a visit', text: "This is what you see after tapping a visit card — everything you need for that specific visit." },
  { page: '/visit/demo-shift-1', target: 'today-directions-prompt', title: 'Directions or already there?', text: 'Before clocking in, the app asks if you need directions. This helps us calculate accurate mileage for your pay.' },
  { page: '/visit/demo-shift-1', target: 'today-start-journey', title: 'Start Journey', text: "If you tap 'I need directions', this button records your starting point and opens turn-by-turn directions in your maps app." },
  { page: '/visit/demo-shift-1', target: 'today-clockin-btn', title: 'Clock in', text: 'When you arrive, tap here to clock in. Your location is checked automatically to confirm you\'re at the right address.' },
  { page: '/visit/demo-shift-1', target: 'today-geofence-note', title: 'Why location matters', text: "You must be within the client's home radius to clock in — this protects both you and the agency with accurate, verified records." },
  { page: '/visit/demo-shift-1', target: 'visit-adl-list', title: 'Care plan checklist', text: "Once clocked in, you'll see every task from the client's care plan. Check each one off as you complete it." },
  { page: '/visit/demo-shift-1', target: 'visit-adl-item', title: 'Task instructions', text: 'Tap any task to see special instructions the office has added — like dietary notes or preferences.' },
  { page: '/visit/demo-shift-1', target: 'visit-notes', title: 'Visit notes', text: "Use this space to write anything worth noting about the visit — for the office and future caregivers to see." },
  { page: '/visit/demo-shift-1', target: 'visit-mileage-card', title: 'Mileage', text: 'If you drove between visits, your mileage is calculated automatically from your route — or you can enter it manually.' },
  { page: '/visit/demo-shift-1', target: 'visit-signature-section', title: 'Signatures', text: "At the end of the visit, both you and the client (or their family) sign right on the screen to confirm the visit." },
  { page: '/visit/demo-shift-1', target: 'visit-clockout-btn', title: 'Clock out', text: "When everything is complete, tap here to clock out and finish the visit. Your location is checked one more time." },

  // ---------------- Schedule ----------------
  { page: '/week', target: null, title: 'The Schedule page', text: "This whole page is your full schedule — not just today. Three tabs give you different views." },
  { page: '/week', target: 'nav-schedule', title: 'The Schedule tab', text: 'You can get back here anytime from the bottom bar.' },
  { page: '/week', target: 'week-upcoming-tab', title: 'Upcoming visits', text: 'See every visit scheduled for the next two weeks, exactly as the office set it up.' },
  { page: '/week', target: 'week-upcoming-list', title: 'Your upcoming visits', text: 'Each day groups its visits together — tap any one to open it, just like from Today.' },
  { page: '/week', target: 'week-open-tab', title: 'Open shifts', text: "Shifts nobody has been assigned to yet appear here. If you're available, you can claim one directly." },
  { page: '/week', target: 'week-open-list', title: 'Claiming an open shift', text: 'Each open shift shows the client, date, and time. Tap Accept to claim it — first come, first served.' },
  { page: '/week', target: 'week-past-tab', title: 'Past visits & hours', text: 'Review your completed visits and verified hours here — useful for double-checking your pay.' },
  { page: '/week', target: 'week-past-list', title: 'Verified vs. pending', text: 'Each past visit shows your worked hours and whether the office has verified it yet.' },

  // ---------------- Messages ----------------
  { page: '/messages', target: null, title: 'The Messages page', text: "This whole page is how you chat directly with the office — like a normal messaging app." },
  { page: '/messages', target: 'nav-messages', title: 'The Messages tab', text: 'Get back here anytime from the bottom bar. A badge shows if you have unread messages.' },
  { page: '/messages', target: 'messages-thread-list', title: 'Your conversations', text: 'Every conversation you\'ve ever had with the office is listed here, most recent first.' },
  { page: '/messages', target: 'messages-thread-item', title: 'Message previews', text: 'Each conversation shows the last message, when it was sent, and a badge if you have unread messages.' },
  { page: '/messages', target: 'messages-new-btn', title: 'Start a new conversation', text: "Tap this button anytime to start a fresh conversation with the office about anything." },
  { page: '/messages', target: 'messages-thread-item', title: "Let's open one", text: 'Tap a conversation to see the full back-and-forth, just like we will now.' },
  { page: '/messages', target: 'messages-bubble', title: 'Messages from the office', text: "Messages from the office appear on the left, with their name and the time." },
  { page: '/messages', target: 'messages-read-receipt', title: 'Read receipts', text: "For messages you send, you'll see exactly when it was sent — and once the office opens it, when it was read." },

  // ---------------- Updates ----------------
  { page: '/updates', target: null, title: 'The Updates page', text: 'This is where the office sends you important notices.' },
  { page: '/updates', target: 'nav-updates', title: 'The Updates tab', text: 'A badge here shows how many updates you haven\'t seen yet.' },
  { page: '/updates', target: 'updates-list', title: 'Care plan & schedule changes', text: 'When a client\'s care plan changes, or a new shift is added, you\'ll see it here first.' },
  { page: '/updates', target: 'updates-item', title: 'Unread updates', text: 'Updates you haven\'t seen yet are highlighted in gold. Tap one to mark it read.' },

  // ---------------- Profile ----------------
  { page: '/profile', target: null, title: 'The Profile page', text: 'This whole page is your personal space — your info, settings, and account details.' },
  { page: '/profile', target: 'nav-profile', title: 'The Profile tab', text: 'Get back here anytime from the bottom bar.' },
  { page: '/profile', target: 'profile-header-card', title: 'Your info', text: 'Your name and login email are shown here.' },
  { page: '/profile', target: 'profile-change-password', title: 'Change your password', text: "You can change your password anytime — you'll just need to enter your current one first." },
  { page: '/profile', target: 'profile-credentials', title: 'Your credentials', text: 'Certifications like CPR, background checks, and licenses are tracked here, with expiry dates.' },
  { page: '/profile', target: 'profile-timeoff', title: 'Request time off', text: "Need a day off? Request it right here — the office will review and approve it." },
  { page: '/profile', target: 'profile-offline', title: 'Offline uploads', text: 'If you clock in without signal, the app saves it and uploads automatically once you\'re back online.' },
  { page: '/profile', target: 'profile-updates-card', title: 'App updates', text: 'The app checks for updates automatically in the background. When one\'s ready, you\'ll see it here — and get a notification.' },
  { page: '/profile', target: 'profile-signout', title: 'Signing out', text: "You can sign out here anytime — though we hope you'll stick around!" },

  // ---------------- Top bar: bell + sync ----------------
  { page: '/profile', target: 'sync-button', title: 'The sync button', text: 'This button in the top corner uploads anything saved offline, and checks for app updates.' },
  { page: '/profile', target: 'sync-button', title: 'Sync badges', text: 'A number badge means items are waiting to upload. A small gold dot means an app update is ready.' },

  { page: '/', target: null, title: "You're all set!", text: "That's everything! You can retake this tour anytime from your Profile page. Have a great shift!" },
]
