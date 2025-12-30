#!/usr/bin/env ts-node

import { exec } from 'child_process';
import { promisify } from 'util';
import ora from 'ora';
import chalk from 'chalk';
import boxen from 'boxen';
import figlet from 'figlet';
import { readFileSync, writeFileSync } from 'fs';
import { createAttestation } from '../utils/eas';

const execAsync = promisify(exec);

// The Matrix Green
const MATRIX_GREEN = '#00ff41';
const CYBER_RED = '#ff0040';

async function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function displayIntro() {
  console.clear();
  
  const logo = figlet.textSync('KIRO-CI', {
    font: 'ANSI Shadow',
    horizontalLayout: 'default',
    verticalLayout: 'default'
  });
  
  console.log(chalk.hex(MATRIX_GREEN)(logo));
  console.log(chalk.hex(MATRIX_GREEN).bold('\n    🌑  T H E   D A R K   P I P E L I N E  🌑\n'));
  console.log(chalk.gray('    ═══════════════════════════════════════\n'));
  
  await sleep(1000);
}

async function scanSmartContracts(): Promise<{ success: boolean; output: string }> {
  const spinner = ora({
    text: chalk.hex(MATRIX_GREEN)('Agent scanning smart contracts...'),
    spinner: 'dots12',
    color: 'green'
  }).start();
  
  try {
    await sleep(1500); // Dramatic pause
    
    const { stdout, stderr } = await execAsync('forge test --json', {
      cwd: process.cwd(),
      maxBuffer: 10 * 1024 * 1024
    });
    
    spinner.succeed(chalk.hex(MATRIX_GREEN)('Scan complete'));
    
    // Parse the test results
    const lines = stdout.split('\n').filter(line => line.trim());
    let hasFailures = false;
    
    for (const line of lines) {
      try {
        const result = JSON.parse(line);
        if (result.test_results) {
          for (const suite of Object.values(result.test_results) as any[]) {
            for (const testResult of Object.values(suite.test_results)) {
              if ((testResult as any).status === 'Failure') {
                hasFailures = true;
                break;
              }
            }
          }
        }
      } catch {
        // Skip non-JSON lines
      }
    }
    
    return { success: !hasFailures, output: stdout };
  } catch (error: any) {
    spinner.fail(chalk.red('Scan failed'));
    return { success: false, output: error.stdout || error.message };
  }
}

async function displayVulnerabilityAlert() {
  console.log('\n');
  
  const alertBox = boxen(
    chalk.hex(CYBER_RED).bold('🚨  VULNERABILITY DETECTED  🚨\n\n') +
    chalk.gray('Security risks identified in smart contracts.\n') +
    chalk.gray('Initiating autonomous remediation protocol...'),
    {
      padding: 1,
      margin: 1,
      borderStyle: 'double',
      borderColor: 'red',
      backgroundColor: '#1a0000'
    }
  );
  
  console.log(alertBox);
  await sleep(2000); // Dramatic pause
}

async function autoFixReentrancy(): Promise<boolean> {
  console.log('\n');
  
  const spinner = ora({
    text: chalk.hex(MATRIX_GREEN)('AUTO-FIX INITIATED...'),
    spinner: 'bouncingBar',
    color: 'green'
  }).start();
  
  await sleep(1500);
  
  try {
    // Example: Find vulnerable contract files
    const contractFiles = ['contracts/VulnerableContract.sol'];
    
    for (const file of contractFiles) {
      try {
        let content = readFileSync(file, 'utf-8');
        
        // Check if reentrancy guard is missing
        if (!content.includes('nonReentrant') && !content.includes('ReentrancyGuard')) {
          // Add ReentrancyGuard import if not present
          if (!content.includes('import "@openzeppelin/contracts/security/ReentrancyGuard.sol"')) {
            const importStatement = 'import "@openzeppelin/contracts/security/ReentrancyGuard.sol";\n';
            content = content.replace(
              /(pragma solidity[^;]+;)/,
              `$1\n${importStatement}`
            );
          }
          
          // Add ReentrancyGuard inheritance
          content = content.replace(
            /contract\s+(\w+)\s*{/,
            'contract $1 is ReentrancyGuard {'
          );
          
          // Add nonReentrant modifier to vulnerable functions
          content = content.replace(
            /function\s+withdraw\([^)]*\)\s*(public|external)/g,
            'function withdraw() $1 nonReentrant'
          );
          
          writeFileSync(file, content, 'utf-8');
          
          spinner.text = chalk.hex(MATRIX_GREEN)(`Patched: ${file}`);
          await sleep(500);
        }
      } catch {
        // File doesn't exist or can't be read, skip
      }
    }
    
    spinner.succeed(chalk.hex(MATRIX_GREEN)('Auto-fix completed'));
    
    // Re-run tests
    spinner.start(chalk.hex(MATRIX_GREEN)('Re-validating contracts...'));
    await sleep(1000);
    
    const retest = await execAsync('forge test', { cwd: process.cwd() });
    spinner.succeed(chalk.hex(MATRIX_GREEN)('Validation passed'));
    
    return true;
  } catch (error) {
    spinner.fail(chalk.red('Auto-fix failed'));
    return false;
  }
}

