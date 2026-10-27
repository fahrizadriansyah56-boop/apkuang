<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://ai.google.dev/static/site-assets/images/share-ais-513315318.png" />
</div>

# KasPanitia

## Run locally

Prerequisite: Node.js.

1. Install dependencies: `npm install`
2. Start the app: `npm run dev`
3. Open the local URL printed by Vite.

No account, backend, or database is required. Finance data is saved in the current browser's local storage.

## Private data per user

- The app opens directly without login or registration.
- Finance data stays in local storage on the current browser profile or app installation; it is not sent to a shared server.
- Different devices, browsers, and browser profiles have separate data. Data does not sync between them.
- People sharing the same browser profile or app installation will see the same local data. Use a separate browser profile or device for separate records.
- Clearing browser/app storage or uninstalling the app may erase its data. Export a backup from Laporan → Cadangkan Data (JSON) and keep it somewhere safe.
- To move data to another device, export the JSON backup on the old device and restore it from Laporan → Pulihkan Data (JSON) on the new device.

## Deploy the web app to Vercel

1. Push the repository to GitHub.
2. In Vercel, choose **Add New → Project** and import this repository.
3. Keep the root directory at the repository root. Vercel uses [vercel.json](./vercel.json) to build the static web app.
4. No database or authentication environment variables are needed. Deploy, then open the Vercel project URL.

Each visitor's data is stored separately in that visitor's browser. The app does not provide shared accounts or cross-device synchronization.

## Android APK and iOS app

The Android APK is for Android only. The same app can also run as a responsive web app on iPhone/iPad, Android, Windows, macOS, and Linux. A native iOS build requires a Mac with Xcode and Apple signing.

On a computer with Node.js, JDK, and Android SDK installed, run:

```powershell
npm run build:apk
```

The debug-signed APK is created at `android/app/build/outputs/apk/debug/app-debug.apk`. Install and test it before sharing. Android may ask users to allow installation from that download source. Publishing to Google Play or issuing future production updates requires creating and securely preserving a private release-signing key.

On a Mac with Xcode installed, run `npm run sync:ios`, then open `ios/App/App.xcodeproj` in Xcode. Select an iPhone/iPad target and configure the Apple Developer signing team. Windows cannot compile or sign a native iOS app.
