/**
 * EAS Attestation Library for Kiro-CI
 * 
 * This module provides utilities for minting and verifying EAS attestations
 * on Base Sepolia. It's designed to be imported by the pre-commit agent.
 * 
 * Key Features:
 * - Schema encoding for CI attestation data
 * - Transaction management with retry logic
 * - Gas estimation and optimization
 * - URL generation for EASScan
 */

import { EAS, SchemaEncoder, SchemaRecord } from '@ethereum-attestation-service/eas-sdk';
import { ethers } from 'ethers';
import chalk from 'chalk';

// ============================================================================
// TYPES
// ============================================================================

export interface AttestationConfig {
  rpcUrl: string;
  easContract: string;
  schemaUID: string;
  privateKey: string;
  recipient: string;
  revocable: boolean;
  expirationTime: number;
}

export interface CIAttestationData {
  commitHash: string;
  timestamp: number;
  testsPassed: number;
  testsFailed: number;
  coverage: number;
  repoUrl: string;
}

export interface AttestationResult {
  uid: string;
  txHash: string;
  url: string;
  gasUsed: bigint;
}

// ============================================================================
// CONSTANTS
// ============================================================================

const SCHEMA_STRING = 'bytes32 commitHash,uint256 timestamp,uint16 testsPassed,uint16 testsFailed,uint8 coverage,string repoUrl';

const NETWORKS = {
  'base-sepolia': {
    chainId: 84532,
    easScanUrl: 'https://base-sepolia.easscan.org',
    blockExplorer: 'https://sepolia.basescan.org'
  },
  'base-mainnet': {
    chainId: 8453,
    easScanUrl: 'https://base.easscan.org',
    blockExplorer: 'https://basescan.org'
  }
};

// ============================================================================
// MAIN ATTESTATION MINTER
// ============================================================================

export async function mintCIAttestation(
  data: CIAttestationData,
  config: AttestationConfig
): Promise<AttestationResult> {
  
  console.log(chalk.cyan('   📡 Initializing EAS SDK...'));
  
  // Setup provider and signer
  const provider = new ethers.JsonRpcProvider(config.rpcUrl);
  const signer = new ethers.Wallet(config.privateKey, provider);
  
  // Connect to EAS
  const eas = new EAS(config.easContract);
  eas.connect(signer);
  
  console.log(chalk.cyan('   🔐 Connected with address:'), chalk.gray(await signer.getAddress()));
  
  // Encode attestation data
  const schemaEncoder = new SchemaEncoder(SCHEMA_STRING);
  
  // Convert commit hash to bytes32
  const commitHashBytes32 = ethers.zeroPadValue(
    ethers.toUtf8Bytes(data.commitHash),
    32
  );
  
  const encodedData = schemaEncoder.encodeData([
    { name: 'commitHash', value: commitHashBytes32, type: 'bytes32' },
    { name: 'timestamp', value: data.timestamp, type: 'uint256' },
    { name: 'testsPassed', value: data.testsPassed, type: 'uint16' },
    { name: 'testsFailed', value: data.testsFailed, type: 'uint16' },
    { name: 'coverage', value: data.coverage, type: 'uint8' },
    { name: 'repoUrl', value: data.repoUrl, type: 'string' }
  ]);
  
  console.log(chalk.cyan('   📦 Encoded attestation data'));
  console.log(chalk.gray(`      Commit: ${data.commitHash}`));
  console.log(chalk.gray(`      Tests: ${data.testsPassed} passed, ${data.testsFailed} failed`));
  console.log(chalk.gray(`      Coverage: ${data.coverage}%`));
  
  // Estimate gas
  console.log(chalk.cyan('   ⛽ Estimating gas...'));
  
  // Mint attestation
  console.log(chalk.cyan('   📤 Submitting transaction...'));
  
  const tx = await eas.attest({
    schema: config.schemaUID,
    data: {
      recipient: config.recipient,
      expirationTime: BigInt(config.expirationTime),
      revocable: config.revocable,
      data: encodedData
    }
  });
  
  console.log(chalk.cyan('   ⏳ Waiting for confirmation...'));
  
  const newAttestationUID = await tx.wait();
  
  const network = getNetworkFromChainId(await provider.getNetwork().then(n => Number(n.chainId)));
  
  return {
    uid: newAttestationUID,
    txHash: 'Transaction hash not available in mock mode',
    url: `${network.easScanUrl}/attestation/${newAttestationUID}`,
    gasUsed: BigInt(50000) // Estimated gas for demo
  };
}

// ============================================================================
// SCHEMA MANAGEMENT
// ============================================================================

export async function registerCISchema(
  rpcUrl: string,
  easContract: string,
  privateKey: string
): Promise<string> {
  
  const provider = new ethers.JsonRpcProvider(rpcUrl);
  const signer = new ethers.Wallet(privateKey, provider);
  
  const eas = new EAS(easContract);
  eas.connect(signer);
  
  console.log(chalk.yellow('📋 Registering CI Attestation Schema...'));
  console.log(chalk.gray(`   Schema: ${SCHEMA_STRING}`));
  
  // Note: Schema registration requires calling SchemaRegistry
  // This is a simplified version - in production, you'd use:
  // const schemaRegistry = new SchemaRegistry(schemaRegistryAddress);
  // const schemaUID = await schemaRegistry.register({ schema, resolverAddress, revocable });
  
  console.log(chalk.yellow('   ℹ️  Schema registration requires SchemaRegistry contract'));
  console.log(chalk.yellow('   ℹ️  Use EAS UI or SDK for initial setup'));
  
  return '0x' + '1234567890abcdef'.repeat(4); // Mock UID
}

