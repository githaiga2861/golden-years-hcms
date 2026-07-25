// Lets code outside of React components (like push notification
// listeners) trigger navigation. A small component inside
// BrowserRouter registers the real navigate function on mount.
let navigateFn = null

export function setNavigator(fn) {
  navigateFn = fn
}

export function navigateTo(path) {
  if (navigateFn) navigateFn(path)
  else window.location.href = path
}
