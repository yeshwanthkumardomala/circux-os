const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '..');
const requiredRoutes = [
  'app/page.tsx',
  'app/project/[id]/ProjectDetailClient.tsx',
  'app/display/DisplayController.tsx',
  'app/display/[id]/DisplayDetailClient.tsx',
  'app/display/pair/page.tsx',
  'app/qr-test/page.tsx',
  'app/offline/page.tsx',
];
const componentPath = path.join(root, 'app/components/GlobalProjectSearch.tsx');
const matcherPath = path.join(root, 'lib/project-search.ts');
const searchMigrationPath = path.join(root, 'supabase/migrations/20261029182357_circux_search.sql');
const publicSearchPath = path.join(root, 'supabase/migrations/20261029212530_public_project_search.sql');
const component = fs.readFileSync(componentPath, 'utf8');
const matcher = fs.readFileSync(matcherPath, 'utf8');
const searchMigration = fs.readFileSync(searchMigrationPath, 'utf8');
const publicSearch = fs.readFileSync(publicSearchPath, 'utf8');
for (const route of requiredRoutes) {
  const source = fs.readFileSync(path.join(root, route), 'utf8');
  if (!source.includes('GlobalProjectSearch')) {
    throw new Error(`Global search is missing from ${route}`);
  }
}
for (const feature of ['aria-label="Search all projects"', 'ArrowDown', 'ArrowUp', "event.key === 'Enter'", "event.key === 'Escape'", 'searchProjects(']) {
  if (!component.includes(feature)) throw new Error(`Global search is missing feature: ${feature}`);
}
for (const resource of ['project', 'participant', 'documentation', 'judging', 'exhibition']) {
  if (!searchMigration.includes(`'${resource}'`)) throw new Error(`Database search does not cover ${resource}`);
}
for (const feature of ["rpc('search_circux_resources'", 'p_limit: 30', 'setSearchError']) {
  if (!component.includes(feature)) throw new Error(`Cloud search is missing feature: ${feature}`);
}
if (!publicSearch.includes('p.is_public and not p.is_archived')) throw new Error('Public project search must exclude hidden and archived projects');
for (const field of ['project.name', 'project.team', 'project.category', 'project.summary', 'project.id', 'project.status', 'query.trim()', 'toLocaleLowerCase()', 'slice(0, Math.floor(limit))']) {
  if (!matcher.includes(field)) throw new Error(`Project search matching is missing: ${field}`);
}
console.log(`Search coverage passed: ${requiredRoutes.length} routes and keyboard/accessibility hooks verified.`);
