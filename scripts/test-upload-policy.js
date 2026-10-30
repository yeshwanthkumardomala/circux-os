const fs = require('node:fs');
const panel = fs.readFileSync('app/components/UploadsPanel.tsx', 'utf8');
const migration = fs.readFileSync('supabase/migrations/20261030010247_upload_type_limits.sql', 'utf8');
const block = panel.match(/const allowedTypes: Record<string, string> = \{([^}]+)\}/)?.[1];
if (!block) throw new Error('Upload allowlist is missing');
const pairs = [...block.matchAll(/([a-z0-9]+): '([^']+)'/g)];
if (!pairs.length) throw new Error('Upload allowlist is empty');
for (const [, extension, mime] of pairs) {
  if (!migration.includes(`'${mime}'`)) throw new Error(`Storage policy is missing ${mime} for .${extension}`);
}
if (!panel.includes('file.size > 10 * 1024 * 1024')) throw new Error('Client upload size guard is missing');
console.log(`Upload policy passed: ${pairs.length} supported extensions and 10 MB client guard.`);