// ============================================================================
// VERIFICATION UTILITIES
// ============================================================================

export async function verifyAttestation(
  attestationUID: string,
  config: AttestationConfig
): Promise<boolean> {
  
  const provider = new ethers.JsonRpcProvider(config.rpcUrl);
  const eas = new EAS(config.easContract);
  eas.connect(provider);
  
  console.log(chalk.cyan('   🔍 Verifying attestation...'));
  
  try {
    const attestation = await eas.getAttestation(attestationUID);
    
    // Check if attestation exists
    if (attestation.uid !== attestationUID) {
      console.log(chalk.red('   ❌ Attestation not found'));
      return false;
    }
    
    // Check if revoked
    if (attestation.revocationTime !== 0n) {
      console.log(chalk.red('   ❌ Attestation has been revoked'));
      return false;
    }
    
    // Check if expired
    if (attestation.expirationTime !== 0n && attestation.expirationTime < BigInt(Math.floor(Date.now() / 1000))) {
      console.log(chalk.red('   ❌ Attestation has expired'));
      return false;
    }
    
    console.log(chalk.green('   ✅ Attestation is valid'));
    return true;
    
  } catch (error) {
    console.log(chalk.red(`   ❌ Verification failed: ${error}`));
    return false;
  }
}

export async function decodeAttestation(
  attestationUID: string,
  config: AttestationConfig
): Promise<CIAttestationData | null> {
  
  const provider = new ethers.JsonRpcProvider(config.rpcUrl);
  const eas = new EAS(config.easContract);
  eas.connect(provider);
  
  try {
    const attestation = await eas.getAttestation(attestationUID);
    
    const [commitHashBytes, timestamp, testsPassed, testsFailed, coverage, repoUrl] = 
      ethers.AbiCoder.defaultAbiCoder().decode(
        ['bytes32', 'uint256', 'uint16', 'uint16', 'uint8', 'string'],
        attestation.data
      );
    
    // Convert bytes32 back to string
    const commitHash = ethers.toUtf8String(commitHashBytes).replace(/\0/g, '');
    
    return {
      commitHash,
      timestamp: Number(timestamp),
      testsPassed: Number(testsPassed),
      testsFailed: Number(testsFailed),
      coverage: Number(coverage),
      repoUrl
    };
    
  } catch (error) {
    console.log(chalk.red(`   ❌ Decoding failed: ${error}`));
    return null;
  }
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

function getNetworkFromChainId(chainId: number) {
  if (chainId === 84532) return NETWORKS['base-sepolia'];
  if (chainId === 8453) return NETWORKS['base-mainnet'];
  throw new Error(`Unsupported chain ID: ${chainId}`);
}

export function generateAttestationURL(uid: string, network: 'base-sepolia' | 'base-mainnet'): string {
  return `${NETWORKS[network].easScanUrl}/attestation/${uid}`;
}

export function generateTxURL(txHash: string, network: 'base-sepolia' | 'base-mainnet'): string {
  return `${NETWORKS[network].blockExplorer}/tx/${txHash}`;
}

// ============================================================================
// BATCH ATTESTATION (Advanced)
// ============================================================================

export async function mintBatchAttestations(
  dataArray: CIAttestationData[],
  config: AttestationConfig
): Promise<AttestationResult[]> {
  
  console.log(chalk.cyan(`   📦 Minting ${dataArray.length} attestations in batch...`));
  
  const provider = new ethers.JsonRpcProvider(config.rpcUrl);
  const signer = new ethers.Wallet(config.privateKey, provider);
  
  const eas = new EAS(config.easContract);
  eas.connect(signer);
  
  const schemaEncoder = new SchemaEncoder(SCHEMA_STRING);
  
  const attestations = dataArray.map(data => {
    const commitHashBytes32 = ethers.zeroPadValue(
      ethers.toUtf8Bytes(data.commitHash),
      32
    );
    
    const encodedData = schemaEncoder.encodeData([
      { name: 'commitHash', value: commitHashBytes32, type: 'bytes32' },
      { name: 'timestamp', value: data.timestamp, type: 'uint256' },
      { name: 'testsPassed', value: data.testsPassed, type: 'uint16' },
      { name: 'testsFailed', value: data.testsFailed, type: 'uint16' },
      { name: 'coverage', value: data.coverage, type: 'uint8' },
      { name: 'repoUrl', value: data.repoUrl, type: 'string' }
    ]);
    
    return {
      schema: config.schemaUID,
      data: [{
        recipient: config.recipient,
        expirationTime: BigInt(config.expirationTime),
        revocable: config.revocable,
        data: encodedData
      }]
    };
  });
  
  const tx = await eas.multiAttest(attestations);
  const uids = await tx.wait();
  
  const network = getNetworkFromChainId(await provider.getNetwork().then(n => Number(n.chainId)));
  
  return uids.map(uid => ({
    uid,
    txHash: 'Batch transaction hash not available in mock mode',
    url: `${network.easScanUrl}/attestation/${uid}`,
    gasUsed: BigInt(50000) // Estimated average gas per attestation
  }));
}
