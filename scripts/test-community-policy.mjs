// Run: node --test scripts/test-community-entry.mjs scripts/test-community-policy.mjs
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import { execFileSync } from 'node:child_process';

const require = createRequire(import.meta.url);
const { resolveCommunityEntry } = require('../assets/js/keymakers-community.js');

const ROOT = fileURLToPath(new URL('..', import.meta.url));
const HUMHUB = join(ROOT, 'community', 'humhub');
const read = (...parts) => readFileSync(join(ROOT, ...parts), 'utf8');
const readJson = (name) => JSON.parse(readFileSync(join(HUMHUB, 'config', name), 'utf8'));
const text = (html) => html.replace(/<[^>]+>/g, ' ').replace(/&rsquo;/g, '’').replace(/\s+/g, ' ');

const htmlPages = readdirSync(ROOT).filter((f) => f.endsWith('.html'));

const IGNORED = new Set(['data', 'backups', 'state', '__pycache__']);
function walk(dir) {
  return readdirSync(dir).flatMap((name) => {
    const path = join(dir, name);
    if (IGNORED.has(name) || name === '.env' || (name.startsWith('.env.') && name !== '.env.example')) return [];
    return statSync(path).isDirectory() ? walk(path) : [path];
  });
}

// --- Website entry ---------------------------------------------------------

test('the community is never embedded in an iframe', () => {
  assert.doesNotMatch(read('community.html'), /<iframe/i);
  for (const page of htmlPages) {
    for (const frame of read(page).match(/<iframe[\s\S]*?>/gi) || []) {
      assert.doesNotMatch(frame, /community|humhub|entry\.url/i, page);
    }
  }
});

