/**
 * notarize.js
 *
 * @see https://oldj.net/blog/2019/12/29/electron-builder-sign-and-notarize-for-macos
 */

require('dotenv').config()
const { notarize } = require('@electron/notarize')
const { exec } = require('child_process')

function getPasswordFromKeychain(account, service) {
  return new Promise((resolve, reject) => {
    const command = `security find-generic-password -a '${account}' -s '${service}' -w`
    exec(command, (error, stdout, stderr) => {
      if (error) {
        reject(new Error(`Error fetching password: ${stderr}`))
      } else {
        resolve(stdout.trim())
      }
    })
  })
}

exports.default = async function notarizing(context) {
  const appName = context.packager.appInfo.productFilename
  const { electronPlatformName, appOutDir } = context
  console.log(`in notarize, ${electronPlatformName}...`)
  if (electronPlatformName !== 'darwin') {
    return
  }

  // Skip notarization for dev builds or when SKIP_NOTARIZATION is set
  if (process.env.MAKE_FOR === 'dev' || process.env.SKIP_NOTARIZATION) {
    console.log('skip notarization.')
    return
  }

  let appPath = `${appOutDir}/${appName}.app`
  let {
    APP_BUNDLE_ID: appBundleId,
    TEAM_ID: teamId,
    APPLE_ID: appleId,
    APPLE_APP_SPECIFIC_PASSWORD: appleIdPassword,
  } = process.env

  // Try to get password from keychain if not provided
  if (!appleIdPassword && appleId) {
    try {
      //appleIdPassword = `@keychain:"Apple Notarize: ${appleId}"`
      appleIdPassword = await getPasswordFromKeychain(appleId, `Apple Notarize: ${appleId}`)
      process.env.APPLE_APP_SPECIFIC_PASSWORD = appleIdPassword
    } catch (error) {
      console.log('Password not found in keychain, skipping notarization.')
      console.log('Error:', error.message)
      return
    }
  }

  // Check if all required credentials are available
  if (!appleId || !appBundleId || !teamId || !appleIdPassword) {
    console.log('Missing required notarization credentials:')
    console.log('  - APPLE_ID:', appleId ? '✓' : '✗')
    console.log('  - APP_BUNDLE_ID:', appBundleId ? '✓' : '✗')
    console.log('  - TEAM_ID:', teamId ? '✓' : '✗')
    console.log('  - APPLE_APP_SPECIFIC_PASSWORD:', appleIdPassword ? '✓' : '✗')
    console.log('Not notarized.')
    return
  }

  console.log('Start notarizing...')
  await notarize({
    appPath,
    tool: 'notarytool',
    //appBundleId,
    //ascProvider,
    appleId,
    appleIdPassword,
    teamId,
  })
  console.log('Notarize done.')
}
