import { PushNotifications } from '@capacitor/push-notifications'
import { Capacitor } from '@capacitor/core'
import { supabase } from './supabase'
import { navigateTo } from './navigation'

let registered = false

/**
 * Requests notification permission, registers this device with FCM,
 * and saves the resulting token against the caregiver's record.
 * Safe to call multiple times — only runs once per app session.
 * No-ops entirely on web (push only works in the native Android app).
 *
 * IMPORTANT: listeners must be attached BEFORE calling register() —
 * the native 'registration' event can fire before a listener added
 * afterward would ever catch it, silently losing the token.
 */
export async function registerPush(caregiverId) {
  if (registered || !caregiverId) return
  if (Capacitor.getPlatform() !== 'android') return

  try {
    await PushNotifications.addListener('registration', async (token) => {
      const { error } = await supabase.from('caregiver_push_tokens')
        .upsert({ caregiver_id: caregiverId, token: token.value, platform: 'android' }, { onConflict: 'token' })
      if (error) console.error('Failed to save push token', error)
      else console.log('Push token saved successfully')
    })

    await PushNotifications.addListener('registrationError', (err) => {
      console.error('Push registration error', err)
    })

    await PushNotifications.addListener('pushNotificationActionPerformed', (action) => {
      const page = action.notification?.data?.page
      if (page) navigateTo(page)
    })

    const perm = await PushNotifications.requestPermissions()
    if (perm.receive !== 'granted') {
      console.warn('Push permission not granted:', perm.receive)
      return
    }

    await PushNotifications.register()
    registered = true
  } catch (e) {
    console.error('Push setup failed', e)
  }
}