test('the site has exactly one Community entry link, bound only to the resolved URL', () => {
  const entries = htmlPages.flatMap((page) => (read(page).match(/:href="entry\.url"/g) || []).map(() => page));
  assert.deepEqual(entries, ['community.html']);
  const anchor = read('community.html').match(/<a\s+x-show="entry\.show"[\s\S]*?<\/a>/)[0];
  assert.match(anchor, /:href="entry\.url"/);
  assert.doesNotMatch(anchor, /\+|`|\$\{|target=/, 'href must not be built from other values');
});

test('no public page or script links to a HumHub host directly', () => {
  const stripComments = (s) => s.replace(/\/\*[\s\S]*?\*\//g, '').replace(/<!--[\s\S]*?-->/g, '');
  const files = [...htmlPages, ...readdirSync(join(ROOT, 'assets', 'js')).map((f) => join('assets', 'js', f))];
  for (const file of files) assert.doesNotMatch(stripComments(read(file)), /community\.wvf-ny\.org|humhub|\/api\/v1/i, file);
});

test('extra config fields such as tier or candidate ID never reach the entry URL', () => {
  const cfg = {
    COMMUNITY_MODE: 'live',
    COMMUNITY_URL: 'https://community.example.org/',
    tier: 'paid', candidateId: 'rec123', email: 'a@example.com', role: 'connector', eligible: true,
  };
  const entry = resolveCommunityEntry(cfg, 'keymakers.womensventurefund.org');
  assert.equal(entry.url, 'https://community.example.org/');
  assert.deepEqual(Object.keys(entry).sort(), ['isPreview', 'label', 'mode', 'show', 'url']);
});

test('the community entry script stores nothing in the browser', () => {
  const source = read('assets', 'js', 'keymakers-community.js');
  assert.doesNotMatch(source, /localStorage|sessionStorage|document\.cookie|indexedDB|fetch\(|XMLHttpRequest/);
});

// --- Public access wording -------------------------------------------------

test('community page states the approved general and paid access policy', () => {
  const html = read('community.html');
  const body = text(html);
  assert.match(body, /Approved general participants may receive access to selected community spaces\. Paid members may receive expanded spaces, resources, and member sessions\. All access is subject to WVF review and approval\./);

  const item = (name) => text(html.match(new RegExp(`<[a-z]+ data-access="${name}"[\\s\\S]*?</(li|p)>`))[0]);
  assert.match(item('general'), /selected community spaces/);
  assert.doesNotMatch(item('general'), /Paid Member Circle|expanded/i);
  assert.match(item('paid'), /expanded spaces, resources, and member sessions/);
  assert.match(item('roles'), /Connector/);
  assert.match(item('roles'), /Key Guide/);
  assert.match(item('roles'), /not membership tiers/);
  assert.match(item('roles'), /after WVF approves the role/);
  assert.match(item('approval'), /does not automatically enable access/);
  assert.match(item('approval'), /paying for membership/);
  assert.match(item('approval'), /single Enter the Community link/);
});

test('no public page says free participants can never enter the Circle', () => {
  for (const page of htmlPages) {
    const body = text(read(page));
    assert.doesNotMatch(body, /does not include (the )?(Community )?Circle/i, page);
    assert.doesNotMatch(body, /public-facing only/i, page);
    assert.doesNotMatch(body, /Access begins at Keyholder|Circle access begins/i, page);
    assert.doesNotMatch(body, /members-only/i, page);
  }
});

test('public tier names are unchanged and mapped to general or paid', () => {
  const { publicTierMapping } = readJson('access-matrix.json');
  const tiers = Object.keys(publicTierMapping).filter((k) => !k.startsWith('$'));
  assert.deepEqual(tiers, ['Key Carrier', 'Keyholder', 'Keysmith', 'Key Shaper', 'Key Circle']);
  assert.equal(publicTierMapping['Key Carrier'].participationLevel, 'general');
  for (const tier of tiers.slice(1)) assert.equal(publicTierMapping[tier].participationLevel, 'paid', tier);
  const getInvolved = read('get-involved.html');
  for (const tier of tiers) assert.ok(getInvolved.includes(tier), `${tier} still shown on get-involved.html`);
});

// --- HumHub pilot config ---------------------------------------------------

test('every space is private and invitation-only, with a REST-valid description', () => {
  const { spaces, defaults } = readJson('spaces.json');
  assert.equal(defaults.visibility, 0);
  assert.equal(defaults.joinPolicy, 0);
  assert.deepEqual(spaces.map((s) => s.name), [
    'Welcome & Announcements', 'Community Circle', 'Paid Member Circle', 'Share Your Key',
    'Connector Hub', 'Key Guide Hub', 'Microloan Resources', 'WVF Staff',
  ]);
  assert.equal(new Set(spaces.map((s) => s.key)).size, spaces.length);
  assert.equal(new Set(spaces.map((s) => s.dashboardEnvVar)).size, spaces.length);
  for (const space of spaces) {
    assert.equal(space.visibility, 0, space.name);
    assert.equal(space.joinPolicy, 0, space.name);
    assert.ok(space.description.length <= 100, `${space.name} description must be ≤ 100 characters`);
    assert.match(space.dashboardEnvVar, /^HUMHUB_[A-Z_]+_SPACE_ID$/);
  }
});

test('config is marked as a proposal WVF can change before production', () => {
  for (const name of ['spaces.json', 'access-matrix.json']) {
    const config = readJson(name);
    assert.equal(config.status, 'proposed-pilot', name);
    assert.equal(config.approvedByWvf, false, name);
    assert.match(config.$comment, /WVF may (change|rename)/, name);
  }
});

test('general, paid, Connector, Key Guide, and staff access are independent', () => {
  const matrix = readJson('access-matrix.json');
  const spaceKeys = new Set(readJson('spaces.json').spaces.map((s) => s.key));
  const general = matrix.participationLevels.general.spaces;
  const paid = matrix.participationLevels.paid.spaces;
  const { connector, keyGuide, staff } = matrix.roles;
  const groups = { general, paid, connector: connector.spaces, keyGuide: keyGuide.spaces, staff: staff.spaces };

  const all = Object.values(groups).flat();
  assert.equal(new Set(all).size, all.length, 'no space is granted by two different groups');
  for (const key of all) assert.ok(spaceKeys.has(key), `${key} is a configured space`);
  for (const [name, keys] of Object.entries(groups)) assert.ok(keys.length > 0, `${name} has its own space`);

  assert.ok(general.includes('welcome') && general.includes('general'));
  assert.deepEqual(paid, ['paid']);
  assert.equal(matrix.participationLevels.paid.inherits, 'general');
  assert.ok(matrix.participationLevels.paid.requires.includes('paymentVerifiedWhenRequired'));
  assert.ok(matrix.participationLevels.general.requires.includes('communityAccessApproved'));
  assert.ok(!matrix.participationLevels.general.requires.some((r) => /payment|paid/i.test(r)));
  assert.ok(connector.doesNotQualify.includes('connectorInterest'));
  assert.ok(keyGuide.doesNotQualify.includes('keyGuideInterest'));
  assert.ok(!connector.requires.some((r) => /paid|payment/i.test(r)), 'Connector role is independent of payment');
  assert.ok(!keyGuide.requires.some((r) => /paid|payment/i.test(r)), 'Key Guide role is independent of payment');
  assert.deepEqual(staff.requires, ['explicitStaffAssignment']);
  assert.ok(staff.doesNotQualify.includes('emailDomain'));
});

test('lifecycle lists the eight states and revocation keeps the account record', () => {
  const { lifecycle } = readJson('access-matrix.json');
  assert.deepEqual(lifecycle.states, [
    'Not requested', 'Pending approval', 'Approved', 'Provisioning', 'Enabled', 'Provisioning failed', 'Suspended', 'Revoked',
  ]);
  assert.equal(lifecycle.suspend.humhubAccountStatus, 0);
  assert.equal(lifecycle.revoke.humhubAccountStatus, 0);
  assert.equal(lifecycle.revoke.deleteAccount, false);
});

test('synthetic users are fictional, local-only, and carry no passwords', () => {
  const demo = readJson('demo-users.json');
  assert.equal(demo.demoOnly, true);
  const levels = new Set(demo.users.map((u) => u.participationLevel));
  const roles = new Set(demo.users.flatMap((u) => u.roles));
  const states = new Set(demo.users.map((u) => u.lifecycleState));
  for (const level of ['general', 'paid']) assert.ok(levels.has(level), level);
  for (const role of ['connector', 'keyGuide', 'staff']) assert.ok(roles.has(role), role);
  for (const state of ['Enabled', 'Suspended', 'Revoked']) assert.ok(states.has(state), state);
  for (const user of demo.users) {
    assert.match(user.email, /^[a-z0-9.+-]+@example\.com$/, user.username);
    assert.match(user.username, /^demo-/);
    for (const key of Object.keys(user)) assert.doesNotMatch(key, /pass|token|secret/i, `${user.username}.${key}`);
  }
});

test('the HumHub env template has placeholders only', () => {
  const lines = readFileSync(join(HUMHUB, '.env.example'), 'utf8').split('\n').filter((l) => /^[A-Z_]+=/.test(l));
  const values = Object.fromEntries(lines.map((l) => [l.split('=')[0], l.slice(l.indexOf('=') + 1)]));
  for (const key of ['HUMHUB_DB_PASSWORD', 'MARIADB_ROOT_PASSWORD', 'HUMHUB_API_TOKEN', 'HUMHUB_ADMIN_PASSWORD', 'HUMHUB_DEMO_PASSWORD']) {
    assert.equal(values[key], '', `${key} must be empty in .env.example`);
  }
  assert.equal(values.HUMHUB_PILOT_ENV, 'local');
  assert.match(values.HUMHUB_ADMIN_EMAIL, /@example\.com$/);
});

test('HumHub package files contain no secrets or real personal data', () => {
  const files = walk(HUMHUB).filter((f) => !/\.(svg|png|jpg)$/.test(f));
  assert.ok(files.length > 20, 'package files found');
  const patterns = [
    [/-----BEGIN [A-Z ]*PRIVATE KEY-----/, 'private key'],
    [/\b(password|passwd|secret|token)\s*[:=]\s*["']?[A-Za-z0-9_\-]{16,}/i, 'hard-coded credential'],
    [/Bearer\s+[A-Za-z0-9_\-.]{20,}/, 'bearer token'],
    [/\bsmtp:\/\/[^\s"']*:[^\s"']*@/i, 'SMTP credentials'],
    [/mysql:\/\/[^\s"']*:[^\s"']*@/i, 'database URL with password'],
  ];
  const allowedEmail = /@(example\.com|wvf-ny\.org)$/i;
  for (const file of files) {
    const content = readFileSync(file, 'utf8');
    const name = relative(ROOT, file);
    for (const [pattern, label] of patterns) assert.doesNotMatch(content, pattern, `${label} in ${name}`);
    for (const email of content.match(/[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}/g) || []) {
      assert.match(email, allowedEmail, `unexpected email ${email} in ${name}`);
    }
  }
});

test('local secrets and data folders are gitignored', () => {
  const ignore = readFileSync(join(HUMHUB, '.gitignore'), 'utf8').split('\n');
  for (const entry of ['.env', 'data/', 'backups/', 'state/']) assert.ok(ignore.includes(entry), entry);
  assert.ok(ignore.includes('!.env.example'));
});

test('no HumHub package file is accidentally gitignored', () => {
  const files = walk(HUMHUB).map((f) => relative(ROOT, f));
  let ignored = '';
  try {
    ignored = execFileSync('git', ['check-ignore', '--no-index', ...files], { cwd: ROOT, encoding: 'utf8' });
  } catch (err) {
    if (err.status !== 1) throw err;
  }
  assert.equal(ignored.trim(), '', 'these package files would never be committed');
});

test('HumHub and REST versions stay pinned to the stable 1.18 line', () => {
  const compose = readFileSync(join(HUMHUB, 'docker-compose.yml'), 'utf8');
  assert.match(compose, /image: humhub\/humhub:1\.18\.6@sha256:[0-9a-f]{64}/);
  assert.match(compose, /image: mariadb:11\.8\.\d+@sha256:[0-9a-f]{64}/);
  const images = compose.match(/^\s*image: .+$/gm);
  assert.equal(images.length, 2);
  for (const image of images) assert.doesNotMatch(image, /1\.19|beta|:latest/);
  assert.match(compose, /MODULE_BLACKLIST: '\["updater","rest"\]'/);
  const install = readFileSync(join(HUMHUB, 'scripts', 'install-rest-module.sh'), 'utf8');
  assert.match(install, /VERSION="0\.11\.7"/);
  assert.match(install, /SHA256="[0-9a-f]{64}"/);
});
