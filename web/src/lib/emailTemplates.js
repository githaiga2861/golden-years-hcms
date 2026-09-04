export const DOWNLOAD_LINK = 'https://hcms.goldenyearshomecarewa.com/?highlight=download'

export function buildEmailForExisting(name, password, loginEmail, changedByCaregiver) {
  const credentialsBlock = changedByCaregiver
    ? `Your login email is: ${loginEmail}\nYou've already set your own password, so we don't have it on file — please use whatever password you chose. If you've forgotten it, let the office know and we can reset it.`
    : `Your login details:\nEmail: ${loginEmail}\nPassword: ${password || '(ask the office)'}\n\nOnce you're signed in, we strongly recommend changing your password — you can do this anytime from the Profile page inside the app.`
  return {
    subject: 'Download the Golden Years Care App',
    body: `Hi ${name},

Please download the Golden Years Care App using the link below. The download button is highlighted on the page.

${DOWNLOAD_LINK}

${credentialsBlock}

Thank you,
Golden Years Home Health`,
  }
}

export function buildEmailForNew(name) {
  return {
    subject: 'Download the Golden Years Care App',
    body: `Hi ${name},

Please download the Golden Years Care App using the link below. The download button is highlighted on the page.

${DOWNLOAD_LINK}

Your login details will be provided separately by the office.

Thank you,
Golden Years Home Health`,
  }
}
