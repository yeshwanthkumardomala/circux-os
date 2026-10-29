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
const component = fs.readFileSync(componentPath, 'utf8');
for (const route of requiredRoutes) {
  const source = fs.readFileSync(path.join(root, route), 'utf8');
  if (!source.includes('GlobalProjectSearch')) {
    throw new Error(`Global search is missing from ${route}`);
  }
}
for (const feature of ['aria-label="Search all projects"', 'ArrowDown', 'ArrowUp', "event.key === 'Enter'", "event.key === 'Escape'", 'searchProjects(']) {
  if (!component.includes(feature)) throw new Error(`Global search is missing feature: ${feature}`);
}
console.log(`Search coverage passed: ${requiredRoutes.length} routes and keyboard/accessibility hooks verified.`);
