import { readdir, readFile } from 'node:fs/promises';
import { join } from 'node:path';
import assert from 'node:assert/strict';

const migrationsDir = new URL('../supabase/migrations/', import.meta.url);
const files = (await readdir(migrationsDir)).filter((file) => file.endsWith('.sql')).sort();

assert.ok(files.length > 0, 'No Supabase migration files found');

for (const file of files) {
  const sql = await readFile(join(migrationsDir.pathname, file), 'utf8');
  const destructiveDropTable = /^\s*drop\s+table\b/im;
  assert.ok(!destructiveDropTable.test(sql), `${file} contains a DROP TABLE statement`);

  const declarationBlocks = sql.match(/DECLARE[\s\S]*?BEGIN/gim) ?? [];

  for (const [index, block] of declarationBlocks.entries()) {
    const declarationNames = [...block.matchAll(/^\s*([a-zA-Z_][a-zA-Z0-9_]*)\s+[^;]+;/gm)].map((match) => match[1].toLowerCase());
    const duplicates = declarationNames.filter((name, declarationIndex) => declarationNames.indexOf(name) !== declarationIndex);

    assert.deepEqual(
      [...new Set(duplicates)],
      [],
      `${file} has duplicate PL/pgSQL declarations in block ${index + 1}: ${[...new Set(duplicates)].join(', ')}`
    );
  }
}

console.log(`Validated ${files.length} Supabase migration file(s): no DROP TABLE and no duplicate PL/pgSQL declarations.`);
