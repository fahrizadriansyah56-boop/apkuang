import { spawnSync } from 'node:child_process';

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
