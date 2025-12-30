import { NextResponse } from 'next/server';

// Mock data for demo purposes
// In production, this would query the EAS GraphQL endpoint
const MOCK_ATTESTATIONS = [
  {
    uid: '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef',
    projectName: 'Kiro-CI',
    commitHash: 'a7b8c9d0',
    timestamp: Date.now() - 300000,
    testsPassed: true,
    txHash: '0xabcdef1234567890'
  },
  {
    uid: '0x9876543210fedcba9876543210fedcba9876543210fedcba9876543210fedcba',
    projectName: 'Kiro-CI',
    commitHash: 'f4e3d2c1',
    timestamp: Date.now() - 600000,
    testsPassed: true,
    txHash: '0x0987654321fedcba'
  }
];

export async function GET() {
  try {
    // TODO: Replace with actual EAS GraphQL query
    // const attestations = await fetchRecentAttestations(10);
    
    // For demo, return mock data
    return NextResponse.json({
      success: true,
      attestations: MOCK_ATTESTATIONS
    });
  } catch (error) {
    console.error('Error fetching attestations:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch attestations' },
      { status: 500 }
    );
  }
}
