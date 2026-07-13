const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');

const { findUnsafeDebugFlag } = require('./check-release-env');

function writeTempEnv(t, contents) {
  const file = path.join(
    os.tmpdir(),
    `check-release-env-${process.pid}-${Math.random().toString(36).slice(2)}.env`
  );
  fs.writeFileSync(file, contents);
  t.after(() => fs.rmSync(file, { force: true }));
  return file;
}

test('flags APP_DEBUG=true as unsafe', (t) => {
  const file = writeTempEnv(t, 'APP_DEBUG=true\n');
  assert.equal(findUnsafeDebugFlag(file), 'true');
});

test('treats APP_DEBUG=false as safe', (t) => {
  const file = writeTempEnv(t, 'APP_DEBUG=false\n');
  assert.equal(findUnsafeDebugFlag(file), null);
});

test('treats a missing .env file as safe', () => {
  const missing = path.join(os.tmpdir(), 'does-not-exist-check-release-env.env');
  assert.equal(findUnsafeDebugFlag(missing), null);
});

test('treats an unset APP_DEBUG as safe', (t) => {
  const file = writeTempEnv(t, 'API_BASE_URL=https://staging.example.com\n');
  assert.equal(findUnsafeDebugFlag(file), null);
});

test('ignores a commented-out APP_DEBUG=true', (t) => {
  const file = writeTempEnv(t, '# APP_DEBUG=true\nAPP_DEBUG=false\n');
  assert.equal(findUnsafeDebugFlag(file), null);
});

test('quoted APP_DEBUG="true" is still unsafe (matches react-native-dotenv quote-stripping)', (t) => {
  const file = writeTempEnv(t, 'APP_DEBUG="true"\n');
  assert.equal(findUnsafeDebugFlag(file), 'true');
});

test('last assignment wins when APP_DEBUG is set twice', (t) => {
  const file = writeTempEnv(t, 'APP_DEBUG=true\nAPP_DEBUG=false\n');
  assert.equal(findUnsafeDebugFlag(file), null);
});

test('tolerates whitespace around the equals sign', (t) => {
  const file = writeTempEnv(t, 'APP_DEBUG = true\n');
  assert.equal(findUnsafeDebugFlag(file), 'true');
});

test('strips a trailing inline comment on an unquoted value', (t) => {
  const file = writeTempEnv(t, 'APP_DEBUG=true # TODO remove before release\n');
  assert.equal(findUnsafeDebugFlag(file), 'true');
});

test('strips a trailing inline comment with no space before the #', (t) => {
  const file = writeTempEnv(t, 'APP_DEBUG=true#comment\n');
  assert.equal(findUnsafeDebugFlag(file), 'true');
});

test('strips a trailing inline comment after a quoted value', (t) => {
  const file = writeTempEnv(t, 'APP_DEBUG="true" # comment\n');
  assert.equal(findUnsafeDebugFlag(file), 'true');
});

test('treats a backtick-quoted value as unsafe', (t) => {
  const file = writeTempEnv(t, 'APP_DEBUG=`true`\n');
  assert.equal(findUnsafeDebugFlag(file), 'true');
});

test('tolerates a tab after export (not just a literal space)', (t) => {
  const file = writeTempEnv(t, 'export\tAPP_DEBUG=true\n');
  assert.equal(findUnsafeDebugFlag(file), 'true');
});

test('supports colon-style assignment (APP_DEBUG: true)', (t) => {
  const file = writeTempEnv(t, 'APP_DEBUG: true\n');
  assert.equal(findUnsafeDebugFlag(file), 'true');
});

test('parses repeatedly without leaking regex lastIndex state across calls', (t) => {
  const file = writeTempEnv(t, 'APP_DEBUG=true\n');
  assert.equal(findUnsafeDebugFlag(file), 'true');
  assert.equal(findUnsafeDebugFlag(file), 'true');
  assert.equal(findUnsafeDebugFlag(file), 'true');
});
