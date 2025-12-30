import { EAS, SchemaEncoder } from '@ethereum-attestation-service/eas-sdk';
import { ethers } from 'ethers';

// Base Sepolia Configuration
const EAS_CONTRACT_ADDRESS = '0x4200000000000000000000000000000000000021';
const SCHEMA_UID = '0x...'; // Replace with your schema UID after registration
const RPC_URL = 'https://sepolia.base.org';

// Schema: string projectName, bytes32 commitHash, uint64 timestamp, bool testsPassed
const SCHEMA_STRING = 'string projectName,bytes32 commitHash,uint64 timestamp,bool testsPassed';

interface AttestationData {
  projectName: string;
  commitHash: string;
  timestamp: number;
  testsPassed: boolean;
}

/**
 * Create an on-chain attestation for a verified build
 */
export async function createAttestation(data: AttestationData): Promise<string> {
  try {
    // Initialize provider and signer
    const provider = new ethers.JsonRpcProvider(RPC_URL);
    
    // Use environment variable for private key (NEVER commit this)
    const privateKey = process.env.PRIVATE_KEY;
    if (!privateKey) {
      throw new Error('PRIVATE_KEY environment variable not set');
    }
    
    const signer = new ethers.Wallet(privateKey, provider);
    
    // Initialize EAS
    const eas = new EAS(EAS_CONTRACT_ADDRESS);
    eas.connect(signer);
    
    // Encode the attestation data
    const schemaEncoder = new SchemaEncoder(SCHEMA_STRING);
    const encodedData = schemaEncoder.encodeData([
      { name: 'projectName', value: data.projectName, type: 'string' },
      { name: 'commitHash', value: ethers.id(data.commitHash), type: 'bytes32' },
      { name: 'timestamp', value: data.timestamp, type: 'uint64' },
      { name: 'testsPassed', value: data.testsPassed, type: 'bool' }
    ]);
    
    // Create the attestation
    const tx = await eas.attest({
      schema: SCHEMA_UID,
      data: {
        recipient: ethers.ZeroAddress, // Public attestation
        expirationTime: BigInt(0), // No expiration
        revocable: false,
        data: encodedData
      }
    });
    
    const newAttestationUID = await tx.wait();
    
    return newAttestationUID;
  } catch (error: any) {
    console.error('Attestation error:', error);
    throw new Error(`Failed to create attestation: ${error.message}`);
  }
}

/**
 * Fetch recent attestations from the EAS GraphQL API
 */
export async function fetchRecentAttestations(limit: number = 10): Promise<any[]> {
  const GRAPHQL_ENDPOINT = 'https://base-sepolia.easscan.org/graphql';
  
  const query = `
    query GetAttestations($schema: String!, $take: Int!) {
      attestations(
        where: { schemaId: { equals: $schema } }
        orderBy: { time: desc }
        take: $take
      ) {
        id
        attester
        recipient
        time
        decodedDataJson
        txid
      }
    }
  `;
  
  try {
    const response = await fetch(GRAPHQL_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        query,
        variables: {
          schema: SCHEMA_UID,
          take: limit
        }
      })
    });
    
    const result = await response.json() as any;
    return result.data?.attestations || [];
  } catch (error) {
    console.error('Error fetching attestations:', error);
    return [];
  }
}

/**
 * Parse attestation data from GraphQL response
 */
export function parseAttestationData(attestation: any): {
  uid: string;
  projectName: string;
  commitHash: string;
  timestamp: number;
  testsPassed: boolean;
  txHash: string;
} {
  const decodedData = JSON.parse(attestation.decodedDataJson || '[]');
  
  return {
    uid: attestation.id,
    projectName: decodedData.find((d: any) => d.name === 'projectName')?.value?.value || 'Unknown',
    commitHash: decodedData.find((d: any) => d.name === 'commitHash')?.value?.value || '0x',
    timestamp: parseInt(attestation.time) * 1000,
    testsPassed: decodedData.find((d: any) => d.name === 'testsPassed')?.value?.value || false,
    txHash: attestation.txid
  };
}
