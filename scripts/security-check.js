const { spawnSync } = require('node:child_process');

const IGNORED_EXPO_TOOLCHAIN_PACKAGES = new Set([
  '@expo/cli',
  '@expo/config',
  '@expo/config-plugins',
  '@expo/local-build-cache-provider',
  '@expo/metro-config',
  '@expo/plist',
  '@expo/prebuild-config',
  '@xmldom/xmldom',
  'expo',
  'expo-constants',
  'expo-manifests',
  'expo-splash-screen',
  'uuid',
  'xcode',
]);

function formatAdvisory(vulnerability) {
  const via = Array.isArray(vulnerability.via)
    ? vulnerability.via
        .map(item => {
          if (typeof item === 'string') {
            return item;
          }

          return item?.title || item?.url || 'unknown advisory';
        })
        .join('; ')
    : 'unknown advisory';

  return `${vulnerability.name} (${vulnerability.severity}): ${via}`;
}

const audit = spawnSync('npm', ['audit', '--json', '--audit-level=moderate'], {
  encoding: 'utf8',
  cwd: process.cwd(),
});

const combinedOutput = `${audit.stdout || ''}\n${audit.stderr || ''}`;

if (
  combinedOutput.includes('audit endpoint returned an error') ||
  combinedOutput.includes('ENOTFOUND registry.npmjs.org') ||
  combinedOutput.includes('ECONNRESET') ||
  combinedOutput.includes('ETIMEDOUT')
) {
  console.warn(
    'Security check skipped: npm audit endpoint is unavailable from this environment.',
  );
  process.exit(0);
}

let auditResult;

try {
  auditResult = JSON.parse(audit.stdout || '{}');
} catch (error) {
  if (audit.status === 0) {
    process.exit(0);
  }

  console.error('Security check failed: unable to parse npm audit output.');
  process.exit(1);
}

const vulnerabilities = Object.values(auditResult.vulnerabilities || {});

if (vulnerabilities.length === 0) {
  process.exit(0);
}

const actionableVulnerabilities = vulnerabilities.filter(vulnerability => {
  return !IGNORED_EXPO_TOOLCHAIN_PACKAGES.has(vulnerability.name);
});

if (actionableVulnerabilities.length === 0) {
  console.warn(
    'Security check warning: only known Expo toolchain advisories were found in transitive dependencies.',
  );

  vulnerabilities.forEach(vulnerability => {
    console.warn(`- ${formatAdvisory(vulnerability)}`);
  });

  process.exit(0);
}

console.error('Security check failed with actionable vulnerabilities:');
actionableVulnerabilities.forEach(vulnerability => {
  console.error(`- ${formatAdvisory(vulnerability)}`);
});
process.exit(1);
