/**
 * Streams the latest Care App APK through our own domain, so caregivers
 * only ever see hcms.goldenyearshomecarewa.com — never the underlying
 * GitHub release URL. Always serves whatever the newest build is, by
 * reading the same version.json the rest of the system uses.
 */
export default async function handler(req, res) {
  try {
    const versionRes = await fetch(
      'https://care.goldenyearshomecarewa.com/downloads/version.json',
      { cache: 'no-store' }
    )
    if (!versionRes.ok) throw new Error(`version.json returned ${versionRes.status}`)
    const { apkUrl } = await versionRes.json()
    if (!apkUrl) throw new Error('No apkUrl in version.json')

    const apkRes = await fetch(apkUrl)
    if (!apkRes.ok) throw new Error(`APK fetch returned ${apkRes.status}`)

    res.setHeader('Content-Type', 'application/vnd.android.package-archive')
    res.setHeader('Content-Disposition', 'attachment; filename="golden-years-care.apk"')
    res.setHeader('Cache-Control', 'no-store')
    const contentLength = apkRes.headers.get('content-length')
    if (contentLength) res.setHeader('Content-Length', contentLength)

    const buffer = Buffer.from(await apkRes.arrayBuffer())
    res.status(200).send(buffer)
  } catch (e) {
    console.error('APK download proxy failed:', e)
    res.status(502).send('The download is temporarily unavailable. Please try again shortly.')
  }
}
