// One-off migration: reads recipes/*.md and inserts them into Supabase.
// Run: node scripts/migrate-recipes.js
//
// Reads .env.local automatically. Uses built-in https (no Node 18+ required).
// Safe to re-run — uses upsert (on_conflict=slug).

import { readFileSync, readdirSync } from 'fs';
import { join, basename } from 'path';
import { request } from 'https';
import yaml from 'js-yaml';

// Load .env.local
try {
  readFileSync('.env.local', 'utf8').split('\n').forEach((line) => {
    const eq = line.indexOf('=');
    if (eq > 0) process.env[line.slice(0, eq).trim()] = line.slice(eq + 1).trim();
  });
} catch { /* rely on existing process.env */ }

const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
// Service role key bypasses RLS — required for inserts from a migration script.
// Add SUPABASE_SERVICE_ROLE_KEY=eyJ... to .env.local (never commit this key).
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error('Missing VITE_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local');
  console.error('Get the service_role key from Supabase → Project Settings → API');
  process.exit(1);
}

function supabasePost(path, body) {
  return new Promise((resolve, reject) => {
    const url = new URL(path, SUPABASE_URL);
    const data = JSON.stringify(body);
    const options = {
      hostname: url.hostname,
      path: url.pathname + url.search,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(data),
        'apikey': SUPABASE_KEY,
        'Authorization': `Bearer ${SUPABASE_KEY}`,
        'Prefer': 'resolution=merge-duplicates',
      },
    };
    const req = request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => { body += chunk; });
      res.on('end', () => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          resolve(null);
        } else {
          resolve(body);
        }
      });
    });
    req.on('error', reject);
    req.write(data);
    req.end();
  });
}

const recipesDir = join(process.cwd(), 'recipes');
const files = readdirSync(recipesDir).filter((f) => f.endsWith('.md'));

for (const file of files) {
  const raw = readFileSync(join(recipesDir, file), 'utf8');
  const match = raw.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n([\s\S]*)$/);
  if (!match) {
    console.error(`  SKIP ${file} — missing frontmatter`);
    continue;
  }
  const meta = yaml.load(match[1]);
  const content = match[2].trim();
  const slug = basename(file, '.md');

  const error = await supabasePost('/rest/v1/recipes?on_conflict=slug', [{ ...meta, slug, content }]);
  if (error) {
    console.error(`  FAIL ${slug}: ${error}`);
  } else {
    console.log(`  OK   ${slug}`);
  }
}
