import { NextApiRequest, NextApiResponse } from 'next';
import { adminDb } from '../../lib/firebase-admin';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    console.log('🗑️ Starting to delete all alerts');
    
    // Get the alerts collection reference
    const alertsRef = adminDb.collection('pairScreener').doc('history').collection('alerts');
    
    // Get all documents
    const snapshot = await alertsRef.get();
    console.log(`📊 Found ${snapshot.size} alerts to delete`);

    // Delete all documents
    const batch = adminDb.batch();
    snapshot.docs.forEach(doc => {
      batch.delete(doc.ref);
    });
    
    await batch.commit();
    console.log('✅ All alerts deleted successfully');

    return res.status(200).json({
      success: true,
      message: 'All alerts deleted successfully',
      deletedCount: snapshot.size
    });
  } catch (error) {
    console.error('❌ Error deleting alerts:', error);
    return res.status(500).json({ 
      message: 'Internal server error',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
} 