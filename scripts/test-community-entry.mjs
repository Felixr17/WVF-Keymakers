// Run: node --test scripts/test-community-entry.mjs
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';

const require = createRequire(import.meta.url);
const { resolveCommunityEntry, sanitizeCommunityUrl } = require('../assets/js/keymakers-community.js');

const URL_OK = 'https://community.example.org';

function loadShippedConfig() {
  const source = readFileSync(new URL('../assets/js/keymakers-config.js', import.meta.url), 'utf8');
  const sandbox = { window: {} };
  vm.runInNewContext(source, sandbox);
  return sandbox.window.KEYMAKERS_CONFIG;
}

test('shipped config keeps community entry disabled with no URL', () => {
  const cfg = loadShippedConfig();
  assert.equal(cfg.COMMUNITY_MODE, 'disabled');
  assert.equal(cfg.COMMUNITY_URL, '');
  assert.equal(resolveCommunityEntry(cfg, 'keymakers.womensventurefund.org').show, false);
});

test('shipped config exposes no tokens, record IDs, roles, or eligibility', () => {
  const keys = Object.keys(loadShippedConfig()).join(' ');
  assert.doesNotMatch(keys, /TOKEN|SECRET|HUMHUB|BASEROW|SPACE_ID|ROLE|TIER|ELIGIB/i);
});

test('disabled mode never shows a link, even with a valid URL', () => {
  const entry = resolveCommunityEntry({ COMMUNITY_MODE: 'disabled', COMMUNITY_URL: URL_OK }, 'localhost');
  assert.equal(entry.show, false);
  assert.equal(entry.url, '');
});

test('unknown or missing mode fails closed', () => {
  for (const mode of [undefined, '', 'on', 'LIVE!', 'true', 1]) {
    assert.equal(resolveCommunityEntry({ COMMUNITY_MODE: mode, COMMUNITY_URL: URL_OK }, 'x.org').show, false);
  }
});

test('live mode shows a single link to the approved URL', () => {
  const entry = resolveCommunityEntry({ COMMUNITY_MODE: 'live', COMMUNITY_URL: URL_OK }, 'keymakers.womensventurefund.org');
  assert.equal(entry.show, true);
  assert.equal(entry.url, 'https://community.example.org/');
  assert.equal(entry.label, 'Enter the Community');
});

test('live mode with missing URL fails closed', () => {
  assert.equal(resolveCommunityEntry({ COMMUNITY_MODE: 'live', COMMUNITY_URL: '' }, 'x.org').show, false);
});

test('preview mode shows only on allowed tester hosts', () => {
  const cfg = { COMMUNITY_MODE: 'preview', COMMUNITY_URL: URL_OK, COMMUNITY_PREVIEW_HOSTS: ['staging.example.org'] };
  assert.equal(resolveCommunityEntry(cfg, 'localhost').show, true);
  assert.equal(resolveCommunityEntry(cfg, 'staging.example.org').isPreview, true);
  assert.equal(resolveCommunityEntry(cfg, 'keymakers.womensventurefund.org').show, false);
  assert.equal(resolveCommunityEntry(cfg, '').show, false);
});

test('query strings and fragments are rejected so nothing private can ride in the URL', () => {
  for (const url of [
    'https://community.example.org/?token=abc',
    'https://community.example.org/?baserow_id=42',
    'https://community.example.org/?tier=paid',
    'https://community.example.org/#eligible',
    'https://community.example.org/?',
  ]) {
    assert.equal(resolveCommunityEntry({ COMMUNITY_MODE: 'live', COMMUNITY_URL: url }, 'x.org').show, false, url);
  }
});

test('unsafe schemes and credentials are rejected', () => {
  for (const url of [
    'http://community.example.org',
    'javascript:alert(1)',
    'https://user:pass@community.example.org',
    'not a url',
  ]) {
    assert.equal(sanitizeCommunityUrl(url, 'live'), '', url);
  }
});

test('plain http is allowed only for a localhost HumHub in preview mode', () => {
  assert.equal(sanitizeCommunityUrl('http://localhost:8080', 'preview'), 'http://localhost:8080/');
  assert.equal(sanitizeCommunityUrl('http://localhost:8080', 'live'), '');
});

test('community page opens the link in the same tab and uses no iframe', () => {
  const html = readFileSync(new URL('../community.html', import.meta.url), 'utf8');
  const anchor = html.match(/<a\s+x-show="entry\.show"[\s\S]*?<\/a>/);
  assert.ok(anchor, 'entry anchor present');
  assert.doesNotMatch(anchor[0], /target=/);
  assert.doesNotMatch(html, /<iframe[^>]*(community|humhub)/i);
});
