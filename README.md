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

The Android APK is for Android only. The same app can also be built as a native iOS app for iPhone/iPad, or run as a responsive web app in browsers on iPhone/iPad, Android, Windows, macOS, and Linux. Once Vercel and the PostgreSQL database are configured, each version connects to the same API and database.

On a Mac with Xcode installed, set `VITE_API_BASE_URL` to the Vercel HTTPS origin, then run `npm run sync:ios` and open `ios/App/App.xcodeproj` in Xcode. Select an iPhone/iPad target and configure the Apple Developer signing team to build, install, or archive the iOS app. Apple distribution/signing requirements apply. Windows cannot compile or sign a native iOS app; use the web app from its browser instead. Supported browsers can also add the website to their home screen.

## Authentication and roles

- New registrations receive the `editor` role and can view and change the shared committee data.
- Admins can promote users to `treasurer` or `admin` in the Pengguna menu.
- Admin, treasurer, and editor accounts can change finance data; role checks are also enforced by the API. Viewer accounts remain read-only.
- Password reset by email is not configured.
- Existing browser `localStorage` data is not automatically copied to PostgreSQL. Before replacing the old app, export it from Laporan → Cadangkan Data (JSON). After the backend is running and you log in with an admin or treasurer account, use Laporan → Pulihkan Data (JSON) to move that backup into the shared database.

## Deployment

### Deploy the web app and shared API to Vercel

1. Push this project to GitHub. Do not upload `.env` files, passwords, or signing keys.
2. In Vercel, choose **Add New → Project**, import this GitHub repository, and keep the root directory at the repository root. [vercel.json](./vercel.json) configures type checks and the Vite production build.
3. Create a PostgreSQL database with a provider that Vercel can connect to. Vercel hosts the frontend and API, but this project needs an external PostgreSQL database for accounts and shared financial data. Check the provider's current pricing, limits, and backup policy before choosing it.
4. In Vercel project **Settings → Environment Variables**, add:
   - `DATABASE_URL`: the connection string from the PostgreSQL provider.
   - `DATABASE_SSL`: set to `true` if the provider requires TLS; otherwise use the provider's recommended value.
   - `ADMIN_EMAIL`: the email for the initial administrator.
   - `ADMIN_PASSWORD`: a unique password of at least 12 characters.
   - `CORS_ORIGINS`: `https://localhost,capacitor://localhost` for native app requests.
   Do not send credentials in chat or commit them to GitHub. Leave `VITE_API_BASE_URL` unset for the Vercel web app; it uses the same-origin API.
5. Deploy the project. On the deployed Vercel domain, open `/api/health`; it should return `{"status":"ok"}`. Then test registration and login. The API creates database tables and the initial admin on its first request.
6. On a computer with Node.js, JDK, and Android SDK installed, set `VITE_API_BASE_URL` to the Vercel HTTPS origin and run `npm run build:apk`. In PowerShell:

   ```powershell
   $env:VITE_API_BASE_URL = "https://YOUR-PROJECT.vercel.app"
   npm run build:apk
   ```

7. The debug-signed APK is created at `android/app/build/outputs/apk/debug/app-debug.apk`. Share it only after installing and testing it on a device. Android may ask users to allow installation from that download source.

The Android and iOS apps communicate with the hosted API over HTTPS, so all registered users share the same database. Keep the PostgreSQL service active and backed up to preserve shared accounts and financial data. Review Vercel and database-provider pricing and usage limits before deploying.

The APK build script rejects localhost and non-HTTPS API URLs to prevent accidentally distributing a build that cannot connect to the public service. It creates a debug-signed APK for direct installation; publishing to Google Play or issuing future production updates requires creating and securely preserving a private release-signing key.
