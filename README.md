<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://ai.google.dev/static/site-assets/images/share-ais-513315318.png" />
</div>

# KasPanitia

## Run locally

Prerequisites: Node.js and a running PostgreSQL database.

1. Install dependencies: `npm install`
2. Copy `.env.example` to `.env` and set `DATABASE_URL`, `ADMIN_EMAIL`, and a unique `ADMIN_PASSWORD` of at least 12 characters.
3. Keep `VITE_API_BASE_URL=http://localhost:4000` and the local `CORS_ORIGINS` values for development.
4. Start the API in one terminal: `npm run dev:api`
5. Start the web app in another terminal: `npm run dev`

The API creates its PostgreSQL tables and the initial admin account on first startup. The admin email and password environment values are only used when creating the first admin; changing them later does not change an existing account's password. Registrations require a full name, email, and password.

## Android APK and cross-platform web app

The Android APK is for Android only. The same app can also be built as a native iOS app for iPhone/iPad, or run as a responsive web app in browsers on iPhone/iPad, Android, Windows, macOS, and Linux. Once Render is live, each version connects to the same API and PostgreSQL database.

On a Mac with Xcode installed, set `VITE_API_BASE_URL` to the Render HTTPS origin, then run `npm run sync:ios` and open `ios/App/App.xcodeproj` in Xcode. Select an iPhone/iPad target and configure the Apple Developer signing team to build, install, or archive the iOS app. Apple distribution/signing requirements apply. Windows cannot compile or sign a native iOS app; use the web app from its browser instead. Supported browsers can also add the website to their home screen.

## Authentication and roles

- New registrations receive the `editor` role and can view and change the shared committee data.
- Admins can promote users to `treasurer` or `admin` in the Pengguna menu.
- Admin, treasurer, and editor accounts can change finance data; role checks are also enforced by the API. Viewer accounts remain read-only.
- Password reset by email is not configured.
- Existing browser `localStorage` data is not automatically copied to PostgreSQL. Before replacing the old app, export it from Laporan → Cadangkan Data (JSON). After the backend is running and you log in with an admin or treasurer account, use Laporan → Pulihkan Data (JSON) to move that backup into the shared database.

## Deployment

### Deploy the web app, shared API, and database to Render

1. Push this project to a GitHub repository. Do not upload `.env` files, passwords, or signing keys.
2. In Render, create a Blueprint from that repository and review the displayed plan and billing before confirming. [render.yaml](./render.yaml) defines one web service (serving both the frontend and API) and a persistent PostgreSQL database in Singapore.
3. When prompted for `ADMIN_EMAIL` and `ADMIN_PASSWORD`, enter them directly in Render. Use a unique password with at least 12 characters; do not send it in chat. The API creates this initial admin on first startup.
4. Wait until the `kaspanitia-api` service is live. Its public HTTPS URL is also the web app URL. Open it and test admin login and registration.
5. On a computer with Node.js, JDK, and Android SDK installed, set `VITE_API_BASE_URL` to that URL and run `npm run build:apk`. In PowerShell:

   ```powershell
   $env:VITE_API_BASE_URL = "https://YOUR-API.onrender.com"
   npm run build:apk
   ```

6. The debug-signed APK is created at `android/app/build/outputs/apk/debug/app-debug.apk`. Share it only after installing and testing it on a device. Android may ask users to allow installation from that download source.

The Android and iOS apps communicate with the hosted API over HTTPS, so all registered users share the same database. Keep the Render PostgreSQL service active to preserve shared accounts and financial data. Review Render pricing and backup settings before deploying; the Blueprint uses paid plans intended for a continuously running app and persistent database.

The APK build script rejects localhost and non-HTTPS API URLs to prevent accidentally distributing a build that cannot connect to the public service. It creates a debug-signed APK for direct installation; publishing to Google Play or issuing future production updates requires creating and securely preserving a private release-signing key.
