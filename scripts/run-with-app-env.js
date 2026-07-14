const { spawnSync } = require('node:child_process');

const [, , appEnv, command, ...args] = process.argv;

if (!appEnv || !command) {
  console.error(
    'Usage: node scripts/run-with-app-env.js <environment> <node-script> [...args]'
  );
  process.exit(1);
}

const result = spawnSync(process.execPath, [command, ...args], {
  env: { ...process.env, APP_ENV: appEnv },
  stdio: 'inherit',
});

if (result.error) {
  throw result.error;
}

if (result.signal) {
  console.error(`Node child process stopped by ${result.signal}.`);
  process.exit(1);
}

process.exit(result.status ?? 1);
