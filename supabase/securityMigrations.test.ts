import test from 'node:test';
import assert from 'node:assert/strict';
import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

const migrationsDir = new URL('./migrations/', import.meta.url);
const migrationFiles = readdirSync(migrationsDir)
  .filter((file) => file.endsWith('.sql'))
  .sort();

const privateTables = [
  'profiles',
  'orders',
  'order_items',
  'payments',
  'shipments',
  'events',
  'ai_conversations',
  'audit_events',
];

function readMigration(file: string) {
  return readFileSync(new URL(file, migrationsDir), 'utf8');
}

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

test('production migrations do not drop private or transactional tables', () => {
  const destructiveTablePattern = privateTables.map(escapeRegExp).join('|');
  const dropPrivateTable = new RegExp(
    `\\bdrop\\s+table(?:\\s+if\\s+exists)?\\s+(?:public\\.)?(?:${destructiveTablePattern})\\b`,
    'i'
  );

  const offenders = migrationFiles.flatMap((file) => {
    const sql = readMigration(file);
    return dropPrivateTable.test(sql) ? [file] : [];
  });

  assert.deepEqual(offenders, []);
});

test('private-table policies in migrations are not globally permissive', () => {
  const privateTablePattern = privateTables.map(escapeRegExp).join('|');
  const policyOnPrivateTable = new RegExp(`\\bon\\s+(?:public\\.)?(?:${privateTablePattern})\\b`, 'i');
  const permissivePolicyCheck = /\b(?:using|with\s+check)\s*\(\s*true\s*\)/i;

  const offenders = migrationFiles.flatMap((file) => {
    const sql = readMigration(file);
    return sql
      .split(/;\s*(?:\n|$)/)
      .filter((statement) => /\bcreate\s+policy\b/i.test(statement))
      .filter((statement) => policyOnPrivateTable.test(statement) && permissivePolicyCheck.test(statement))
      .map((statement) => `${file}: ${statement.trim().split(/\s+/).slice(0, 8).join(' ')}`);
  });

  assert.deepEqual(offenders, []);
});

test('sensitive commerce migration creates RLS-guarded tables and policies', () => {
  const sql = readMigration('20260629_restrict_sensitive_commerce_tables.sql');

  for (const table of ['payments', 'shipments', 'events', 'ai_conversations', 'audit_events']) {
    assert.match(sql, new RegExp(`create\\s+table\\s+if\\s+not\\s+exists\\s+public\\.${table}\\b`, 'i'));
    assert.match(sql, new RegExp(`alter\\s+table\\s+public\\.${table}\\s+enable\\s+row\\s+level\\s+security`, 'i'));
    assert.match(sql, new RegExp(`revoke\\s+all\\s+on\\s+table\\s+public\\.${table}\\s+from\\s+anon`, 'i'));
  }

  for (const policy of [
    'payments_select_own_or_admin',
    'shipments_select_own_or_admin',
    'events_insert_own_or_anonymous',
    'events_admin_read',
    'ai_conversations_select_own_or_admin',
    'audit_events_admin_read',
  ]) {
    assert.match(sql, new RegExp(`create\\s+policy\\s+"${policy}"`, 'i'));
  }
});

test('RLS audit document tracks legacy backup findings and corrective migrations', () => {
  const audit = readFileSync(join(process.cwd(), 'docs/SUPABASE_RLS_AUDIT.md'), 'utf8');
  const backup = readFileSync(join(process.cwd(), 'supabase/backup.sql'), 'utf8');

  for (const legacyPolicy of [
    'Anyone can read orders',
    'Public profiles are viewable by everyone.',
    'Users can read their own orders',
  ]) {
    assert.match(backup, new RegExp(escapeRegExp(legacyPolicy)));
    assert.match(audit, new RegExp(escapeRegExp(legacyPolicy)));
  }

  for (const correctiveMigration of [
    '20260628_harden_profiles_roles.sql',
    '20260629_restrict_sensitive_commerce_tables.sql',
  ]) {
    assert.match(audit, new RegExp(escapeRegExp(correctiveMigration)));
  }
});
