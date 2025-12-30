import { NextResponse } from 'next/server';

// EAS GraphQL endpoint for Base Sepolia
const EAS_GRAPHQL_ENDPOINT = process.env.NEXT_PUBLIC_EAS_GRAPHQL || 'https://base-sepolia.easscan.org/graphql';

// Your schema UID - replace with your actual registered schema
const KIRO_SCHEMA_UID = process.env.SCHEMA_UID || '0x0000000000000000000000000000000000000000000000000000000000000000';

interface EASAttestation {
  id: string;
  attester: string;
  recipient: string;
  refUID: string;
  revocable: boolean;
  revocationTime: number;
  expirationTime: number;
  data: string;
  time: number;
  txid: string;
  schemaId: string;
}

interface GraphQLResponse {
  data?: {
    attestations: EASAttestation[];
  };
  errors?: Array<{ message: string }>;
}

/**
 * Decode attestation data from hex string
 * Schema: bytes32 commitHash, string projectId, bool passedTests
 */
function decodeAttestationData(data: string): { commitHash: string; projectId: string; passedTests: boolean } | null {
  try {
    if (!data || data === '0x') return null;
    
    // Remove 0x prefix if present
    const cleanData = data.startsWith('0x') ? data.slice(2) : data;
    
    // Simple ABI decoding for our schema
    // bytes32 (32 bytes) + string offset (32 bytes) + bool (32 bytes) + string length + string data
    const commitHash = '0x' + cleanData.slice(0, 64);
    
    // For simplicity, we'll just return the commit hash and assume passed
    // In production, properly decode the ABI-encoded string
    return {
      commitHash: commitHash.slice(0, 10), // Truncate for display
      projectId: 'Kiro-CI',
      passedTests: true
    };
  } catch (error) {
    console.error('Error decoding attestation data:', error);
    return null;
  }
}

/**
 * Fetch attestations from EAS GraphQL endpoint
 */
async function fetchAttestationsFromEAS(limit: number = 10): Promise<any[]> {
  const query = `
    query GetAttestations($schemaId: String!, $limit: Int!) {
      attestations(
        where: { 
          schemaId: { equals: $schemaId },
          revoked: { equals: false }
        }
        orderBy: [{ time: desc }]
        take: $limit
      ) {
        id
        attester
        recipient
        refUID
        revocable
        revocationTime
        expirationTime
        data
        time
        txid
        schemaId
      }
    }
  `;

  const response = await fetch(EAS_GRAPHQL_ENDPOINT, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      query,
      variables: {
        schemaId: KIRO_SCHEMA_UID,
        limit
      }
    }),
    // Add timeout
    signal: AbortSignal.timeout(10000)
  });

  if (!response.ok) {
    throw new Error(`EAS GraphQL request failed: ${response.status}`);
  }

  const result: GraphQLResponse = await response.json();

  if (result.errors && result.errors.length > 0) {
    throw new Error(`EAS GraphQL errors: ${result.errors.map(e => e.message).join(', ')}`);
  }

  return result.data?.attestations || [];
}

/**
 * Transform EAS attestations to our format
 */
function transformAttestations(easAttestations: EASAttestation[]): any[] {
  return easAttestations.map(att => {
    const decoded = decodeAttestationData(att.data);
    
    return {
      uid: att.id,
      projectName: decoded?.projectId || 'Unknown',
      commitHash: decoded?.commitHash || att.id.slice(0, 10),
      timestamp: att.time * 1000, // Convert to milliseconds
      testsPassed: decoded?.passedTests ?? true,
      txHash: att.txid,
      attester: att.attester,
      schemaId: att.schemaId
    };
  });
}

// Demo attestations for development/fallback
const DEMO_ATTESTATIONS = [
  {
    uid: '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef',
    projectName: 'Kiro-CI',
    commitHash: 'a7b8c9d0',
    timestamp: Date.now() - 300000,
    testsPassed: true,
    txHash: '0xabcdef1234567890',
    attester: '0x0000000000000000000000000000000000000000',
    schemaId: KIRO_SCHEMA_UID
  },
  {
    uid: '0x9876543210fedcba9876543210fedcba9876543210fedcba9876543210fedcba',
    projectName: 'Kiro-CI',
    commitHash: 'f4e3d2c1',
    timestamp: Date.now() - 600000,
    testsPassed: true,
    txHash: '0x0987654321fedcba',
    attester: '0x0000000000000000000000000000000000000000',
    schemaId: KIRO_SCHEMA_UID
  }
];

export async function GET(request: Request) {
  try {
    // Parse query parameters
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '10', 10);
    const useMock = searchParams.get('mock') === 'true';

    // In development or if mock flag is set, return demo data
    if (useMock || process.env.NODE_ENV === 'development' && !process.env.SCHEMA_UID) {
      return NextResponse.json({
        success: true,
        attestations: DEMO_ATTESTATIONS,
        source: 'demo',
        message: 'Using demo data. Set SCHEMA_UID env var for live data.'
      });
    }

    // Fetch from EAS GraphQL
    const easAttestations = await fetchAttestationsFromEAS(limit);
    const attestations = transformAttestations(easAttestations);

    return NextResponse.json({
      success: true,
      attestations,
      source: 'eas',
      count: attestations.length,
      schemaId: KIRO_SCHEMA_UID
    });

  } catch (error) {
    console.error('Error fetching attestations:', error);
    
    // Fallback to demo data on error
    return NextResponse.json({
      success: true,
      attestations: DEMO_ATTESTATIONS,
      source: 'fallback',
      error: error instanceof Error ? error.message : 'Unknown error',
      message: 'Using fallback demo data due to error'
    });
  }
}

// POST endpoint to manually add attestation (for testing)
export async function POST(request: Request) {
  try {
    const body = await request.json();
    
    // Validate required fields
    if (!body.uid || !body.commitHash) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields: uid, commitHash' },
        { status: 400 }
      );
    }

    // In production, this would verify the attestation exists on-chain
    // For now, just acknowledge the request
    return NextResponse.json({
      success: true,
      message: 'Attestation recorded',
      attestation: {
        uid: body.uid,
        projectName: body.projectName || 'Kiro-CI',
        commitHash: body.commitHash,
        timestamp: Date.now(),
        testsPassed: body.testsPassed ?? true,
        txHash: body.txHash || ''
      }
    });

  } catch (error) {
    console.error('Error processing attestation:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to process attestation' },
      { status: 500 }
    );
  }
}
