const fs = require('fs');
const path = require('path');

const ENV_VAR_NAME = 'APP_DEBUG';
const UNSAFE_VALUE = 'true';

// Same LINE regex as dotenv's lib/main.js (the parser react-native-dotenv
// actually uses at build time), copied verbatim so this script parses .env
// identically without depending on node_modules being installed. Re-sync
// from node_modules/dotenv/lib/main.js if that ever changes.
const LINE =
  /(?:^|^)\s*(?:export\s+)?([\w.-]+)(?:\s*=\s*?|:\s+?)(\s*'(?:\\'|[^'])*'|\s*"(?:\\"|[^"])*"|\s*`(?:\\`|[^`])*`|[^#\r\n]+)?\s*(?:#.*)?(?:$|$)/gm;

function parseEnvFile(contents) {
  const vars = {};
  const normalized = contents.replace(/\r\n?/gm, '\n');

  LINE.lastIndex = 0;
  let match;
  while ((match = LINE.exec(normalized)) !== null) {
    const key = match[1];
    let value = (match[2] || '').trim();
    const maybeQuote = value[0];
    value = value.replace(/^(['"`])([\s\S]*)\1$/gm, '$2');
    if (maybeQuote === '"') {
      value = value.replace(/\\n/g, '\n').replace(/\\r/g, '\r');
    }
    vars[key] = value;
  }
  return vars;
}

// Only checks a single static file. Fine today: babel.config.js's
// react-native-dotenv config uses one fixed `path: '.env'`, no
// `.env.<APP_ENV>`/`.local` variants. Revisit if that ever changes.
//
// Returns the unsafe value (currently always the string 'true') if envPath
// resolves APP_DEBUG to 'true', or null if it's absent/safe.
function findUnsafeDebugFlag(envPath) {
  if (!fs.existsSync(envPath)) return null;
  const vars = parseEnvFile(fs.readFileSync(envPath, 'utf8'));
  return vars[ENV_VAR_NAME] === UNSAFE_VALUE ? vars[ENV_VAR_NAME] : null;
}

function main() {
  const target = process.argv[2]
    ? path.resolve(process.argv[2])
    : path.resolve(__dirname, '..', '.env');

  const unsafeValue = findUnsafeDebugFlag(target);
  if (unsafeValue !== null) {
    console.error(
      [
        '',
        `Release build blocked: ${ENV_VAR_NAME}=${unsafeValue} in ${target}`,
        '',
        `${ENV_VAR_NAME} gates the Settings > Debug "Delete Test Account & Restart" row`,
        '(docs/superpowers/specs/2026-07-11-debug-delete-account-restart-design.md). Shipping',
        'it in a release build lets a real user tap it, forcing an unexpected logout',
        'and local data wipe (the backend hard-delete stays blocked by its own',
        'ALLOW_DEBUG_ACCOUNT_DELETE gate, but the local disruption still happens).',
        '',
        `Fix: set ${ENV_VAR_NAME}=false in ${path.basename(target)} and rebuild.`,
        '',
      ].join('\n')
    );
    process.exit(1);
  }

  console.log(
    `Release env check passed: ${ENV_VAR_NAME} is not "${UNSAFE_VALUE}" in ${path.basename(target)}.`
  );
}

if (require.main === module) {
  main();
}

module.exports = { findUnsafeDebugFlag };
