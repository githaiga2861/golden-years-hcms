// The full interactive tutorial script. Each step names a page (route),
// a target element (matched via data-tutorial="..."), and what to say.
// autoMs is how long the tutorial waits before advancing on its own —
// the user can always go Back, Skip this step, or Skip the whole tour.

export const TUTORIAL_STEPS = [
  { page: '/', target: null, title: 'Welcome to Golden Years Care!', text: "This quick tour will show you around the app — every screen, every button. It takes about 3 minutes. Let's get started.", autoMs: 5000 },

  // ---------------- Today ----------------
  { page: '/', target: 'nav-today', title: 'The Today tab', text: "This is your home screen — it shows every visit scheduled for today, in order.", autoMs: 4500 },
  { page: '/', target: 'today-shift-card', title: "Today's visit", text: 'Each card shows the client, the address, and the scheduled time. Tap a card to open the visit.', autoMs: 5500 },

  // ---------------- Visit detail ----------------
  { page: '/visit/demo-shift-1', target: 'today-directions-prompt', title: 'Directions or already there?', text: 'Before clocking in, the app asks if you need directions. This helps us calculate accurate mileage for your pay.', autoMs: 5500 },
  { page: '/visit/demo-shift-1', target: 'today-start-journey', title: 'Start Journey', text: "If you tap 'I need directions', this button records your starting point and opens turn-by-turn directions in your maps app.", autoMs: 5500 },
  { page: '/visit/demo-shift-1', target: 'today-clockin-btn', title: 'Clock in', text: 'When you arrive, tap here to clock in. Your location is checked automatically to confirm you\'re at the right address.', autoMs: 5500 },
  { page: '/visit/demo-shift-1', target: 'today-geofence-note', title: 'Why location matters', text: "You must be within the client's home radius to clock in — this protects both you and the agency with accurate, verified records.", autoMs: 5500 },
  { page: '/visit/demo-shift-1', target: 'visit-adl-list', title: 'Care plan checklist', text: "Once clocked in, you'll see every task from the client's care plan. Check each one off as you complete it.", autoMs: 5500 },
  { page: '/visit/demo-shift-1', target: 'visit-adl-item', title: 'Task instructions', text: 'Tap any task to see special instructions the office has added — like dietary notes or preferences.', autoMs: 5000 },
  { page: '/visit/demo-shift-1', target: 'visit-notes', title: 'Visit notes', text: "Use this space to write anything worth noting about the visit — for the office and future caregivers to see.", autoMs: 5000 },
  { page: '/visit/demo-shift-1', target: 'visit-mileage-card', title: 'Mileage', text: 'If you drove between visits, your mileage is calculated automatically from your route — or you can enter it manually.', autoMs: 5000 },
  { page: '/visit/demo-shift-1', target: 'visit-signature-section', title: 'Signatures', text: "At the end of the visit, both you and the client (or their family) sign right on the screen to confirm the visit.", autoMs: 5500 },
  { page: '/visit/demo-shift-1', target: 'visit-clockout-btn', title: 'Clock out', text: "When everything is complete, tap here to clock out and finish the visit. Your location is checked one more time.", autoMs: 5000 },

  // ---------------- Schedule ----------------
  { page: '/week', target: 'nav-schedule', title: 'The Schedule tab', text: 'This shows your full schedule — not just today.', autoMs: 4000 },
  { page: '/week', target: 'week-upcoming-tab', title: 'Upcoming visits', text: 'See every visit scheduled for the next two weeks, exactly as the office set it up.', autoMs: 5000 },
  { page: '/week', target: 'week-open-tab', title: 'Open shifts', text: "Shifts nobody has been assigned to yet appear here. If you're available, you can claim one directly.", autoMs: 5500 },
  { page: '/week', target: 'week-past-tab', title: 'Past visits & hours', text: 'Review your completed visits and verified hours here — useful for double-checking your pay.', autoMs: 5000 },

  // ---------------- Messages ----------------
  { page: '/messages', target: 'nav-messages', title: 'The Messages tab', text: "This is how you chat directly with the office — like a normal messaging app.", autoMs: 4500 },
  { page: '/messages', target: 'messages-thread-list', title: 'Your conversations', text: 'Every conversation you\'ve ever had with the office is listed here, most recent first.', autoMs: 5000 },
  { page: '/messages', target: 'messages-thread-item', title: 'Message previews', text: 'Each conversation shows the last message, when it was sent, and a badge if you have unread messages.', autoMs: 5500 },
  { page: '/messages', target: 'messages-new-btn', title: 'Start a new conversation', text: "Tap this button anytime to start a fresh conversation with the office about anything.", autoMs: 5000 },
  { page: '/messages', target: 'messages-read-receipt', title: 'Read receipts', text: "Once you open a conversation, you can see exactly when your message was sent — and when the office read it.", autoMs: 5500 },

  // ---------------- Updates ----------------
  { page: '/updates', target: 'nav-updates', title: 'The Updates tab', text: 'This is where the office sends you important notices.', autoMs: 4000 },
  { page: '/updates', target: 'updates-list', title: 'Care plan & schedule changes', text: 'When a client\'s care plan changes, or a new shift is added, you\'ll see it here first.', autoMs: 5500 },
  { page: '/updates', target: 'updates-item', title: 'Unread updates', text: 'Updates you haven\'t seen yet are highlighted. Tap one to mark it read.', autoMs: 5000 },

  // ---------------- Profile ----------------
  { page: '/profile', target: 'nav-profile', title: 'The Profile tab', text: 'This is your personal space — your info, settings, and account details.', autoMs: 4000 },
  { page: '/profile', target: 'profile-header-card', title: 'Your info', text: 'Your name and login email are shown here.', autoMs: 4000 },
  { page: '/profile', target: 'profile-change-password', title: 'Change your password', text: "You can change your password anytime — you'll just need to enter your current one first.", autoMs: 5000 },
  { page: '/profile', target: 'profile-credentials', title: 'Your credentials', text: 'Certifications like CPR, background checks, and licenses are tracked here, with expiry dates.', autoMs: 5500 },
  { page: '/profile', target: 'profile-timeoff', title: 'Request time off', text: "Need a day off? Request it right here — the office will review and approve it.", autoMs: 5000 },
  { page: '/profile', target: 'profile-offline', title: 'Offline uploads', text: 'If you clock in without signal, the app saves it and uploads automatically once you\'re back online.', autoMs: 5500 },
  { page: '/profile', target: 'profile-updates-card', title: 'App updates', text: 'When a new version of the app is available, you\'ll see it here — and it can also be checked from the sync button.', autoMs: 5500 },
  { page: '/profile', target: 'profile-signout', title: 'Signing out', text: "You can sign out here anytime — though we hope you'll stick around!", autoMs: 4000 },

  // ---------------- Sync button ----------------
  { page: '/profile', target: 'sync-button', title: 'The sync button', text: 'This button in the top corner does two things: uploads anything saved offline, and checks for app updates.', autoMs: 5500 },
  { page: '/profile', target: 'sync-button', title: 'Sync badges', text: 'A number badge means items are waiting to upload. A small gold dot means an app update is ready.', autoMs: 5500 },

  { page: '/', target: null, title: "You're all set!", text: "That's everything! You can revisit this tour anytime from your Profile page. Have a great shift!", autoMs: 6000 },
]
