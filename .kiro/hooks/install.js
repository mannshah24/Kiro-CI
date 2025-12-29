#!/usr/bin/env node

/**
 * Kiro Hook Installer
 * 
 * This script installs the pre-commit hook into the local .git/hooks directory.
 * It creates a Git hook that will be executed automatically on every commit.
 */

import { existsSync, mkdirSync, writeFileSync, chmodSync } from 'fs';
import { join } from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const HOOK_CONTENT = `#!/bin/sh
# Kiro-CI Pre-Commit Hook
# This hook is managed by Kiro-CI - do not edit manually

echo "🚀 Running Kiro-CI pre-commit checks..."

# Execute the TypeScript hook
node --loader ts-node/esm .kiro/hooks/pre-commit-agent.ts

# Exit with the status code from the hook
exit $?
`;

function installHook() {
  const gitHooksDir = join(process.cwd(), '.git', 'hooks');
  const preCommitPath = join(gitHooksDir, 'pre-commit');

  // Create .git/hooks directory if it doesn't exist
  if (!existsSync(gitHooksDir)) {
    console.log('📁 Creating .git/hooks directory...');
    mkdirSync(gitHooksDir, { recursive: true });
  }

  // Write the hook file
  console.log('✍️  Writing pre-commit hook...');
  writeFileSync(preCommitPath, HOOK_CONTENT, { mode: 0o755 });

  // Make it executable (Unix/Mac)
  if (process.platform !== 'win32') {
    chmodSync(preCommitPath, 0o755);
  }

  console.log('✅ Kiro-CI hook installed successfully!');
  console.log('');
  console.log('🎉 You\'re all set! The hook will run automatically on every commit.');
  console.log('');
  console.log('Try it out:');
  console.log('  git add .');
  console.log('  git commit -m "Test Kiro-CI"');
}

try {
  installHook();
} catch (error) {
  console.error('❌ Failed to install hook:', error.message);
  process.exit(1);
}
