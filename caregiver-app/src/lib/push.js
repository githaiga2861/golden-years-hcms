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
 */
export async function registerPush(caregiverId) {
  if (registered || !caregiverId) return
  if (Capacitor.getPlatform() !== 'android') return
  registered = true

  try {
    const perm = await PushNotifications.requestPermissions()
    if (perm.receive !== 'granted') return

    await PushNotifications.register()

    PushNotifications.addListener('registration', async (token) => {
      await supabase.from('caregiver_push_tokens')
        .upsert({ caregiver_id: caregiverId, token: token.value, platform: 'android' }, { onConflict: 'token' })
    })

    PushNotifications.addListener('registrationError', (err) => {
      console.error('Push registration error', err)
    })

    // Tapping a notification brings the app to the front; deep-linking to
    // a specific page happens via the "data" payload's "page" field.
    PushNotifications.addListener('pushNotificationActionPerformed', (action) => {
      const page = action.notification?.data?.page
      if (page) navigateTo(page)
    })
  } catch (e) {
    console.error('Push setup failed', e)
  }
}
