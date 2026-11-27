// Run: node --test backend/services/errorParser.test.js
const test = require('node:test');
const assert = require('node:assert');
const { parseError } = require('./errorParser');

const repo = ['server.js', 'routes/orders.js', 'middleware/auth.js', 'services/db.js', 'main.py'];

test('node runtime trace matches own files and hides node_modules', () => {
  const text = [
    "TypeError: Cannot read properties of undefined (reading 'id')",
    '    at getOrders (/app/routes/orders.js:27:31)',
    '    at Layer.handle [as handle_request] (/app/node_modules/express/lib/router/layer.js:95:5)',
    '    at next (/app/node_modules/express/lib/router/route.js:149:13)',
    '    at authenticate (/app/middleware/auth.js:14:5)',
    '    at Server.handle (/app/server.js:22:3)',
  ].join('\n');
  const r = parseError(text, repo);
  assert.strictEqual(r.kind, 'runtime');
  assert.deepStrictEqual(r.matched, [
    { path: 'routes/orders.js', line: 27 },
    { path: 'middleware/auth.js', line: 14 },
    { path: 'server.js', line: 22 },
  ]);
  assert.strictEqual(r.hiddenFrames, 2);
  assert.ok(!r.cleaned.includes('node_modules'));
});

test('bare node frame without parentheses', () => {
  const r = parseError('Error: boom\n    at /app/services/db.js:9:11', repo);
  assert.deepStrictEqual(r.matched, [{ path: 'services/db.js', line: 9 }]);
});

test('build error', () => {
  const text = '[vite] Internal server error: Failed to resolve import "./services/db" from "routes/orders.js"\n  File: /app/routes/orders.js:3:21';
  const r = parseError(text, repo);
  assert.strictEqual(r.kind, 'build');
  assert.deepStrictEqual(r.matched, [{ path: 'routes/orders.js', line: 3 }]);
});

test('setup error has no matched files', () => {
  const r = parseError('npm ERR! code ERESOLVE\nnpm ERR! Could not resolve dependency', repo);
  assert.strictEqual(r.kind, 'setup');
  assert.deepStrictEqual(r.matched, []);
});

test('python traceback', () => {
  const r = parseError('Traceback (most recent call last):\n  File "/app/main.py", line 12, in handler\nKeyError: 1', repo);
  assert.deepStrictEqual(r.matched, [{ path: 'main.py', line: 12 }]);
});