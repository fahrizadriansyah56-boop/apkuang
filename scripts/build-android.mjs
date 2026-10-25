import { spawnSync } from 'node:child_process';

const apiBaseUrl = process.env.VITE_API_BASE_URL;
if (!apiBaseUrl) {
  console.error('Set VITE_API_BASE_URL to the deployed API HTTPS URL before building the APK.');
  process.exit(1);
}

let apiUrl;
try {
  apiUrl = new URL(apiBaseUrl);
} catch {
  console.error('VITE_API_BASE_URL must be a valid HTTPS URL.');
  process.exit(1);
}

const apiHostname = apiUrl.hostname.toLowerCase();
const isLocalHost = apiHostname === 'localhost'
  || apiHostname.endsWith('.localhost')
  || apiHostname === '127.0.0.1'
  || apiHostname === '[::1]';

if (apiUrl.protocol !== 'https:' || isLocalHost || apiUrl.username || apiUrl.password || apiUrl.pathname !== '/' || apiUrl.search || apiUrl.hash) {
  console.error('VITE_API_BASE_URL must be the public HTTPS API origin, for example https://your-app.vercel.app.');
  process.exit(1);
}

const isWindows = process.platform === 'win32';
const npmCommand = isWindows ? 'npm.cmd' : 'npm';
const npxCommand = isWindows ? 'npx.cmd' : 'npx';
const gradleCommand = isWindows ? 'gradlew.bat' : './gradlew';

const run = (command, args, cwd = process.cwd()) => {
  const result = spawnSync(command, args, {
    cwd,
    stdio: 'inherit',
    shell: isWindows,
    env: process.env,
  });
  if (result.error) {
    console.error(result.error.message);
    process.exit(1);
  }
  if (result.status !== 0) process.exit(result.status ?? 1);
};

run(npmCommand, ['run', 'build']);
run(npxCommand, ['cap', 'sync', 'android']);
run(gradleCommand, ['assembleDebug'], `${process.cwd()}${isWindows ? '\\' : '/'}android`);

console.log(`APK created at android${isWindows ? '\\' : '/'}app${isWindows ? '\\' : '/'}build${isWindows ? '\\' : '/'}outputs${isWindows ? '\\' : '/'}apk${isWindows ? '\\' : '/'}debug${isWindows ? '\\' : '/'}app-debug.apk`);
