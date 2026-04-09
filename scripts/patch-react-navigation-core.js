const fs = require('fs');
const path = require('path');

const moduleDir = path.join(
  __dirname,
  '..',
  'node_modules',
  '@react-navigation',
  'core',
  'lib',
  'module',
);

const sourceFile = path.join(moduleDir, 'validatePathConfig.js');
const patchedFileName = 'validatePathConfig.metro.js';
const patchedFile = path.join(moduleDir, patchedFileName);
const targetFiles = ['index.js', 'getStateFromPath.js', 'getPathFromState.js'];

if (!fs.existsSync(sourceFile)) {
  console.warn(
    `Skipping React Navigation patch, file not found: ${sourceFile}`,
  );
  process.exit(0);
}

fs.copyFileSync(sourceFile, patchedFile);

for (const fileName of targetFiles) {
  const targetPath = path.join(moduleDir, fileName);

  if (!fs.existsSync(targetPath)) {
    console.warn(`Skipping missing React Navigation file: ${targetPath}`);
    continue;
  }

  const source = fs.readFileSync(targetPath, 'utf8');
  const patched = source.replaceAll(
    './validatePathConfig.js',
    `./${patchedFileName}`,
  );

  if (source !== patched) {
    fs.writeFileSync(targetPath, patched);
  }
}