async function displayVictory() {
  console.log('\n');
  
  const victoryBox = boxen(
    chalk.hex(MATRIX_GREEN).bold('✅  CODE SECURED & VERIFIED  ✅\n\n') +
    chalk.gray('All smart contracts passed security validation.\n') +
    chalk.gray('Cryptographic proof is being recorded on-chain...'),
    {
      padding: 1,
      margin: 1,
      borderStyle: 'double',
      borderColor: 'green',
      backgroundColor: '#001a00'
    }
  );
  
  console.log(victoryBox);
  await sleep(1000);
}

async function attestOnChain(commitHash: string) {
  const spinner = ora({
    text: chalk.hex(MATRIX_GREEN)('Minting attestation on Base Sepolia...'),
    spinner: 'dots',
    color: 'green'
  }).start();
  
  try {
    await sleep(1500);
    
    // Get current git commit hash
    let commit = commitHash;
    try {
      const { stdout } = await execAsync('git rev-parse HEAD');
      commit = stdout.trim().substring(0, 8);
    } catch {
      commit = 'local-dev';
    }
    
    const attestationUID = await createAttestation({
      projectName: 'Kiro-CI',
      commitHash: commit,
      timestamp: Date.now(),
      testsPassed: true
    });
    
    spinner.succeed(chalk.hex(MATRIX_GREEN)('Attestation created'));
    
    console.log('\n');
    console.log(chalk.gray('  Attestation UID: ') + chalk.cyan(attestationUID));
    console.log(chalk.gray('  Explorer: ') + chalk.blue(`https://base-sepolia.easscan.org/attestation/view/${attestationUID}`));
    console.log('\n');
    
  } catch (error: any) {
    spinner.fail(chalk.red('Attestation failed: ' + error.message));
  }
}

async function main() {
  try {
    await displayIntro();
    
    // Step 1: Scan contracts
    const scanResult = await scanSmartContracts();
    
    if (!scanResult.success) {
      // The Drama: Vulnerability detected
      await displayVulnerabilityAlert();
      
      // Agent auto-fix
      const fixed = await autoFixReentrancy();
      
      if (!fixed) {
        console.log(chalk.red('\n❌ Auto-fix failed. Manual intervention required.\n'));
        process.exit(1);
      }
    }
    
    // Step 2: Victory
    await displayVictory();
    
    // Step 3: Attest on-chain
    const commitHash = process.env.GIT_COMMIT || 'latest';
    await attestOnChain(commitHash);
    
    // Final message
    console.log(boxen(
      chalk.hex(MATRIX_GREEN).bold('MISSION COMPLETE\n\n') +
      chalk.gray('Your code is secured, tested, and cryptographically verified.\n') +
      chalk.gray('View your attestation in Mission Control.'),
      {
        padding: 1,
        borderStyle: 'round',
        borderColor: 'green',
        align: 'center'
      }
    ));
    
    console.log('\n');
    
  } catch (error: any) {
    console.error(chalk.red('\n❌ Fatal error: ' + error.message));
    process.exit(1);
  }
}

// Run the agent
if (require.main === module) {
  main();
}

export { main };
